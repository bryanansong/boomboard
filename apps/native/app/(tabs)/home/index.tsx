import { useState, useCallback, useEffect } from "react";
import { Text, View, Pressable, ActivityIndicator, SafeAreaView, ScrollView } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useTabFocusHaptic } from "@/lib/hooks";
import { api } from "@boomboard/backend/convex/_generated/api";
import { Play, Pause, Clock, HardDrive, AudioWaveform, Search, SlidersHorizontal, MoreVertical } from "lucide-react-native";
import { useToast, Dialog, Button } from "heroui-native";

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
	progress: number;
	onPlay: (url: string) => void;
	onPause: () => void;
    onDelete: (id: string) => void;
	index: number;
}

function RecordingItem({ recording, isPlaying, progress, onPlay, onPause, onDelete, index }: RecordingItemProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const handlePress = useCallback(() => {
		if (isPlaying) {
			onPause();
		} else if (recording.url) {
			onPlay(recording.url);
		}
	}, [isPlaying, recording.url, onPlay, onPause]);

    const handleDeleteIconPress = useCallback(() => {
        setIsDeleteDialogOpen(true);
    }, []);

	return (
		<View className="mb-3">
			<View className="bg-[#1C1C1E] rounded-[24px] p-3.5 pr-4 flex-row items-center">
				{/* Play/Pause Button */}
				<Pressable onPress={handlePress} className="relative mr-4 active:scale-95">
					{isPlaying && (
						<View className="absolute -inset-1.5 rounded-full bg-[#DE4045]/20 animate-pulse" />
					)}
					<View
						className={`items-center justify-center w-[48px] h-[48px] rounded-full ${
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
				</Pressable>

				{/* Recording Info */}
				<View className="flex-1 justify-center ml-1">
					<Text
						className="font-semibold text-white text-[15px] mb-1 tracking-tight"
						numberOfLines={1}
					>
						{recording.name}
					</Text>
					<Text className="text-[#8E8E93] text-[12px] font-medium tracking-wide">
						{formatDuration(recording.durationMs)}
					</Text>

                    {/* Playback Progress Bar */}
                    {(isPlaying || progress > 0) && (
                        <View className="h-1 bg-[#2C2C2E] rounded-full mt-3 overflow-hidden">
                            <View 
                                className="h-full bg-[#A2D5F2] rounded-full" 
                                style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
                            />
                        </View>
                    )}
				</View>

                <View className="flex-row items-center gap-3 ml-2">
                    {/* Waveform indicator when playing */}
                    {isPlaying && (
                        <View className="flex-row items-end gap-[3px] h-6">
                            {[10, 16, 12, 18, 14, 8].map((h, i) => (
                                <View
                                    key={i}
                                    className="w-[3px] rounded-full bg-[#DE4045] animate-pulse"
                                    style={{ height: h, animationDelay: `${i * 100}ms` } as any}
                                />
                            ))}
                        </View>
                    )}
                    
                    {/* Options Button */}
                    <Pressable onPress={handleDeleteIconPress} className="flex-row items-center justify-center w-8 h-8 rounded-full bg-[#121212]/50 border border-[#2C2C2E] active:scale-95">
                        <MoreVertical size={16} color="#8E8E93" />
                    </Pressable>
                </View>
			</View>

            <Dialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="bg-black/60" />
                    <Dialog.Content className="bg-[#1C1C1E] rounded-[32px] p-6 max-w-[90%] w-full self-center m-auto">
                        <Dialog.Title className="text-white text-[20px] font-semibold mb-2">Delete Recording</Dialog.Title>
                        <Dialog.Description className="text-[#8E8E93] text-[15px] leading-6 mb-6">
                            Are you sure you want to delete "{recording.name}"?
                        </Dialog.Description>
                        <View className="flex-row justify-end gap-3 mt-2">
                            <Button variant="ghost" size="sm" onPress={() => setIsDeleteDialogOpen(false)}>
                                <Text className="text-white font-medium">Cancel</Text>
                            </Button>
                            <Button variant="danger" size="sm" onPress={() => {
                                setIsDeleteDialogOpen(false);
                                onDelete(recording._id);
                            }}>
                                <Text className="text-white font-medium">Delete</Text>
                            </Button>
                        </View>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>
		</View>
	);
}

export default function SoundLibraryScreen() {
	useTabFocusHaptic();

	const recordings = useQuery(api.recordings.list) ?? [];
	const isLoading = recordings === undefined;
    const removeRecording = useMutation(api.recordings.remove);
    const { toast } = useToast();

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

    const handleDelete = useCallback(async (id: string) => {
        try {
            await removeRecording({ recordingId: id as any });
            toast.show({
                variant: "success",
                label: "Deleted",
                description: "Recording successfully removed.",
            });
        } catch (error) {
            console.error("Failed to delete recording:", error);
            toast.show({
                variant: "danger",
                label: "Error",
                description: "Failed to delete recording.",
            });
        }
    }, [removeRecording, toast]);

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
                                progress={
                                    currentUrl === recording.url && playerStatus.duration > 0
                                        ? playerStatus.currentTime / playerStatus.duration
                                        : 0
                                }
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onDelete={handleDelete}
                                index={index}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
		</SafeAreaView>
	);
}
