import { Text, View } from "react-native";
import { AuraBackground } from "@/components/ui/aura-background";
import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic } from "@/lib/hooks";

/**
 * Alerts screen with native iOS large title header.
 *
 * Uses TabScreenScrollView for proper content inset handling with
 * the transparent large title header.
 */
export default function AlertsScreen() {
	useTabFocusHaptic();

	return (
		<TabScreenScrollView
			contentContainerClassName="px-5"
			topOverlay={<AuraBackground anchorToTopEdge />}
		>
			<View className="flex-1 items-center justify-center py-50">
				<Text className="mb-4 text-[64px]">🔔</Text>
				<Text className="mb-2 font-semibold text-[22px] text-foreground">
					No alerts yet
				</Text>
				<Text className="px-10 text-center text-base text-muted leading-[22px]">
					When you receive alerts and notifications, they will appear here.
				</Text>
			</View>
		</TabScreenScrollView>
	);
}
