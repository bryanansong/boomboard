import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { Settings } from "lucide-react-native";
import { useCallback } from "react";
import { Platform } from "react-native";
import { useCSSVariable } from "uniwind";
import { TabScreenHeaderButton } from "@/components/ui/tab-screen-view";
import { getTabScreenOptionsWithHeaderRight } from "@/lib/utils/tab-screen-options";

/**
 * Settings button for the home screen header.
 * Opens the settings modal when pressed.
 */
function SettingsButton() {
	const iconColor = useCSSVariable("--color-foreground");

	const handlePress = useCallback(() => {
		router.push("/settings" as never);
		if (Platform.OS === "ios") {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
		}
	}, []);

	return (
		<TabScreenHeaderButton
			onPress={handlePress}
			style={({ pressed }: { pressed: boolean }) => ({
				opacity: pressed ? 0.6 : 1,
			})}
		>
			<Settings size={22} color={iconColor as string} strokeWidth={1.8} />
		</TabScreenHeaderButton>
	);
}

/**
 * Sound Library tab stack layout with native iOS large title header.
 *
 * Provides:
 * - Large title that collapses into nav bar on scroll
 * - Progressive blur effect on header background
 * - Settings button in header right
 *
 * To customize further:
 * - Use `getTabScreenOptionsWithCustomHeader` for both headerLeft/headerRight
 * - Add streak indicators, badges, or other elements as needed
 */
export default function SoundLibraryLayout() {
	return (
		<Stack screenOptions={{ headerShown: true, animation: Platform.OS === "android" ? "none" : undefined }}>
			<Stack.Screen
				name="index"
				options={getTabScreenOptionsWithHeaderRight("Sound Library", () => (
					<SettingsButton />
				))}
			/>
		</Stack>
	);
}
