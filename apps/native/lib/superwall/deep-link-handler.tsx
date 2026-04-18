import {
  SuperwallExpoModule,
  useSuperwallEvents,
} from "expo-superwall";
import * as Linking from "expo-linking";
import { useEffect } from "react";

/**
 * Forwards incoming deep link URLs to the Superwall SDK so it can handle
 * web checkout redemption, paywall previews, and campaign deep links.
 * Must be rendered inside SuperwallProvider.
 */
export function SuperwallDeepLinkHandler() {
  useSuperwallEvents({
    willRedeemLink: () => {
      // Optional: show loading UI when user returns from web checkout
      __DEV__ && console.log("[Superwall] Redeeming link…");
    },
    didRedeemLink: (result) => {
      __DEV__ && console.log("[Superwall] didRedeemLink", result.status, result);
      // Optional: show success/error toast based on result.status
    },
  });

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;

      // Skip OAuth/auth-session callback URLs so expo-web-browser's
      // maybeCompleteAuthSession() can process them instead.
      if (
        url.includes("created_session_id") ||
        url.includes("rotating_token_nonce") ||
        url.includes("oauth")
      ) {
        __DEV__ &&
          console.log("[Superwall] Skipping auth callback URL:", url);
        return;
      }

      try {
        const handled = await SuperwallExpoModule.handleDeepLink(url);
        if (!handled) {
          // Not a Superwall link; your app can handle it (e.g. expo-router)
          __DEV__ && console.log("[Superwall] Deep link not handled by Superwall:", url);
        }
      } catch (e) {
        __DEV__ && console.warn("[Superwall] handleDeepLink error", e);
      }
    };

    let subscription: { remove: () => void } | undefined;

    const init = async () => {
      const initialUrl = await Linking.getInitialURL();
      await handleUrl(initialUrl);

      subscription = Linking.addEventListener("url", ({ url }) => {
        void handleUrl(url);
      });
    };

    void init();

    return () => {
      subscription?.remove();
    };
  }, []);

  return null;
}
