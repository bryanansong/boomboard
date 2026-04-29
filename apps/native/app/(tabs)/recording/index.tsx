import { useState, useCallback, useEffect, useRef } from "react";
import { Text, View, Pressable, Alert, ActivityIndicator, TextInput, SafeAreaView } from "react-native";
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

import { useTabFocusHaptic, useHaptic } from "@/lib/hooks";
import { api } from "@boomboard/backend/convex/_generated/api";
import { Mic, Square, X, Check, RotateCcw, AudioWaveform, Maximize, Sun, ChevronLeft, Scissors, Share, Lock, Info } from "lucide-react-native";
import { useToast } from "heroui-native";

type RecordingPhase = "idle" | "recording" | "paused" | "saving" | "preview";

// Helper for formatting duration to match the image "0h 00m 40s"
function formatDurationDetailed(ms: number) {
	const totalSeconds = Math.floor(ms / 1000);
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	return { h, m, s };
}

export default function RecordingScreen() {
	useTabFocusHaptic();
	const { medium, success, error } = useHaptic();
	const { toast } = useToast();

	const [phase, setPhase] = useState<RecordingPhase>("idle");
	const [recordingName, setRecordingName] = useState("");
	const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
	const accumulatedTimeRef = useRef<number>(0);
	const lastTickTimeRef = useRef<number>(0);
	const [elapsedTime, setElapsedTime] = useState(0);
	const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Simulated waveform
	const [waveform, setWaveform] = useState<number[]>(Array(40).fill(10));

	// Convex mutations
	const generateUploadUrl = useMutation(api.recordings.generateUploadUrl);
	const createRecording = useMutation(api.recordings.create);

	// Audio recorder setup with high quality presets
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	// We keep this to ensure the recorder state is tracked if needed internally
	useAudioRecorderState(recorder, 100);

	// Timer effect for recording duration and simulated waveform
	useEffect(() => {
		if (phase === "recording") {
			lastTickTimeRef.current = Date.now();
			timerIntervalRef.current = setInterval(() => {
				const now = Date.now();
				const delta = now - lastTickTimeRef.current;
				lastTickTimeRef.current = now;
				accumulatedTimeRef.current += delta;
				setElapsedTime(accumulatedTimeRef.current);

				setWaveform((prev) => {
					// Simulate active audio waveform metering
					const newWave = [...prev.slice(1), Math.random() * 35 + 10];
					return newWave;
				});
			}, 100);
		} else {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}
			// Reset waveform if not in preview or paused
			if (phase === "idle") {
				setWaveform(Array(40).fill(10));
				accumulatedTimeRef.current = 0;
				setElapsedTime(0);
			}
		}

		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
		};
	}, [phase]);

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

		await setAudioModeAsync({
			allowsRecording: true,
			playsInSilentMode: true,
			interruptionMode: "doNotMix",
		});

		return true;
	}, []);

	const handleStartRecording = useCallback(async () => {
		const hasPermission = await ensurePermissions();
		if (!hasPermission) return;

		try {
			medium();
			await recorder.prepareToRecordAsync();
			recorder.record();
			accumulatedTimeRef.current = 0;
			setElapsedTime(0);
			setPhase("recording");
		} catch (err) {
			console.error("Failed to start recording:", err);
			Alert.alert("Error", "Failed to start recording. Please try again.");
		}
	}, [ensurePermissions, recorder, medium]);

	const handlePauseRecording = useCallback(() => {
		try {
			recorder.pause();
			medium();
			setPhase("paused");
		} catch (err) {
			console.error("Failed to pause recording:", err);
		}
	}, [recorder, medium]);

	const handleResumeRecording = useCallback(() => {
		try {
			recorder.record();
			medium();
			setPhase("recording");
		} catch (err) {
			console.error("Failed to resume recording:", err);
		}
	}, [recorder, medium]);

	const handleStopRecording = useCallback(async () => {
		try {
			await recorder.stop();
			medium();

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

	const handleCancelRecording = useCallback(() => {
		if (phase === "recording" || phase === "paused") {
			recorder.stop().catch(() => {});
		}
		setPhase("idle");
		accumulatedTimeRef.current = 0;
		setElapsedTime(0);
		setLastRecordingUri(null);
		setRecordingName("");
	}, [phase, recorder]);

	const handleSaveRecording = useCallback(async () => {
		if (!lastRecordingUri) return;

		setPhase("saving");

		try {
			const uploadUrl = await generateUploadUrl();

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

			const name = recordingName.trim() || `new_voice_${new Date().getFullYear()}.mp3`;
			await createRecording({
				storageId,
				name,
				durationMs: elapsedTime,
			});

			success();
			toast.show({
				variant: "success",
				label: "Saved!",
				description: "Your recording has been added to your library.",
			});
			router.push("/(tabs)/home" as never);

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

	// Button configuration logic
	const getLeftButton = () => {
		if (phase === "idle") return { icon: <Square size={20} color="#8E8E93" fill="#8E8E93" />, text: "STOP", disabled: true, onPress: () => {} };
		if (phase === "recording" || phase === "paused") return { icon: <Square size={20} color="#FFFFFF" fill="#FFFFFF" />, text: "STOP", disabled: false, onPress: handleStopRecording };
		if (phase === "preview") return { icon: <RotateCcw size={20} color="#FFFFFF" />, text: "RETAKE", disabled: false, onPress: handleCancelRecording };
		if (phase === "saving") return { icon: <Square size={20} color="#8E8E93" fill="#8E8E93" />, text: "STOP", disabled: true, onPress: () => {} };
		return { icon: <Square size={20} color="#8E8E93" fill="#8E8E93" />, text: "", disabled: true, onPress: () => {} };
	};

	const getRightButton = () => {
		if (phase === "idle") return { icon: <View className="w-4 h-4 bg-[#DE4045] rounded-full" />, text: "RECORD", color: "bg-transparent border-2 border-[#DE4045]", onPress: handleStartRecording };
		if (phase === "recording") return { 
            icon: (
                <View className="flex-row items-center gap-1.5">
                    <View className="w-1.5 h-4 bg-[#DE4045] rounded-sm" />
                    <View className="w-1.5 h-4 bg-[#DE4045] rounded-sm" />
                </View>
            ), 
            text: "PAUSE", 
            color: "bg-transparent border-2 border-[#DE4045]", 
            onPress: handlePauseRecording
        };
		if (phase === "paused") return { icon: <View className="w-4 h-4 bg-[#DE4045] rounded-full" />, text: "RESUME", color: "bg-transparent border-2 border-[#DE4045]", onPress: handleResumeRecording };
		if (phase === "preview") return { icon: <Check size={20} color="#9FD4F4" />, text: "SAVE", color: "bg-transparent border-2 border-[#9FD4F4]", onPress: handleSaveRecording };
		if (phase === "saving") return { icon: <ActivityIndicator color="#9FD4F4" />, text: "SAVING...", color: "bg-transparent border-2 border-[#9FD4F4]", onPress: () => {} };
		return { icon: null, text: "", color: "", onPress: () => {} };
	};

	const leftBtn = getLeftButton();
	const rightBtn = getRightButton();
	const time = formatDurationDetailed(elapsedTime);

	return (
		<SafeAreaView className="flex-1 bg-[#121212]">
            <View className="flex-1 px-5 pt-4 pb-2">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-8">
                    <View className="flex-row items-center flex-1">
                        <Pressable onPress={() => router.push("/(tabs)/home" as never)} className="mr-3 p-1 active:opacity-50">
                            <ChevronLeft color="#FFFFFF" size={24} />
                        </Pressable>
                        {phase === "preview" ? (
                            <TextInput 
                                value={recordingName}
                                onChangeText={setRecordingName}
                                placeholder="new_voice2022.mp3"
                                placeholderTextColor="#8E8E93"
                                className="text-white text-[17px] font-medium flex-1 h-10"
                                autoFocus
                            />
                        ) : (
                            <Text className="text-white text-[17px] font-medium flex-1" numberOfLines={1}>
                                {recordingName || "new_voice2022.mp3"}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Top Blue Card */}
                <View className="bg-[#A2D5F2] rounded-3xl p-5 mb-5 shadow-sm">
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-row items-baseline">
                            <Text className="text-[44px] font-medium text-[#1A2831] tracking-tighter" style={{ fontVariant: ['tabular-nums'] }}>{time.h}</Text>
                            <Text className="text-[18px] font-semibold text-[#1A2831] mr-2 ml-0.5">h</Text>
                            <Text className="text-[44px] font-medium text-[#1A2831] tracking-tighter" style={{ fontVariant: ['tabular-nums'] }}>{time.m.toString().padStart(2, "0")}</Text>
                            <Text className="text-[18px] font-semibold text-[#1A2831] mr-2 ml-0.5">m</Text>
                            <Text className="text-[44px] font-medium text-[#1A2831] tracking-tighter" style={{ fontVariant: ['tabular-nums'] }}>{time.s.toString().padStart(2, "0")}</Text>
                            <Text className="text-[18px] font-semibold text-[#1A2831] ml-0.5">s</Text>
                        </View>
                        <View className="bg-[#1A2831]/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 mt-2">
                            <View className={`w-2 h-2 rounded-full ${phase === 'recording' ? 'bg-red-500 animate-pulse' : (phase === 'paused' ? 'bg-red-500' : 'bg-red-500/50')}`} />
                            <Text className="text-[#1A2831] text-[11px] font-bold tracking-widest">{phase === 'paused' ? 'PAUSED' : 'REC'}</Text>
                        </View>
                    </View>
                </View>

                {/* Waveform Section */}
                <View className="bg-[#1C1C1E] rounded-3xl p-5 flex-1 mb-5 justify-between">
									{/* <View className="flex-row justify-end mb-4">
										<View className="items-end gap-1.5">
												<Text className="text-[#8E8E93] text-[10px] font-medium">10</Text>
												<Text className="text-[#8E8E93] text-[10px] font-medium">20</Text>
												<Text className="text-[#8E8E93] text-[10px] font-medium">0</Text>
												<Text className="text-[#8E8E93] text-[10px] font-medium">-10</Text>
												<Text className="text-[#8E8E93] text-[10px] font-medium">-20</Text>
										</View>
									</View> */}
                    
									{/* Simulated Waveform Visualization */}
									<View className="flex-row items-center justify-center gap-[3px] h-28 mb-3 relative overflow-hidden">
										{waveform.map((val, i) => (
												<View 
														key={i} 
														className={`w-1 rounded-full ${phase === 'preview' ? 'bg-[#9FD4F4]' : 'bg-[#8E8E93]'}`} 
														style={{ height: val }} 
												/>
										))}
										{/* Red center timeline */}
										<View className="absolute z-10 w-[2px] h-full bg-[#DE4045] rounded-full" style={{ left: '50%' }} />
										<View className="absolute z-10 w-1.5 h-1.5 bg-[#DE4045] rounded-full top-0" style={{ left: 'calc(50% - 2px)' }} />
										<View className="absolute z-10 w-1.5 h-1.5 bg-[#DE4045] rounded-full bottom-0" style={{ left: 'calc(50% - 2px)' }} />
									</View>

                    <View className="flex-row items-center justify-between px-2 mb-2">
                        <Text className="text-[#8E8E93] text-[10px] font-medium">00:00</Text>
                        <Text className="text-[#8E8E93] text-[10px]">|</Text>
                        <Text className="text-[#8E8E93] text-[10px]">|</Text>
                        <Text className="text-[#8E8E93] text-[10px] font-medium">00:15</Text>
                        <Text className="text-[#8E8E93] text-[10px]">|</Text>
                        <Text className="text-[#8E8E93] text-[10px]">|</Text>
                        <Text className="text-[#8E8E93] text-[10px] font-medium">00:30</Text>
                    </View>
                </View>

                {/* Bottom Controls */}
                <View className="bg-[#1C1C1E] rounded-[48px] p-2.5 flex-row items-center mb-2">
                    {/* Left Button */}
                    <Pressable 
                        onPress={leftBtn.onPress}
                        disabled={leftBtn.disabled}
                        className={`w-[76px] h-[76px] rounded-full items-center justify-center mr-3 ${leftBtn.disabled ? 'bg-[#121212]' : 'bg-[#2C2C2E] active:scale-95'}`}
                    >
                        {leftBtn.icon}
                    </Pressable>
                    
                    {/* Right Button */}
                    <Pressable 
                        onPress={rightBtn.onPress}
                        disabled={phase === "saving"}
                        className={`flex-1 ${rightBtn.color} rounded-[40px] h-[76px] flex-row items-center justify-center gap-3 active:scale-[0.98]`}
                    >
                        {rightBtn.icon}
                    </Pressable>
                </View>
                
                <View className="flex-row items-center justify-between px-6 pb-2">
                    <Text className="text-[#8E8E93] text-[11px] font-bold tracking-widest w-[76px] text-center ml-2">{leftBtn.text}</Text>
                    <Text className="text-[#8E8E93] text-[11px] font-bold tracking-widest flex-1 text-center pl-6">{rightBtn.text}</Text>
                </View>
            </View>
		</SafeAreaView>
	);
}
