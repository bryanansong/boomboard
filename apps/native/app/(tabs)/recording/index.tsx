import { useState, useCallback, useEffect, useRef } from "react";
import { Text, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { useMutation } from "convex/react";
import {
	useAudioRecorder,
	useAudioRecorderState,
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
} from "expo-audio";
import { uploadAsync, FileSystemUploadType } from "expo-file-system/legacy";
import { router } from "expo-router";

import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic, useHaptic } from "@/lib/hooks";
import { api } from "@boomboard/backend/convex/_generated/api";
import { Mic, Square, X, Check, RotateCcw } from "lucide-react-native";

type RecordingPhase = "idle" | "recording" | "saving" | "preview";

function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Recording screen with native iOS large title header.
 *
 * Uses expo-audio for recording and Convex for storage.
 * Flow: idle -> recording -> preview -> saving -> idle
 */
export default function RecordingScreen() {
	useTabFocusHaptic();
	const { medium, success, error } = useHaptic();

	const [phase, setPhase] = useState<RecordingPhase>("idle");
	const [recordingName, setRecordingName] = useState("");
	const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
	const recordingStartTimeRef = useRef<number>(0);
	const [elapsedTime, setElapsedTime] = useState(0);
	const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Convex mutations
	const generateUploadUrl = useMutation(api.recordings.generateUploadUrl);
	const createRecording = useMutation(api.recordings.create);

	// Audio recorder setup with high quality presets
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const recorderState = useAudioRecorderState(recorder, 100);

	// Timer effect for recording duration
	useEffect(() => {
		if (phase === "recording") {
			timerIntervalRef.current = setInterval(() => {
				setElapsedTime(Date.now() - recordingStartTimeRef.current);
			}, 100);
		} else {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}
		}

		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
		};
	}, [phase]);

	// Request microphone permission and configure audio mode
	const ensurePermissions = useCallback(async () => {
		const { granted } = await requestRecordingPermissionsAsync();
		if (!granted) {
			Alert.alert(
				"Microphone Access Required",
				"Please grant microphone permission in Settings to record audio.",
				[{ text: "OK" }]
			);
			return false;
		}

		// Configure audio mode for recording
		await setAudioModeAsync({
			allowsRecording: true,
			playsInSilentMode: true,
			interruptionMode: "doNotMix",
		});

		return true;
	}, []);

	// Start recording
	const handleStartRecording = useCallback(async () => {
		const hasPermission = await ensurePermissions();
		if (!hasPermission) return;

		try {
			medium();
			await recorder.prepareToRecordAsync();
			recorder.record();
			recordingStartTimeRef.current = Date.now();
			setElapsedTime(0);
			setPhase("recording");
		} catch (err) {
			console.error("Failed to start recording:", err);
			Alert.alert("Error", "Failed to start recording. Please try again.");
		}
	}, [ensurePermissions, recorder, medium]);

	// Stop recording and move to preview phase
	const handleStopRecording = useCallback(async () => {
		try {
			await recorder.stop();
			medium();

			// Get the recording URI
			const uri = recorder.uri;
			if (uri) {
				setLastRecordingUri(uri);
				setPhase("preview");
			} else {
				throw new Error("No recording URI available");
			}
		} catch (err) {
			console.error("Failed to stop recording:", err);
			Alert.alert("Error", "Failed to stop recording. Please try again.");
			setPhase("idle");
		}
	}, [recorder, medium]);

	// Cancel recording (discard)
	const handleCancelRecording = useCallback(() => {
		if (phase === "recording") {
			recorder.stop().catch(() => {});
		}
		setPhase("idle");
		setElapsedTime(0);
		setLastRecordingUri(null);
		setRecordingName("");
	}, [phase, recorder]);

	// Save recording to Convex
	const handleSaveRecording = useCallback(async () => {
		if (!lastRecordingUri) return;

		setPhase("saving");

		try {
			// Step 1: Generate upload URL from Convex
			const uploadUrl = await generateUploadUrl();

			// Step 2: Upload the local audio file using expo-file-system
			// (React Native fetch doesn't handle Blob uploads from file URIs well)
			const uploadResult = await uploadAsync(
				uploadUrl,
				lastRecordingUri,
				{
					httpMethod: "POST",
					uploadType: FileSystemUploadType.BINARY_CONTENT,
					headers: {
						"Content-Type": "audio/m4a",
					},
				}
			);

			if (uploadResult.status !== 200) {
				throw new Error(`Upload failed: ${uploadResult.status}`);
			}

			const { storageId } = JSON.parse(uploadResult.body);

			// Step 3: Create the recording document in Convex
			const name = recordingName.trim() || `Recording ${new Date().toLocaleString()}`;
			await createRecording({
				storageId,
				name,
				durationMs: elapsedTime,
			});

			success();
			Alert.alert("Success", "Your recording has been saved to your library!", [
				{
					text: "OK",
					onPress: () => {
						// Navigate to library to see the saved recording
						router.push("/(tabs)/home" as never);
					},
				},
			]);

			// Reset state
			setPhase("idle");
			setElapsedTime(0);
			setLastRecordingUri(null);
			setRecordingName("");
		} catch (err) {
			console.error("Failed to save recording:", err);
			error();
			Alert.alert(
				"Save Failed",
				"Unable to save your recording. Please check your connection and try again.",
				[
					{ text: "Retry", onPress: () => handleSaveRecording() },
					{ text: "Cancel", style: "cancel", onPress: () => setPhase("preview") },
				]
			);
		}
	}, [lastRecordingUri, generateUploadUrl, createRecording, recordingName, elapsedTime, success, error]);

	// Render idle state
	const renderIdle = () => (
		<View className="flex-1 items-center justify-center py-50">
			<View className="items-center justify-center w-28 h-28 rounded-full bg-primary mb-6 shadow-lg">
				<Mic size={48} color="white" />
			</View>
			<Text className="mb-2 font-semibold text-[22px] text-foreground">
				Tap to Record
			</Text>
			<Text className="px-10 text-center text-base text-muted leading-[22px]">
				Capture a new sound for your library. Press the button below to start.
			</Text>
			<Pressable
				onPress={handleStartRecording}
				className="mt-8 px-8 py-4 bg-primary rounded-full active:opacity-80"
			>
				<Text className="text-white font-semibold text-lg">Start Recording</Text>
			</Pressable>
		</View>
	);

	// Render recording state with timer and controls
	const renderRecording = () => (
		<View className="flex-1 items-center justify-center py-50">
			{/* Recording indicator pulse */}
			<View className="relative mb-8">
				<View className="absolute inset-0 bg-red-500 rounded-full opacity-20 scale-150 animate-pulse" />
				<View className="items-center justify-center w-28 h-28 rounded-full bg-red-500 shadow-lg">
					<View className="w-4 h-4 rounded-full bg-white" />
				</View>
			</View>

			{/* Timer display */}
			<Text className="text-5xl font-bold text-foreground mb-2 font-mono">
				{formatDuration(elapsedTime)}
			</Text>
			<Text className="text-base text-muted mb-10">Recording...</Text>

			{/* Recording controls */}
			<View className="flex-row items-center gap-6">
				{/* Cancel button */}
				<Pressable
					onPress={handleCancelRecording}
					className="items-center justify-center w-16 h-16 rounded-full bg-surface border border-border active:opacity-70"
				>
					<X size={24} color="var(--color-foreground)" />
				</Pressable>

				{/* Stop/Save button */}
				<Pressable
					onPress={handleStopRecording}
					className="items-center justify-center w-20 h-20 rounded-full bg-primary active:opacity-80 shadow-lg"
				>
					<Square size={28} color="white" fill="white" />
				</Pressable>
			</View>
		</View>
	);

	// Render preview state (after recording, before saving)
	const renderPreview = () => (
		<View className="flex-1 items-center justify-center py-50">
			<View className="items-center justify-center w-24 h-24 rounded-full bg-surface mb-6 border-2 border-primary">
				<Check size={40} color="var(--color-primary)" />
			</View>

			<Text className="mb-2 font-semibold text-[22px] text-foreground">
				Recording Complete
			</Text>
			<Text className="text-base text-muted mb-2">
				Duration: {formatDuration(elapsedTime)}
			</Text>

			{/* Action buttons */}
			<View className="flex-row items-center gap-4 mt-8">
				<Pressable
					onPress={handleCancelRecording}
					className="items-center justify-center px-6 py-3 rounded-full bg-surface border border-border active:opacity-70"
				>
					<View className="flex-row items-center gap-2">
						<RotateCcw size={18} color="var(--color-foreground)" />
						<Text className="text-foreground font-medium">Retake</Text>
					</View>
				</Pressable>

				<Pressable
					onPress={handleSaveRecording}
					className="items-center justify-center px-8 py-3 rounded-full bg-primary active:opacity-80 shadow-lg"
				>
					<View className="flex-row items-center gap-2">
						<Check size={18} color="white" />
						<Text className="text-white font-semibold">Save</Text>
					</View>
				</Pressable>
			</View>
		</View>
	);

	// Render saving state
	const renderSaving = () => (
		<View className="flex-1 items-center justify-center py-50">
			<ActivityIndicator size="large" color="var(--color-primary)" className="mb-6" />
			<Text className="mb-2 font-semibold text-[22px] text-foreground">
				Saving...
			</Text>
			<Text className="px-10 text-center text-base text-muted">
				Uploading your recording to the cloud. This may take a moment.
			</Text>
		</View>
	);

	return (
		<TabScreenScrollView contentContainerClassName="px-5">
			{phase === "idle" && renderIdle()}
			{phase === "recording" && renderRecording()}
			{phase === "preview" && renderPreview()}
			{phase === "saving" && renderSaving()}
		</TabScreenScrollView>
	);
}
