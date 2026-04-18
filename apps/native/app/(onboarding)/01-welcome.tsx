/**
 * Screen 1: Welcome Hero
 *
 * Generic welcome screen for the boomboard app.
 */

import { useAppTheme, useHaptic } from "@/lib/hooks";
import { useOnboarding } from "@/lib/onboarding";
import { StatusBar } from "expo-status-bar";
import { Button } from "heroui-native";
import { Sparkles } from "lucide-react-native";
import React, { useEffect, useCallback } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { next, completeOnboarding } = useOnboarding();
  const { isDark } = useAppTheme();
  const { medium: hapticMedium } = useHaptic();

  const handleGetStarted = useCallback(() => {
    hapticMedium();
    next();
  }, [next, hapticMedium]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Content Container */}
      <View
        className="flex-1 justify-between px-6"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Top Section */}
        <View className="flex-1 justify-center items-center">
          <View className="w-24 h-24 rounded-3xl bg-primary/10 items-center justify-center mb-8">
            <Sparkles
              size={48}
              color={"#007AFF"} // Fallback to system blue
              strokeWidth={1.5}
            />
          </View>

          <Text className="text-4xl font-bold text-foreground text-center mb-4 tracking-tight">
            Welcome to Boomboard
          </Text>

          <Text className="text-lg text-muted-foreground text-center leading-relaxed max-w-[85%]">
            Build a personal library of your favorite sounds—viral clips,
            custom reactions, or crowd-pleasers—and play them the instant you
            need them.
          </Text>
        </View>

        {/* Bottom Section */}
        <View className="gap-1">
          <Button onPress={handleGetStarted} size="lg">
            <Button.Label>Get Started</Button.Label>
          </Button>

          <Text className="text-xs text-center text-muted">
            By continuing, you agree to our Terms of Service.
          </Text>

          {__DEV__ && (
            <Button onPress={completeOnboarding} variant="outline" size="lg">
              <Button.Label>[DEV] Skip Onboarding</Button.Label>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
