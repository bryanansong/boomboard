import * as QuickActions from "expo-quick-actions";
import type { RouterAction } from "expo-quick-actions/router";

/**
 * Quick action IDs used throughout the app.
 * Using constants ensures type safety and prevents typos.
 */
export const QUICK_ACTION_IDS = {
  DONT_LEAVE: "dont-leave",
} as const;

/**
 * Configures all app quick actions.
 * This includes the "Don't Leave" anti-delete strategy action.
 *
 * The "Don't Leave" action is a growth hacking tactic that creates
 * a barrier to uninstallation by showing a cute, emotionally engaging
 * quick action when users long-press the app icon.
 */
export async function setupQuickActions(): Promise<void> {
  const isSupported = await QuickActions.isSupported();

  if (!isSupported) {
    console.warn("[QuickActions] Quick actions are not supported on this device");
    return;
  }

  const actions: RouterAction[] = [
    {
      id: QUICK_ACTION_IDS.DONT_LEAVE,
      title: "Don't Leave 🥺",
      subtitle: "We'll miss you! Give us another chance?",
      // Using SF Symbol for iOS - pleading face compatible icon
      icon: "symbol:heart.fill",
      params: {
        href: "/(modals)/manage-subscriptions",
      },
    },
  ];

  await QuickActions.setItems(actions);
}
