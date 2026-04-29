import { useMutation } from "convex/react";
import { useEffect } from "react";
import { DynamicColorIOS } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { api } from "@boomboard/backend/convex/_generated/api";
import { useAuth } from "@/lib/auth";

export default function TabLayout() {
  const { status } = useAuth();
  const storeUser = useMutation(api.users.store);

  // Store/update user in Convex when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      storeUser();
    }
  }, [status, storeUser]);

  // Adaptive tint color for the tab bar
  // iOS: adapts to light/dark mode and liquid glass on iOS 26+
  // Android: uses a fixed accent color
  const tintColor =
    process.env.EXPO_OS === "ios"
      ? DynamicColorIOS({ light: "#000000", dark: "#FFFFFF" })
      : "#6366F1";

  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={tintColor}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "music.note.list", selected: "music.note.list" }}
          md="library_music"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="recording">
        <NativeTabs.Trigger.Label>Record</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "waveform", selected: "waveform" }}
          md="mic"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
