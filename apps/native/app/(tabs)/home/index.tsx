import { useState, useCallback, useEffect } from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic } from "@/lib/hooks";
import { api } from "@boomboard/backend/convex/_generated/api";
import { Play, Pause, Music, Clock, HardDrive, AudioWaveform } from "lucide-react-native";
import { useCSSVariable } from "uniwind";

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
	const mutedColor = (useCSSVariable("--muted") ?? "#8E8E93") as string;

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
			style={{ borderCurve: "continuous" }}
		>
			<View
				className="flex-row items-center p-4 bg-surface dark:bg-zinc-800/80 rounded-2xl border border-border/30 dark:border-zinc-700/50"
				style={{
					borderCurve: "continuous",
					boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
				}}
			>
				{/* Play/Pause Button */}
				<View className="relative mr-4">
					{/* Subtle glow ring when playing */}
					{isPlaying && (
						<View
							className="absolute -inset-1 rounded-full bg-primary/20 dark:bg-primary/30 animate-pulse"
							style={{ borderCurve: "continuous" }}
						/>
					)}
					<View
						className={`items-center justify-center w-12 h-12 rounded-full ${
							isPlaying
								? "bg-primary"
								: "bg-zinc-100 dark:bg-zinc-700"
						}`}
						style={{ borderCurve: "continuous" }}
					>
						{isPlaying ? (
							<Pause size={18} color="white" fill="white" />
						) : (
							<Play
								size={18}
								color={mutedColor}
								fill={mutedColor}
								style={{ marginLeft: 2 }}
							/>
						)}
					</View>
				</View>

				{/* Recording Info */}
				<View className="flex-1">
					<Text
						className="font-semibold text-foreground text-[15px] mb-1.5 tracking-tight"
						numberOfLines={1}
					>
						{recording.name}
					</Text>
					<View className="flex-row items-center gap-4">
						<View className="flex-row items-center gap-1.5">
							<Clock size={12} color={mutedColor} />
							<Text className="text-muted text-xs font-medium">
								{formatDuration(recording.durationMs)}
							</Text>
						</View>
						<View className="flex-row items-center gap-1.5">
							<HardDrive size={12} color={mutedColor} />
							<Text className="text-muted text-xs font-medium">
								{formatFileSize(recording.fileSize)}
							</Text>
						</View>
					</View>
				</View>

				{/* Subtle waveform indicator for playing state */}
				{isPlaying && (
					<View className="flex-row items-end gap-0.5 mr-1">
						{[12, 18, 10, 16, 8].map((h, i) => (
							<View
								key={i}
								className="w-[3px] rounded-full bg-primary animate-pulse"
								style={{ height: h }}
							/>
						))}
					</View>
				)}
			</View>
		</Pressable>
	);
}

/**
 * Sound Library screen with native iOS large title header.
 *
 * Displays all recordings by the current user with playback controls.
 */
export default function SoundLibraryScreen() {
	useTabFocusHaptic();

	const mutedColor = (useCSSVariable("--muted") ?? "#8E8E93") as string;

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
			{/* Header Section */}
			<View className="mb-5">
				<View className="flex-row items-center justify-between mb-1">
					<Text className="font-semibold text-[13px] text-muted uppercase tracking-wider">
						My Sounds
					</Text>
					{!isLoading && recordings.length > 0 && (
						<View
							className="px-2.5 py-1 rounded-full bg-primary/10 dark:bg-primary/20"
							style={{ borderCurve: "continuous" }}
						>
							<Text className="text-primary text-xs font-bold">
								{recordings.length}
							</Text>
						</View>
					)}
				</View>
				<Text className="text-sm text-muted">
					{isLoading
						? "Loading your library..."
						: recordings.length === 0
							? "Start recording to build your library"
							: `${recordings.length} sound${recordings.length !== 1 ? "s" : ""} in your library`}
				</Text>
			</View>

			{/* Loading State */}
			{isLoading && (
				<View className="items-center py-20">
					<ActivityIndicator size="large" color="var(--color-primary)" />
					<Text className="text-muted text-sm mt-4">
						Loading sounds...
					</Text>
				</View>
			)}

			{/* Empty State */}
			{!isLoading && recordings.length === 0 && (
				<View className="items-center py-16">
					{/* Decorative icon with gradient ring */}
					<View className="relative mb-6">
						<View
							className="absolute -inset-3 rounded-full bg-primary/5 dark:bg-primary/10"
							style={{ borderCurve: "continuous" }}
						/>
						<View
							className="items-center justify-center w-24 h-24 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 border border-border/40 dark:border-zinc-700/50"
							style={{
								borderCurve: "continuous",
								boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
							}}
						>
							<AudioWaveform size={36} color={mutedColor} strokeWidth={1.5} />
						</View>
					</View>
					<Text className="mb-2 font-bold text-foreground text-xl tracking-tight">
						No sounds yet
					</Text>
					<Text className="text-center text-[15px] text-muted px-12 leading-[22px]">
						Head over to the Record tab to capture your first sound.
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
		</TabScreenScrollView>
	);
}
