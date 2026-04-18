import { useUser } from "@clerk/clerk-expo";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";

/**
 * Reactively identifies the current Clerk user in PostHog.
 *
 * Watches the Clerk `useUser()` state and calls `posthog.identify()`
 * whenever a signed-in user is detected. A ref prevents redundant
 * identify calls within the same session. Call this once in a
 * top-level layout component.
 */
export function usePostHogIdentify(): void {
  const { user, isLoaded } = useUser();
  const posthog = usePostHog();
  const identifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Skip if we already identified this exact user in this session
    if (identifiedUserIdRef.current === user.id) return;

    const email = user.emailAddresses?.[0]?.emailAddress;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;

    posthog.identify(user.id, {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    });

    identifiedUserIdRef.current = user.id;
  }, [isLoaded, user, posthog]);
}
