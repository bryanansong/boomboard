/**
 * Bug report utility for collecting device information and opening mail clients
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import { Alert, Platform } from "react-native";

/** Support email address for bug reports */
// todo: update support email
const SUPPORT_EMAIL = "support@boomboardapp.com";

/** Mail app configuration */
interface MailApp {
  id: string;
  name: string;
  urlScheme: string;
}

/** Available mail apps for iOS */
const MAIL_APPS: MailApp[] = [
  { id: "default", name: "Default Mail", urlScheme: "mailto:" },
  { id: "gmail", name: "Gmail", urlScheme: "googlegmail://co" },
  { id: "outlook", name: "Outlook", urlScheme: "ms-outlook://compose" },
];

/**
 * Collects comprehensive device and user information for bug reports
 */
interface DeviceInfo {
  appName: string;
  appVersion: string;
  buildNumber: string;
  platform: string;
  osVersion: string;
  deviceModel: string;
  deviceBrand: string;
  isDevice: boolean;
  userId?: string;
  userEmail?: string;
}

/**
 * Gathers device and app information for bug reports
 * @param userId - Optional user ID
 * @param userEmail - Optional user email
 * @returns DeviceInfo object with comprehensive information
 */
export function getDeviceInfo(userId?: string, userEmail?: string): DeviceInfo {
  const appName =
    typeof Constants.expoConfig?.name === "string"
      ? Constants.expoConfig.name
      : "boomboard";
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const buildNumber =
    (Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode?.toString()) || "1";

  return {
    appName,
    appVersion,
    buildNumber,
    platform: Platform.OS,
    osVersion: Platform.Version?.toString() || "Unknown",
    deviceModel: Device.modelName || "Unknown",
    deviceBrand: Device.brand || "Unknown",
    isDevice: Device.isDevice ?? false,
    userId,
    userEmail,
  };
}

/**
 * Generates an aesthetic and clean email body for bug reports
 * @param deviceInfo - Device information object
 * @returns Formatted email body string
 */
export function generateBugReportBody(deviceInfo: DeviceInfo): string {
  const separator = "─".repeat(32);

  return `
Hi ${deviceInfo.appName} Team,

I'd like to report the following issue:

[Please describe the bug here]
• What happened?
• What did you expect to happen?
• Steps to reproduce:





${separator}
📱 Device Information
${separator}

App Version      ${deviceInfo.appVersion} (${deviceInfo.buildNumber})
Platform         ${deviceInfo.platform === "ios" ? "iOS" : "Android"} ${deviceInfo.osVersion}
Device           ${deviceInfo.deviceBrand} ${deviceInfo.deviceModel}
${deviceInfo.isDevice ? "Physical Device" : "Simulator/Emulator"}

${separator}
👤 Account Information
${separator}

${deviceInfo.userEmail ? `Email            ${deviceInfo.userEmail}` : "Not signed in"}
${deviceInfo.userId ? `User ID          ${deviceInfo.userId.slice(0, 12)}...` : ""}

${separator}

Thank you for looking into this!
`.trim();
}

/**
 * Constructs the appropriate mail URL for each mail app
 * @param app - Mail app configuration
 * @param subject - Email subject
 * @param body - Email body
 * @returns Formatted URL string for the mail app
 */
function buildMailUrl(app: MailApp, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  switch (app.id) {
    case "gmail":
      return `googlegmail://co?to=${SUPPORT_EMAIL}&subject=${encodedSubject}&body=${encodedBody}`;
    case "outlook":
      return `ms-outlook://compose?to=${SUPPORT_EMAIL}&subject=${encodedSubject}&body=${encodedBody}`;
    default:
      return `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
  }
}

/**
 * Attempts to open a mail app with the bug report
 * @param app - Mail app to open
 * @param subject - Email subject
 * @param body - Email body
 * @returns Promise resolving to boolean indicating success
 */
async function openMailApp(
  app: MailApp,
  subject: string,
  body: string,
): Promise<boolean> {
  const url = buildMailUrl(app, subject, body);

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to open ${app.name}:`, error);
    return false;
  }
}

/**
 * Shows a native alert allowing user to select their preferred mail app
 * @param userId - Optional user ID for the report
 * @param userEmail - Optional user email for the report
 */
export async function showBugReportMailPicker(
  userId?: string,
  userEmail?: string,
): Promise<void> {
  const deviceInfo = getDeviceInfo(userId, userEmail);
  const subject = `[Bug Report] ${deviceInfo.appName} v${deviceInfo.appVersion}`;
  const body = generateBugReportBody(deviceInfo);

  // Create alert buttons for each mail app
  const alertButtons = MAIL_APPS.map((app) => ({
    text: app.name,
    onPress: async () => {
      const success = await openMailApp(app, subject, body);
      if (!success) {
        Alert.alert(
          "App Not Available",
          `${app.name} is not installed on this device. Please try another mail app.`,
          [{ text: "OK" }],
        );
      }
    },
  }));

  // Add cancel button
  alertButtons.push({
    text: "Cancel",
    onPress: async () => {},
  });

  Alert.alert(
    "Choose Your Mail App",
    "Select your preferred mail app to send the bug report",
    alertButtons,
    { cancelable: true },
  );
}
