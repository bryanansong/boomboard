/**
 * Push Notifications - Registration and token management
 *
 * Handles Expo push notification registration and token retrieval.
 * Uses result objects for graceful error handling without throwing.
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// =============================================================================
// Types
// =============================================================================

/** Possible reasons for push notification registration failure */
export type PushRegistrationError =
  | "not_physical_device"
  | "permission_denied"
  | "project_id_missing"
  | "token_fetch_failed";

/** Result of a push notification registration attempt */
export interface PushRegistrationResult {
  /** Whether registration was successful */
  success: boolean;
  /** The Expo push token if successful */
  token?: string;
  /** Error code if registration failed */
  error?: PushRegistrationError;
  /** Human-readable error message */
  message?: string;
}

/** Push notification permission status */
export type PushPermissionStatus = "granted" | "denied" | "undetermined";

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configures the notification handler for how notifications should be presented.
 * Should be called at app startup (e.g., in _layout.tsx).
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// =============================================================================
// Registration
// =============================================================================

/**
 * Checks if the device is eligible to receive push notifications.
 * Must be a physical device with a valid project ID.
 *
 * @returns Object with eligibility status and any issues
 */
export function checkPushNotificationEligibility(): {
  eligible: boolean;
  isPhysicalDevice: boolean;
  hasProjectId: boolean;
  projectId: string | null;
} {
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    null;

  return {
    eligible: Device.isDevice && projectId !== null,
    isPhysicalDevice: Device.isDevice,
    hasProjectId: projectId !== null,
    projectId,
  };
}

/**
 * Sets up Android notification channel.
 * Should be called before requesting permissions on Android.
 */
async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

/**
 * Registers the device for push notifications and retrieves the Expo push token.
 * Returns a result object instead of throwing errors for graceful handling.
 *
 * @returns PushRegistrationResult with token on success or error details on failure
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  // Set up Android notification channel
  await setupAndroidChannel();

  // Check device eligibility
  if (!Device.isDevice) {
    console.warn("[Push Notifications] Simulator detected, skipping registration");
    return {
      success: false,
      error: "not_physical_device",
      message: "Push notifications require a physical device",
    };
  }

  // Check and request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push Notifications] Permission denied");
    return {
      success: false,
      error: "permission_denied",
      message: "User denied notification permissions",
    };
  }

  // Get project ID
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.error("[Push Notifications] Project ID not found");
    return {
      success: false,
      error: "project_id_missing",
      message: "EAS project ID is not configured",
    };
  }

  // Fetch the push token
  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    console.log("[Push Notifications] Token obtained:", pushTokenString);
    return {
      success: true,
      token: pushTokenString,
    };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("[Push Notifications] Token fetch failed:", errorMessage);
    return {
      success: false,
      error: "token_fetch_failed",
      message: `Failed to get push token: ${errorMessage}`,
    };
  }
}

// =============================================================================
// Permission Utilities
// =============================================================================

/**
 * Gets the current push notification permission status.
 *
 * @returns The current permission status
 */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

/**
 * Checks if push notifications are currently enabled (permission granted).
 *
 * @returns True if notifications are granted, false otherwise
 */
export async function isPushNotificationsEnabled(): Promise<boolean> {
  const status = await getPushPermissionStatus();
  return status === "granted";
}
