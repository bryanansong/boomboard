import { Stack } from "expo-router";
import { getTabScreenOptions } from "@/lib/utils/tab-screen-options";

/**
 * Alerts tab stack layout.
 *
 * Provides native iOS large title header with blur effect on scroll.
 * The title collapses from a large title into the nav bar on scroll.
 *
 * To customize the header (add icons, buttons):
 * - Use `getTabScreenOptionsWithHeaderRight` for right-side elements
 * - Use `getTabScreenOptionsWithCustomHeader` for both sides
 */
export default function AlertsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={getTabScreenOptions("Alerts")} />
    </Stack>
  );
}
