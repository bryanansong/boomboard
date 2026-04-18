import { Button } from "heroui-native";
import React, { useCallback, useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MembershipCard } from "@/components/membership-card";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";
import { ChevronRightIcon } from "lucide-react-native";
import { usePostHog } from 'posthog-react-native';

export default function StepScreen() {
  const insets = useSafeAreaInsets();
  const { next } = useOnboarding();
  const posthog = usePostHog();
  const { medium: hapticMedium } = useHaptic();

  const handleNext = useCallback(() => {
    hapticMedium();
    next();
  }, [hapticMedium, next]);

  useEffect(() => {
    posthog.capture('onboarding:membership_card_viewed');
  }, [posthog]);

  return (
    <View className="flex-1 bg-background">
      {/* Content Container */}
      <View
        className="flex-1 px-8 gap-4"
        style={{
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Header Copy */}
        <View className="items-center text-center">
          <Text className="mb-2 font-semibold text-3xl text-foreground text-center">
            Let's craft a personalized plan
          </Text>
          <Text className="text-lg text-center text-muted leading-tight">
            You'll get an exclusive membership card at the end
          </Text>
        </View>

        {/* Membership Card */}
        <View className="flex-1 items-center justify-center gap-4">
          <MembershipCard
            name=""
            title="MEMBERSHIP CARD"
            joinDate="Today"
          />
        </View>

        {/* CTA Button */}
        <Button onPress={handleNext} className="flex-row items-center">
          <View className="w-5" />
          <View className="flex-1 items-center">
            <Button.Label>Let's Begin</Button.Label>
          </View>
          <ChevronRightIcon color="white" size={20} />
        </Button>
      </View>
    </View>
  );
}

