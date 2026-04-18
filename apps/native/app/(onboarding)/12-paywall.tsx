import { useOnboarding } from "@/lib/onboarding";
import { usePlacement, useSuperwall } from "expo-superwall";
import { useRouter } from "expo-router";
import React, { useEffect, useCallback } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Button } from "heroui-native";
import { usePostHog } from 'posthog-react-native';

const __DEV_MODE__ = __DEV__;

export default function PaywallScreen() {
  const { startTrial } = useOnboarding();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const posthog = usePostHog();
  const isConfigured = useSuperwall((state) => state.isConfigured);
  const subscriptionStatus = useSuperwall((state) => state.subscriptionStatus);
  const setSubscriptionStatus = useSuperwall((state) => state.setSubscriptionStatus);

  useEffect(() => {
    posthog.capture('onboarding_paywall_shown');
  }, [posthog]);

  const { registerPlacement } = usePlacement({
    onError: (err) => {
      posthog.capture('onboarding:paywall_error', { error: String(err) });
      console.error("Placement Error:", err);
      setError(String(err));
    },
    onPresent: (info) => console.log("Paywall Presented:", info),
    onDismiss: (info, result) => {
      posthog.capture('onboarding:paywall_dismissed', { result: String(result) });
      console.log("Paywall Dismissed:", info, "Result:", result);
      // Proceed to app after paywall interaction
      posthog.capture('onboarding:completed');
      startTrial();
    },
  });

  const handleTriggerPlacement = useCallback(async () => {
    setError(null);
    try {
      // Prevent timeout on Android emulators or devices without Play Billing
      // by explicitly setting an unknown subscription status to INACTIVE before placement.
      if (!subscriptionStatus || subscriptionStatus === "UNKNOWN" || (typeof subscriptionStatus === 'object' && subscriptionStatus.status === "UNKNOWN")) {
        await setSubscriptionStatus({ status: "INACTIVE" });
      }

      await registerPlacement({
        placement: "campaign_trigger"
      });
    } catch (e) {
      // Errors are typically handled by onError, but good to catch here too just in case
      console.error(e);
    }
  }, [registerPlacement]);

  useEffect(() => {
    if (!isConfigured) return;
    posthog.capture('onboarding:paywall_shown');
    handleTriggerPlacement();
  }, [handleTriggerPlacement, posthog, isConfigured]);

  const handleDevSkip = useCallback(() => {
    if (__DEV_MODE__) {
      console.log("[DEV] Skipping paywall");
      router.replace("/(tabs)/home" as never);
    }
  }, [router]);

  return (
    <View className="flex-1 bg-background justify-center items-center p-4">
      {/* Dev Skip Button */}
      {__DEV_MODE__ && (
        <TouchableOpacity
          className="absolute top-12 right-8 z-10 w-10 h-10 rounded-full bg-muted/20 items-center justify-center"
          onPress={handleDevSkip}
          activeOpacity={0.7}
        >
          <Text className="text-muted-foreground text-lg">✕</Text>
        </TouchableOpacity>
      )}

      <ActivityIndicator size="large" />
      <Text className="mt-4 text-foreground text-center">Loading premium experience...</Text>

      {/* Manual Trigger / Retry if needed */}
      {error && (
        <View className="mt-8 gap-4 items-center">
          <Text className="text-destructive text-center">{error}</Text>
          <Button onPress={handleTriggerPlacement}>
            <Button.Label>Retry</Button.Label>
          </Button>
          <Button onPress={() => {
             posthog.capture('onboarding:completed');
             startTrial();
          }} variant="ghost">
             <Button.Label>Continue without Paywall (Fallback)</Button.Label>
          </Button>
        </View>
      )}
    </View>
  );
}
