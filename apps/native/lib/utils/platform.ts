import { Platform } from 'react-native';

/**
 * Get the current iOS version as a number.
 * Returns 0 if not running on iOS.
 */
export function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  return parseInt(Platform.Version as string, 10);
}

/**
 * Check if the device is running iOS 26 or later.
 * iOS 26+ handles header blur effects automatically.
 */
export function isIOS26OrLater(): boolean {
  return getIOSVersion() >= 26;
}

/**
 * Check if the current platform is iOS.
 */
export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Check if the current platform is Android.
 */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}
