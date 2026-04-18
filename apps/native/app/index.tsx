import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { View } from "react-native";

import { useOnboardingStore } from "@/lib/stores";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  // Use Zustand store directly for better performance
  const isComplete = useOnboardingStore((state) => state.isComplete);

  // Wait for loading states (splash screen is still visible from _layout.tsx)
  if (!isLoaded) {
    return <View className="flex-1 bg-background" />;
  }

  // Redirect to the appropriate initial screen
  if (!isComplete) {
    return <Redirect href="/(onboarding)" />;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
