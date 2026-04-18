import { Stack } from "expo-router";

import {
  baseModalScreenOptions,
  getModalScreenOptions,
  getModalScreenOptionsWithoutLargeTitle,
} from "@/lib/utils/modal-screen-options";

/**
 * Layout for all modal screens.
 *
 * Uses native iOS large title headers with progressive blur effect.
 * All screens in this group will automatically get:
 * - Modal presentation
 * - Large title that collapses on scroll
 * - Progressive blur effect on header background
 * - Proper handling for both iOS and Android
 *
 * To add a new modal, simply add a new file in this directory.
 * The screen will automatically inherit these options.
 */
export default function ModalsLayout() {
  return (
    <Stack screenOptions={baseModalScreenOptions}>
      <Stack.Screen
        name="settings"
        options={getModalScreenOptions("Settings")}
      />
      <Stack.Screen
        name="account-details"
        options={{
          ...getModalScreenOptionsWithoutLargeTitle("Account details"),
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          ...getModalScreenOptionsWithoutLargeTitle("Appearance"),
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="manage-subscriptions"
        options={{
          ...getModalScreenOptionsWithoutLargeTitle("Manage Subscriptions"),
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="delete-account"
        options={{
          ...getModalScreenOptionsWithoutLargeTitle("Delete Account"),
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="delete-account-offers"
        options={{
          ...getModalScreenOptionsWithoutLargeTitle("Before You Go"),
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="delete-account-confirm"
        options={{
          ...getModalScreenOptionsWithoutLargeTitle("Confirm Deletion"),
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="delete-account-feedback"
        options={{
          ...getModalScreenOptionsWithoutLargeTitle("Feedback"),
          presentation: "card",
        }}
      />
    </Stack>
  );
}
