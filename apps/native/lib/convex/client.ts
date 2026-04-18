import { env } from "@boomboard/env/native";
import { ConvexReactClient } from "convex/react";

import { installWindowOnlineOfflineEventPolyfill } from "@/lib/polyfills/window-online-offline";

// Convex's RN runtime needs a window online-event polyfill for reconnect logic.
installWindowOnlineOfflineEventPolyfill();

export const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});
