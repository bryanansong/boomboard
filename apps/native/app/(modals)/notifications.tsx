import { useCallback, useEffect, useState } from "react";
import { Text, View, Switch, Alert, Linking, Platform, AppState } from "react-native";
import * as Notifications from "expo-notifications";

import { LargeTitleScrollView } from "@/components/ui/large-title-view";

/**
 * Toggle setting item with label and description.
 */
interface ToggleSettingProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleSetting({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: ToggleSettingProps) {
  return (
    <View className="flex-row items-center justify-between py-4 px-4">
      <View className="flex-1 pr-4">
        <Text className="text-[17px] text-foreground font-semibold mb-1">
          {label}
        </Text>
        <Text className="text-[15px] text-muted font-normal leading-5">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "var(--border)", true: "var(--success)" }}
        thumbColor="var(--white)"
        ios_backgroundColor="var(--border)"
        disabled={disabled}
      />
    </View>
  );
}

/**
 * Retrieves the current notification permission status.
 * @returns True if notifications are granted, false otherwise.
 */
async function getNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Requests notification permissions from the system.
 * @returns True if permission was granted, false otherwise.
 */
async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Opens the app settings to allow users to manage notification permissions.
 */
function openAppSettings(): void {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
}

/**
 * Notifications settings modal.
 * Allows users to enable/disable push notifications and configure notification preferences.
 */
export default function NotificationsModal() {
  const [allowNotifications, setAllowNotifications] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Check current permission status on mount and when app returns to foreground
  useEffect(() => {
    const checkPermissionStatus = async () => {
      const isGranted = await getNotificationPermissionStatus();
      setAllowNotifications(isGranted);
      setIsLoading(false);
    };

    checkPermissionStatus();

    // Re-check permissions when user returns from settings
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermissionStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Handles the allow notifications toggle change.
   * Requests permissions when enabling, shows settings prompt when disabling.
   */
  const handleAllowNotificationsChange = useCallback(
    async (value: boolean) => {
      if (value) {
        // User wants to enable notifications - request permission
        const granted = await requestNotificationPermission();
        setAllowNotifications(granted);

        if (!granted) {
          // Permission was denied, prompt user to open settings
          Alert.alert(
            "Permission Required",
            "Notifications are disabled. Please enable them in Settings to receive push notifications.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: openAppSettings },
            ]
          );
        }
      } else {
        // User wants to disable notifications - direct to settings
        // Note: iOS doesn't allow programmatic revocation of notification permissions
        Alert.alert(
          "Disable Notifications",
          "To disable notifications, please go to Settings and turn off notifications for this app.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openAppSettings },
          ]
        );
      }
    },
    []
  );

  /**
   * Handles the daily summary toggle change.
   */
  const handleDailySummaryChange = useCallback((value: boolean) => {
    setDailySummary(value);
    // TODO: Save preference to backend/storage
  }, []);

  return (
    <LargeTitleScrollView contentContainerClassName="px-5" noLargeTitle>
      {/* Main Notifications Toggle */}
      <View className="bg-surface rounded-2xl overflow-hidden mb-6 shadow-sm mt-5">
        <ToggleSetting
          label="Allow notifications"
          description="Enable push notifications."
          value={allowNotifications}
          onValueChange={handleAllowNotificationsChange}
          disabled={isLoading}
        />
      </View>

      {/* General Section */}
      <Text className="text-[13px] font-semibold text-muted uppercase tracking-[0.5px] mb-2.5 pl-1">
        General
      </Text>
      <View className="bg-surface rounded-2xl overflow-hidden mb-6 shadow-sm">
        <ToggleSetting
          label="Daily Summary"
          description="Receive a summary of your Sleep and Recovery every morning."
          value={dailySummary}
          onValueChange={handleDailySummaryChange}
        />
      </View>
    </LargeTitleScrollView>
  );
}
