/**
 * Notification Store - Zustand store for push notification state management
 *
 * Manages the push token and notification state with persistence.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandStorage } from "@/lib/storage";

/** Storage key for notification data */
const NOTIFICATION_STORAGE_KEY = "@boomboard/notifications";

/** Notification store state interface */
interface NotificationState {
  /** Expo push token for this device */
  expoPushToken: string | null;
  /** Whether push notification registration has been attempted */
  registrationAttempted: boolean;
}

/** Notification store actions interface */
interface NotificationActions {
  /** Set the Expo push token */
  setExpoPushToken: (token: string) => void;
  /** Mark that registration has been attempted */
  setRegistrationAttempted: (attempted: boolean) => void;
  /** Reset the notification store */
  reset: () => void;
}

/** Combined notification store type */
export type NotificationStore = NotificationState & NotificationActions;

/** Initial state values */
const initialState: NotificationState = {
  expoPushToken: null,
  registrationAttempted: false,
};

/**
 * Notification store using Zustand with persistence.
 *
 * Usage:
 * ```typescript
 * const token = useNotificationStore((state) => state.expoPushToken);
 * const setToken = useNotificationStore((state) => state.setExpoPushToken);
 * ```
 */
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Actions
      setExpoPushToken: (token: string) => {
        set({ expoPushToken: token });
      },

      setRegistrationAttempted: (attempted: boolean) => {
        set({ registrationAttempted: attempted });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: NOTIFICATION_STORAGE_KEY,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        expoPushToken: state.expoPushToken,
        registrationAttempted: state.registrationAttempted,
      }),
    },
  ),
);

/** Selector for push token */
export const selectExpoPushToken = (state: NotificationStore) =>
  state.expoPushToken;

/** Selector for registration status */
export const selectRegistrationAttempted = (state: NotificationStore) =>
  state.registrationAttempted;
