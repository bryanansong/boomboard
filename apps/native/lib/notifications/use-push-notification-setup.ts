/**
 * Push Notification Setup Hook
 *
 * Automatically registers and syncs the device's push token with Convex
 * when the user is authenticated. This hook should be used in the app's
 * authenticated layout to ensure tokens are always up-to-date.
 */

import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@boomboard/backend/convex/_generated/api";

import {
  checkPushNotificationEligibility,
  isPushNotificationsEnabled,
  registerForPushNotificationsAsync,
  type PushRegistrationResult,
} from "./push-notifications";
import { useNotificationStore } from "./notification-store";

/** Status of the push notification setup process */
export type PushSetupStatus =
  | "idle"
  | "checking"
  | "registering"
  | "syncing"
  | "success"
  | "error";

/** Push notification setup hook return type */
export interface UsePushNotificationSetupResult {
  /** Current status of the setup process */
  status: PushSetupStatus;
  /** Whether the device has a token registered with Convex */
  hasToken: boolean;
  /** Whether notifications are paused for the user */
  isPaused: boolean;
  /** Any error that occurred during setup */
  error: string | null;
  /** Manually trigger token registration (e.g., after permission granted) */
  registerToken: () => Promise<PushRegistrationResult>;
}

/**
 * Hook to automatically manage push notification token registration with Convex.
 *
 * Features:
 * - Automatically syncs token when user is authenticated
 * - Only registers if device is eligible (physical device, has project ID)
 * - Handles token refresh by re-registering when token changes
 * - Provides status and error feedback for UI consumption
 *
 * @example
 * ```tsx
 * function AuthenticatedLayout() {
 *   const { status, hasToken, registerToken } = usePushNotificationSetup();
 *
 *   // Token is automatically registered when user authenticates
 *   // Use registerToken() after user grants permission in settings
 * }
 * ```
 */
export function usePushNotificationSetup(): UsePushNotificationSetupResult {
  const { isSignedIn } = useAuth();
  const [status, setStatus] = useState<PushSetupStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Convex mutations and queries
  const recordPushToken = useMutation(api.notifications.recordPushToken);
  const notificationStatus = useQuery(
    api.notifications.getNotificationStatus,
    isSignedIn ? {} : "skip",
  );

  // Local store for caching token
  const localToken = useNotificationStore((s) => s.expoPushToken);
  const setLocalToken = useNotificationStore((s) => s.setExpoPushToken);
  const setRegistrationAttempted = useNotificationStore(
    (s) => s.setRegistrationAttempted,
  );

  // Track if we've already attempted registration in this session
  const hasAttemptedRef = useRef(false);

  /**
   * Registers the push token with Convex.
   * Can be called manually or automatically on mount.
   */
  const registerToken =
    useCallback(async (): Promise<PushRegistrationResult> => {
      setStatus("registering");
      setError(null);

      const result = await registerForPushNotificationsAsync();

      if (!result.success) {
        setStatus("error");
        setError(result.message ?? "Registration failed");
        setRegistrationAttempted(true);
        return result;
      }

      // Save token locally
      if (result.token) {
        setLocalToken(result.token);
      }

      // Sync with Convex if authenticated
      if (isSignedIn && result.token) {
        setStatus("syncing");
        try {
          await recordPushToken({ token: result.token });
          setStatus("success");
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Failed to sync token";
          setError(message);
          setStatus("error");
          // Token was obtained but sync failed - still return success for local storage
        }
      } else {
        setStatus("success");
      }

      setRegistrationAttempted(true);
      return result;
    }, [isSignedIn, recordPushToken, setLocalToken, setRegistrationAttempted]);

  /**
   * Sync existing local token with Convex when user signs in.
   */
  const syncExistingToken = useCallback(async () => {
    if (!localToken || !isSignedIn) return;

    // Check if Convex already has the token
    if (notificationStatus?.hasToken) return;

    setStatus("syncing");
    try {
      await recordPushToken({ token: localToken });
      setStatus("success");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to sync token";
      setError(message);
      setStatus("error");
    }
  }, [localToken, isSignedIn, notificationStatus?.hasToken, recordPushToken]);

  /**
   * Auto-register on mount if eligible and permission already granted.
   */
  useEffect(() => {
    // Only attempt once per session and when signed in
    if (!isSignedIn || hasAttemptedRef.current) return;

    const attemptAutoRegistration = async () => {
      setStatus("checking");

      // Check eligibility first
      const eligibility = checkPushNotificationEligibility();
      if (!eligibility.eligible) {
        setStatus("idle");
        return;
      }

      // Check if permission is already granted
      const hasPermission = await isPushNotificationsEnabled();
      if (!hasPermission) {
        // Don't auto-request permission, wait for user action
        setStatus("idle");
        return;
      }

      // If we have a local token, just sync it
      if (localToken) {
        await syncExistingToken();
      } else {
        // Register new token
        await registerToken();
      }

      hasAttemptedRef.current = true;
    };

    attemptAutoRegistration();
  }, [isSignedIn, localToken, syncExistingToken, registerToken]);

  return {
    status,
    hasToken: notificationStatus?.hasToken ?? false,
    isPaused: notificationStatus?.paused ?? false,
    error,
    registerToken,
  };
}
