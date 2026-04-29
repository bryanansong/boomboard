import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { Settings } from "lucide-react-native";
import { useCallback } from "react";
import { Platform } from "react-native";
import { useCSSVariable } from "uniwind";
import { TabScreenHeaderButton } from "@/components/ui/tab-screen-view";
import { getTabScreenOptionsWithHeaderRight } from "@/lib/utils/tab-screen-options";

/**
 * Settings button for the recording screen header.
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
 * Recording tab stack layout.
 *
 * Provides native iOS large title header with blur effect on scroll.
 * The title collapses from a large title into the nav bar on scroll.
 *
 * To customize the header (add icons, buttons):
 * - Use `getTabScreenOptionsWithHeaderRight` for right-side elements
 * - Use `getTabScreenOptionsWithCustomHeader` for both sides
 */
export default function RecordingLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, animation: Platform.OS === "android" ? "none" : undefined }}>
      <Stack.Screen 
        name="index" 
        options={getTabScreenOptionsWithHeaderRight("Recording", () => (
          <SettingsButton />
        ))} 
      />
    </Stack>
  );
}
