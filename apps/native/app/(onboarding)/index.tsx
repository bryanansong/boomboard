/**
 * Onboarding Index - Entry Point
 *
 * Redirects to the welcome screen (Screen 1) or resumes from where user left off.
 */

import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function OnboardingIndex() {
  const router = useRouter();

  useEffect(() => {
    // Always start at welcome screen for first-time users
    router.replace("/(onboarding)/01-welcome" as any);
  }, [router]);

  return <View className="flex-1 bg-background" />;
}
