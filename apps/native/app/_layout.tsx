import "@/global.css";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { env } from "@boomboard/env/native";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { NavigationThemeProvider } from "@/components/navigation-theme-provider";
import { convex } from "@/lib/convex/client";
import { useAppTheme } from "@/lib/hooks";
import { useOnboardingStore } from "@/lib/stores";

function StackLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // Use Zustand stores directly for better performance
  const isOnboardingComplete = useOnboardingStore((state) => state.isComplete);
  const { isDark, initializeTheme } = useAppTheme();


  // Setup theme on app load
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Show loading screen only while auth is initializing
  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="var(--accent)" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth Screen: Only accessible if NOT signed in AND onboarding IS complete */}
        <Stack.Protected guard={!isSignedIn && isOnboardingComplete}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* Onboarding Screen: Only accessible if onboarding is NOT complete */}
        <Stack.Protected guard={!isOnboardingComplete}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        {/* Main App (Tabs): Only accessible if signed in AND onboarding complete */}
        <Stack.Protected guard={isSignedIn && isOnboardingComplete}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(modals)"
            options={{ headerShown: false, presentation: "modal" }}
          />
        </Stack.Protected>
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function Layout() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
              <NavigationThemeProvider>
                <StackLayout />
              </NavigationThemeProvider>
            </HeroUINativeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
