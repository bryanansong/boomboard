import { useState, useCallback, useEffect } from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic } from "@/lib/hooks";
import { api } from "@boomboard/backend/convex/_generated/api";
import { Play, Pause, Music, Clock, HardDrive } from "lucide-react-native";

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
}

function RecordingItem({ recording, isPlaying, onPlay, onPause }: RecordingItemProps) {
	const handlePress = useCallback(() => {
		if (isPlaying) {
			onPause();
		} else if (recording.url) {
			onPlay(recording.url);
		}
	}, [isPlaying, recording.url, onPlay, onPause]);

	return (
		<View className="flex-row items-center p-4 bg-surface rounded-2xl mb-3 shadow-sm">
			{/* Play/Pause Button */}
			<Pressable
				onPress={handlePress}
				className="items-center justify-center w-12 h-12 rounded-full bg-primary mr-4 active:opacity-80"
			>
				{isPlaying ? (
					<Pause size={20} color="white" fill="white" />
				) : (
					<Play size={20} color="white" fill="white" />
				)}
			</Pressable>

			{/* Recording Info */}
			<View className="flex-1">
				<Text className="font-semibold text-foreground text-base mb-1" numberOfLines={1}>
					{recording.name}
				</Text>
				<View className="flex-row items-center gap-3">
					<View className="flex-row items-center gap-1">
						<Clock size={12} />
						<Text className="text-muted text-xs">
							{formatDuration(recording.durationMs)}
						</Text>
					</View>
					<View className="flex-row items-center gap-1">
						<HardDrive size={12} />
						<Text className="text-muted text-xs">
							{formatFileSize(recording.fileSize)}
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}

/**
 * Sound Library screen with native iOS large title header.
 *
 * Displays all recordings by the current user with playback controls.
 */
export default function SoundLibraryScreen() {
	useTabFocusHaptic();

	// Fetch recordings from Convex
	const recordings = useQuery(api.recordings.list) ?? [];
	const isLoading = recordings === undefined;

	// Audio player for playback
	const player = useAudioPlayer(null);
	const playerStatus = useAudioPlayerStatus(player);
	const [currentUrl, setCurrentUrl] = useState<string | null>(null);

	// Reset current track when it finishes so it can be replayed
	useEffect(() => {
		if (playerStatus.didJustFinish) {
			setCurrentUrl(null);
		}
	}, [playerStatus.didJustFinish]);

	const handlePlay = useCallback(
		(url: string) => {
			if (currentUrl === url) {
				// Same track — check if it finished and needs to reload from start
				const isFinished =
					playerStatus.duration > 0 &&
					playerStatus.currentTime >= playerStatus.duration - 0.1;
				if (isFinished) {
					player.replace(url);
				}
				player.play();
			} else {
				// Load and play new track
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
		<TabScreenScrollView contentContainerClassName="px-5">
			{/* Header */}
			<View className="mb-6">
				<Text className="mb-1 font-semibold text-[13px] text-muted uppercase tracking-wider">
					My Sounds
				</Text>
				<Text className="text-sm text-muted">
					{isLoading
						? "Loading..."
						: `${recordings.length} sound${recordings.length !== 1 ? "s" : ""} in your library`}
				</Text>
			</View>

			{/* Loading State */}
			{isLoading && (
				<View className="items-center py-10">
					<ActivityIndicator size="large" color="var(--color-primary)" />
				</View>
			)}

			{/* Empty State */}
			{!isLoading && recordings.length === 0 && (
				<View className="items-center py-10">
					<View className="items-center justify-center w-20 h-20 rounded-full bg-surface mb-4">
						<Music size={32} />
					</View>
					<Text className="mb-1 font-semibold text-foreground text-lg">
						No sounds yet
					</Text>
					<Text className="text-center text-base text-muted px-10">
						Your saved sounds will appear here. Go to Record to add some!
					</Text>
				</View>
			)}

			{/* Recordings List */}
			{!isLoading && recordings.length > 0 && (
				<View>
					{recordings.map((recording) => (
						<RecordingItem
							key={recording._id}
							recording={recording}
							isPlaying={
								playerStatus.playing && currentUrl === recording.url
							}
							onPlay={handlePlay}
							onPause={handlePause}
						/>
					))}
				</View>
			)}
		</TabScreenScrollView>
	);
}
