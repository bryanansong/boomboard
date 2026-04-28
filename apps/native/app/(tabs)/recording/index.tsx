import { Text, View, Pressable } from "react-native";
import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic } from "@/lib/hooks";
import { Mic } from "lucide-react-native";

/**
 * Recording screen with native iOS large title header.
 *
 * Uses TabScreenScrollView for proper content inset handling with
 * the transparent large title header.
 */
export default function RecordingScreen() {
	useTabFocusHaptic();

	return (
		<TabScreenScrollView
			contentContainerClassName="px-5"
		>
			<View className="flex-1 items-center justify-center py-50">
				<Pressable className="items-center justify-center w-24 h-24 rounded-full bg-primary mb-6 active:opacity-80">
					<Mic size={40} color="white" />
				</Pressable>
				<Text className="mb-2 font-semibold text-[22px] text-foreground">
					Tap to Record
				</Text>
				<Text className="px-10 text-center text-base text-muted leading-[22px]">
					Hold the button to capture a new sound for your library.
				</Text>
			</View>
		</TabScreenScrollView>
	);
}
