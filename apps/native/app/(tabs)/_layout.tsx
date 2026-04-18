import { useMutation } from "convex/react";
import { useEffect } from "react";
import { DynamicColorIOS, Platform } from "react-native";
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

  // Dynamic colors for iOS liquid glass effect
  // tintColor is used for selected tabs, unselected tabs use system default
  // Note: We use hex codes because DynamicColorIOS doesn't resolve CSS variables
  const tintColor =
    Platform.OS === "ios"
      ? DynamicColorIOS({ dark: "#FFFFFF", light: "#000000" })
      : "var(--primary)";

  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={tintColor}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          drawable="ic_home"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <NativeTabs.Trigger.Label>Alerts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bell", selected: "bell.fill" }}
          drawable="ic_notifications"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
