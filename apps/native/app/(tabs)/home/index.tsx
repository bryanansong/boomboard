import { useState, useCallback, useEffect } from "react";
import { Text, View, Pressable, ActivityIndicator, SafeAreaView, ScrollView } from "react-native";
import { useQuery } from "convex/react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useTabFocusHaptic } from "@/lib/hooks";
import { api } from "@boomboard/backend/convex/_generated/api";
import { Play, Pause, Clock, HardDrive, AudioWaveform, Search, SlidersHorizontal } from "lucide-react-native";

function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface RecordingItemProps {
	recording: {
		_id: string;
		name: string;
		durationMs: number;
		fileSize: number;
		url: string | null;
	};
	isPlaying: boolean;
	onPlay: (url: string) => void;
	onPause: () => void;
	index: number;
}

function RecordingItem({ recording, isPlaying, onPlay, onPause, index }: RecordingItemProps) {
	const handlePress = useCallback(() => {
		if (isPlaying) {
			onPause();
		} else if (recording.url) {
			onPlay(recording.url);
		}
	}, [isPlaying, recording.url, onPlay, onPause]);

	return (
		<Pressable
			onPress={handlePress}
			className="mb-3 active:scale-[0.98]"
		>
			<View className="bg-[#1C1C1E] rounded-[24px] p-4 flex-row items-center">
				{/* Play/Pause Button */}
				<View className="relative mr-4">
					{isPlaying && (
						<View className="absolute -inset-1.5 rounded-full bg-[#DE4045]/20 animate-pulse" />
					)}
					<View
						className={`items-center justify-center w-[52px] h-[52px] rounded-full ${
							isPlaying ? "bg-[#DE4045]" : "bg-[#2C2C2E]"
						}`}
					>
						{isPlaying ? (
							<Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
						) : (
							<Play
								size={20}
								color="#A2D5F2"
								fill="#A2D5F2"
								style={{ marginLeft: 3 }}
							/>
						)}
					</View>
				</View>

				{/* Recording Info */}
				<View className="flex-1 justify-center">
					<Text
						className="font-medium text-white text-[16px] mb-2 tracking-wide"
						numberOfLines={1}
					>
						{recording.name}
					</Text>
					<View className="flex-row items-center gap-2">
						<View className="bg-[#2C2C2E] px-2.5 py-1 rounded-md flex-row items-center gap-1.5">
							<Clock size={10} color="#8E8E93" />
							<Text className="text-[#8E8E93] text-[10px] font-semibold tracking-wider">
								{formatDuration(recording.durationMs)}
							</Text>
						</View>
						<View className="bg-[#2C2C2E] px-2.5 py-1 rounded-md flex-row items-center gap-1.5">
							<HardDrive size={10} color="#8E8E93" />
							<Text className="text-[#8E8E93] text-[10px] font-semibold tracking-wider">
								{formatFileSize(recording.fileSize)}
							</Text>
						</View>
					</View>
				</View>

				{/* Waveform indicator when playing */}
				{isPlaying ? (
					<View className="flex-row items-end gap-[3px] ml-2 h-6">
						{[10, 16, 12, 18, 14, 8].map((h, i) => (
							<View
								key={i}
								className="w-[3px] rounded-full bg-[#DE4045] animate-pulse"
								style={{ height: h, animationDelay: `${i * 100}ms` } as any}
							/>
						))}
					</View>
				) : (
                    <View className="flex-row items-center justify-center w-8 h-8 rounded-full bg-[#121212]/50 border border-[#2C2C2E]">
                        <Text className="text-[#8E8E93] text-lg font-bold" style={{ marginTop: -8 }}>...</Text>
                    </View>
                )}
			</View>
		</Pressable>
	);
}

export default function SoundLibraryScreen() {
	useTabFocusHaptic();

	const recordings = useQuery(api.recordings.list) ?? [];
	const isLoading = recordings === undefined;

	const player = useAudioPlayer(null);
	const playerStatus = useAudioPlayerStatus(player);
	const [currentUrl, setCurrentUrl] = useState<string | null>(null);

	useEffect(() => {
		if (playerStatus.didJustFinish) {
			setCurrentUrl(null);
		}
	}, [playerStatus.didJustFinish]);

	const handlePlay = useCallback(
		(url: string) => {
			if (currentUrl === url) {
				const isFinished =
					playerStatus.duration > 0 &&
					playerStatus.currentTime >= playerStatus.duration - 0.1;
				if (isFinished) {
					player.replace(url);
				}
				player.play();
			} else {
				player.replace(url);
				player.play();
				setCurrentUrl(url);
			}
		},
		[currentUrl, player, playerStatus.currentTime, playerStatus.duration]
	);

	const handlePause = useCallback(() => {
		player.pause();
	}, [player]);

	return (
		<SafeAreaView className="flex-1 bg-[#121212]">
			<View className="flex-row items-center justify-between px-5 pt-4 pb-2 mb-4">
				<View>
					<Text className="text-[#8E8E93] text-[12px] font-bold tracking-widest uppercase mb-1">
						Library
					</Text>
					<Text className="text-white text-[32px] font-semibold tracking-tighter">
						My Sounds
					</Text>
				</View>
			</View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Stats Header */}
                {!isLoading && recordings.length > 0 && (
                    <View className="flex-row items-center justify-between mb-6 px-1">
                        <Text className="text-[#8E8E93] text-[14px] font-medium">
                            {recordings.length} {recordings.length === 1 ? 'Recording' : 'Recordings'}
                        </Text>
                    </View>
                )}

                {/* Loading State */}
                {isLoading && (
                    <View className="items-center py-32">
                        <ActivityIndicator size="large" color="#A2D5F2" />
                        <Text className="text-[#8E8E93] text-sm mt-6 font-medium">
                            Loading your sounds...
                        </Text>
                    </View>
                )}

                {/* Empty State */}
                {!isLoading && recordings.length === 0 && (
                    <View className="items-center justify-center py-24 flex-1">
                        <View className="relative mb-8 items-center justify-center">
                            <View className="absolute w-32 h-32 rounded-full border border-[#2C2C2E]/50" />
                            <View className="absolute w-24 h-24 rounded-full border border-[#2C2C2E]" />
                            <View className="items-center justify-center w-16 h-16 rounded-full bg-[#1C1C1E]">
                                <AudioWaveform size={24} color="#8E8E93" />
                            </View>
                        </View>
                        <Text className="mb-3 font-semibold text-white text-[22px] tracking-tight">
                            No sounds yet
                        </Text>
                        <Text className="text-center text-[15px] text-[#8E8E93] px-10 leading-[24px]">
                            Capture your first recording to build your library. It will appear here.
                        </Text>
                    </View>
                )}

                {/* Recordings List */}
                {!isLoading && recordings.length > 0 && (
                    <View>
                        {recordings.map((recording, index) => (
                            <RecordingItem
                                key={recording._id}
                                recording={recording}
                                isPlaying={
                                    playerStatus.playing && currentUrl === recording.url
                                }
                                onPlay={handlePlay}
                                onPause={handlePause}
                                index={index}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
		</SafeAreaView>
	);
}
