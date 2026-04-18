/**
 * Notifications module exports
 */

// Push notification utilities
export {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
  isPushNotificationsEnabled,
  getPushPermissionStatus,
  checkPushNotificationEligibility,
  type PushRegistrationResult,
  type PushRegistrationError,
  type PushPermissionStatus,
} from "./push-notifications";

// Notification store
export {
  useNotificationStore,
  type NotificationStore,
} from "./notification-store";

// Convex integration hook
export {
  usePushNotificationSetup,
  type UsePushNotificationSetupResult,
  type PushSetupStatus,
} from "./use-push-notification-setup";

