import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Surface,
  RadioGroup,
  Radio,
  Label,
  Separator,
} from "heroui-native";

import { LargeTitleView } from "@/components/ui/large-title-view";
import { SafeAreaView } from "@/components/safe-area-view";
import {
  DeletionReason,
  DELETION_REASON_LABELS,
  DELETION_REASONS_ORDER,
} from "@/lib/deletion/deletion-reasons";

/**
 * Screen A: Exit Survey
 * Captures the user's reason for wanting to delete their account.
 * Part of the retention-optimized deletion flow.
 */
export default function DeleteAccountScreen() {
  const [selectedReason, setSelectedReason] = useState<DeletionReason | null>(
    null
  );

  // TODO: Analytics - Track 'deletion_flow_started' event
  // Purpose: Measure how many users enter the deletion flow
  // Fires: On component mount
  useEffect(() => {
    // Track deletion_flow_started event here
  }, []);

  /** Handle reason selection */
  const handleReasonSelect = useCallback((reason: DeletionReason) => {
    setSelectedReason(reason);
  }, []);

  /** Handle continue to next screen */
  const handleContinue = useCallback(() => {
    if (!selectedReason) return;

    if (selectedReason === DeletionReason.OTHER) {
      // Navigate to feedback screen for "Other" reason
      router.push({
        pathname: "/(modals)/delete-account-feedback",
        params: { reason: selectedReason },
      });
    } else {
      // Navigate to offers screen for specific reasons
      // TODO: Analytics - Track 'deletion_reason_selected' event
      router.push({
        pathname: "/(modals)/delete-account-offers",
        params: {
          reason: selectedReason,
        },
      });
    }
  }, [selectedReason]);

  const canContinue = selectedReason !== null;

  return (
    <LargeTitleView noLargeTitle>
      <SafeAreaView className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Before you go...
          </Text>
          <Text className="text-[16px] text-muted leading-6">
            We'd love to understand why you're leaving. Your feedback helps us
            improve.
          </Text>
        </View>

        {/* Reason Selection */}
        <Surface className="rounded-2xl overflow-hidden mb-6">
          <RadioGroup 
            value={selectedReason || ""} 
            onValueChange={(val: string) => handleReasonSelect(val as DeletionReason)}
          >
            {DELETION_REASONS_ORDER.map((reason, index) => {
              const label = DELETION_REASON_LABELS[reason];
              
              return (
                <React.Fragment key={reason}>
                  <RadioGroup.Item value={reason}>
                    <Label className="text-lg font-normal py-1">{label}</Label>
                    <Radio />
                  </RadioGroup.Item>
                  {index < DELETION_REASONS_ORDER.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </React.Fragment>
              );
            })}
          </RadioGroup>
        </Surface>

        {/* Action Buttons */}
        <View className="mt-auto mb-8 gap-4">
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.back()}
          >
            <Button.Label>
              Cancel
            </Button.Label>
          </Button>
          <Button
            variant="danger-soft"
            size="lg"
            onPress={handleContinue}
            isDisabled={!canContinue}
          >
            <Button.Label>Continue</Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </LargeTitleView>
  );
}
