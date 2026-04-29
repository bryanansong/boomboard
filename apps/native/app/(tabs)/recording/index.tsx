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
import { useCSSVariable } from "uniwind";

import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic, useHaptic } from "@/lib/hooks";
import { api } from "@boomboard/backend/convex/_generated/api";
import { Mic, Square, X, Check, RotateCcw, AudioWaveform } from "lucide-react-native";

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

	const mutedColor = (useCSSVariable("--muted") ?? "#8E8E93") as string;
	const primaryColor = (useCSSVariable("--primary") ?? "#007AFF") as string;
	const foregroundColor = (useCSSVariable("--foreground") ?? "#000000") as string;

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
			{/* Decorative rings behind mic icon */}
			<View className="relative items-center justify-center mb-8">
				<View
					className="absolute w-44 h-44 rounded-full border border-primary/10 dark:border-primary/15"
					style={{ borderCurve: "continuous" }}
				/>
				<View
					className="absolute w-36 h-36 rounded-full border border-primary/15 dark:border-primary/20"
					style={{ borderCurve: "continuous" }}
				/>
				<View
					className="items-center justify-center w-28 h-28 rounded-full bg-primary"
					style={{
						borderCurve: "continuous",
						boxShadow: "0 8px 32px rgba(0, 122, 255, 0.25)",
					}}
				>
					<Mic size={44} color="white" strokeWidth={1.8} />
				</View>
			</View>

			<Text className="mb-2 font-bold text-[24px] text-foreground tracking-tight">
				Ready to Record
			</Text>
			<Text className="px-12 text-center text-[15px] text-muted leading-[22px]">
				Capture a new sound for your library. Tap below to begin.
			</Text>

			<Pressable
				onPress={handleStartRecording}
				className="mt-10 px-10 py-4 bg-primary rounded-full active:scale-[0.97]"
				style={{
					borderCurve: "continuous",
					boxShadow: "0 4px 16px rgba(0, 122, 255, 0.3)",
				}}
			>
				<View className="flex-row items-center gap-2.5">
					<Mic size={20} color="white" strokeWidth={2} />
					<Text className="text-white font-semibold text-[17px]">Start Recording</Text>
				</View>
			</Pressable>
		</View>
	);

	// Render recording state with timer and controls
	const renderRecording = () => (
		<View className="flex-1 items-center justify-center py-50">
			{/* Recording indicator with pulsing rings */}
			<View className="relative items-center justify-center mb-10">
				<View
					className="absolute w-44 h-44 rounded-full bg-red-500/5 dark:bg-red-500/10 animate-pulse"
					style={{ borderCurve: "continuous" }}
				/>
				<View
					className="absolute w-36 h-36 rounded-full bg-red-500/10 dark:bg-red-500/15 animate-pulse"
					style={{ borderCurve: "continuous" }}
				/>
				<View
					className="items-center justify-center w-28 h-28 rounded-full bg-red-500"
					style={{
						borderCurve: "continuous",
						boxShadow: "0 8px 32px rgba(239, 68, 68, 0.35)",
					}}
				>
					{/* Minimal recording dot */}
					<View
						className="w-8 h-8 rounded-lg bg-white animate-pulse"
						style={{ borderCurve: "continuous" }}
					/>
				</View>
			</View>

			{/* Timer display */}
			<Text
				className="text-[52px] font-bold text-foreground mb-2 tracking-tight"
				style={{ fontVariant: ["tabular-nums"] }}
			>
				{formatDuration(elapsedTime)}
			</Text>
			<View className="flex-row items-center gap-2 mb-12">
				<View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
				<Text className="text-[15px] text-muted font-medium">Recording</Text>
			</View>

			{/* Recording controls */}
			<View className="flex-row items-center gap-8">
				{/* Cancel button */}
				<Pressable
					onPress={handleCancelRecording}
					className="items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border/40 dark:border-zinc-700/50 active:scale-[0.93]"
					style={{
						borderCurve: "continuous",
						boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
					}}
				>
					<X size={22} color={foregroundColor} strokeWidth={2} />
				</Pressable>

				{/* Stop/Save button */}
				<Pressable
					onPress={handleStopRecording}
					className="items-center justify-center w-20 h-20 rounded-full bg-primary active:scale-[0.93]"
					style={{
						borderCurve: "continuous",
						boxShadow: "0 6px 24px rgba(0, 122, 255, 0.35)",
					}}
				>
					<Square size={26} color="white" fill="white" />
				</Pressable>
			</View>
		</View>
	);

	// Render preview state (after recording, before saving)
	const renderPreview = () => (
		<View className="flex-1 items-center justify-center py-50">
			{/* Success indicator */}
			<View className="relative items-center justify-center mb-8">
				<View
					className="absolute w-36 h-36 rounded-full bg-primary/5 dark:bg-primary/10"
					style={{ borderCurve: "continuous" }}
				/>
				<View
					className="items-center justify-center w-24 h-24 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 border-2 border-primary/60 dark:border-primary/50"
					style={{
						borderCurve: "continuous",
						boxShadow: "0 2px 12px rgba(0, 122, 255, 0.12)",
					}}
				>
					<Check size={36} color={primaryColor} strokeWidth={2.5} />
				</View>
			</View>

			<Text className="mb-2 font-bold text-[24px] text-foreground tracking-tight">
				Recording Complete
			</Text>

			{/* Duration badge */}
			<View
				className="flex-row items-center gap-2 px-4 py-2 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full border border-border/30 dark:border-zinc-700/50 mb-2"
				style={{ borderCurve: "continuous" }}
			>
				<AudioWaveform size={14} color={mutedColor} strokeWidth={2} />
				<Text className="text-[15px] text-muted font-medium" style={{ fontVariant: ["tabular-nums"] }}>
					{formatDuration(elapsedTime)}
				</Text>
			</View>

			{/* Action buttons */}
			<View className="flex-row items-center gap-4 mt-8">
				<Pressable
					onPress={handleCancelRecording}
					className="items-center justify-center px-6 py-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border/40 dark:border-zinc-700/50 active:scale-[0.97]"
					style={{
						borderCurve: "continuous",
						boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
					}}
				>
					<View className="flex-row items-center gap-2">
						<RotateCcw size={16} color={foregroundColor} strokeWidth={2} />
						<Text className="text-foreground font-semibold text-[15px]">Retake</Text>
					</View>
				</Pressable>

				<Pressable
					onPress={handleSaveRecording}
					className="items-center justify-center px-8 py-3.5 rounded-full bg-primary active:scale-[0.97]"
					style={{
						borderCurve: "continuous",
						boxShadow: "0 4px 16px rgba(0, 122, 255, 0.3)",
					}}
				>
					<View className="flex-row items-center gap-2">
						<Check size={16} color="white" strokeWidth={2.5} />
						<Text className="text-white font-semibold text-[15px]">Save</Text>
					</View>
				</Pressable>
			</View>
		</View>
	);

	// Render saving state
	const renderSaving = () => (
		<View className="flex-1 items-center justify-center py-50">
			{/* Animated upload indicator */}
			<View className="relative items-center justify-center mb-8">
				<View
					className="absolute w-28 h-28 rounded-full border-2 border-primary/20 dark:border-primary/30 animate-pulse"
					style={{ borderCurve: "continuous" }}
				/>
				<ActivityIndicator size="large" color={primaryColor} />
			</View>
			<Text className="mb-2 font-bold text-[22px] text-foreground tracking-tight">
				Saving...
			</Text>
			<Text className="px-12 text-center text-[15px] text-muted leading-[22px]">
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
