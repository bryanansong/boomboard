import { Text, View } from "react-native";
import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic } from "@/lib/hooks";
import { Music } from "lucide-react-native";

const SoundLibrarySection = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<View className="mb-7">
		<Text className="mb-3 pl-1 font-semibold text-[13px] text-muted uppercase tracking-wider">
			{title}
		</Text>
		{children}
	</View>
);

const SoundCard = ({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<View className={`rounded-2xl bg-surface p-5 shadow-sm ${className}`}>
		{children}
	</View>
);

/**
 * Sound Library screen with native iOS large title header.
 *
 * Uses TabScreenScrollView for proper content inset handling with
 * the transparent large title header.
 */
export default function SoundLibraryScreen() {
	useTabFocusHaptic();

	return (
		<TabScreenScrollView
			contentContainerClassName="px-5"
		>
			{/* My Sounds Section */}
			<SoundLibrarySection title="My Sounds">
				<SoundCard>
					<View className="items-center py-5">
						<Music size={48} color="var(--color-muted)" className="mb-3" />
						<Text className="mb-1 font-semibold text-foreground text-lg">
							No sounds yet
						</Text>
						<Text className="text-center text-base text-muted">
							Your saved sounds will appear here. Go to Record to add some!
						</Text>
					</View>
				</SoundCard>
			</SoundLibrarySection>

			{/* Favorites Section */}
			<SoundLibrarySection title="Favorites">
				<SoundCard>
					<View className="items-center py-5">
						<Text className="mb-1 font-semibold text-foreground text-lg">
							No favorites
						</Text>
						<Text className="text-center text-base text-muted">
							Sounds you mark as favorites will show up here
						</Text>
					</View>
				</SoundCard>
			</SoundLibrarySection>
		</TabScreenScrollView>
	);
}
