import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState, useRef } from "react";
import { Text, View, TextInput, Keyboard, Pressable } from "react-native";
import { Button, Surface } from "heroui-native";
import { useCSSVariable } from "uniwind";

import { LargeTitleView } from "@/components/ui/large-title-view";
import { DeletionReason } from "@/lib/deletion/deletion-reasons";

/**
 * Screen for capturing detailed feedback when user selects "Other" reason.
 * Displays a text area for the user to share their experience.
 * Provides three action paths:
 * - Submit & proceed to deletion confirmation
 * - Submit & go back to reconsider
 * - Dismiss without sending feedback
 */
export default function DeleteAccountFeedbackScreen() {
  const params = useLocalSearchParams<{ reason: DeletionReason }>();
  const [feedbackText, setFeedbackText] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Get theme colors
  const mutedColor = (useCSSVariable("--muted") ?? "#8E8E93") as string;

  /**
   * Submits feedback and navigates directly to the deletion confirmation screen.
   * Skips the offers screen since user has "Other" reason.
   */
  const handleSubmitAndProceed = useCallback(() => {
    // TODO: Analytics - Track 'deletion_feedback_submitted' event
    // Purpose: Capture detailed user feedback for "Other" reasons
    // Payload: { reason: params.reason, freeText: feedbackText, action: 'proceed' }

    router.push({
      pathname: "/(modals)/delete-account-confirm",
      params: {
        reason: params.reason || DeletionReason.OTHER,
        freeText: feedbackText,
      },
    });
  }, [params.reason, feedbackText]);

  /**
   * Submits feedback and dismisses the modal, letting user reconsider.
   */
  const handleSubmitAndGoBack = useCallback(() => {
    // TODO: Analytics - Track 'deletion_feedback_submitted' event
    // Purpose: Capture feedback from users who decided to stay
    // Payload: { reason: params.reason, freeText: feedbackText, action: 'back' }

    // Dismiss the entire deletion flow
    router.dismissAll();
  }, [params.reason, feedbackText]);

  /**
   * Cancel without sending any feedback.
   */
  const handleDismiss = useCallback(() => {
    // TODO: Analytics - Track 'deletion_feedback_cancelled' event
    router.dismissAll();
  }, []);

  const hasFeedback = feedbackText.trim().length > 0;

  /** Focus the input field when tapping the surface */
  const handleSurfacePress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <LargeTitleView noLargeTitle className="flex-1 px-5 pt-4">
      <Pressable
        className="flex-1"
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Tell us more
          </Text>
          <Text className="text-[16px] text-muted leading-6">
            Your feedback helps us improve. Share what wasn't working for you.
          </Text>
        </View>

        {/* Feedback Text Input Surface */}
        <Pressable onPress={handleSurfacePress}>
          <Surface className="overflow-hidden mb-6 min-h-[160px] max-h-[240px]">
            <TextInput
              ref={inputRef}
              className="bg-field-background text-[15px] text-field-foreground"
              placeholder="What could we have done better?"
              placeholderTextColor={mutedColor}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              textAlignVertical="top"
              pointerEvents="auto"
            />
          </Surface>
        </Pressable>

        {/* Action Area */}
        <View className="mt-auto mb-8 gap-4">
          {/* Primary Action: Submit & Proceed to Deletion */}
          <Button
            variant="danger"
            size="lg"
            onPress={handleSubmitAndProceed}
            isDisabled={!hasFeedback}
          >
            <Button.Label>Submit & Proceed to Deletion</Button.Label>
          </Button>

          {/* Submit & Go Back */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmitAndGoBack}
            isDisabled={!hasFeedback}
          >
            <Button.Label>Submit & Go Back</Button.Label>
          </Button>

          {/* Dismiss */}
          <Button
            variant="tertiary"
            size="lg"
            onPress={handleDismiss}
          >
            <Button.Label>Dismiss</Button.Label>
          </Button>
        </View>
      </Pressable>
    </LargeTitleView>
  );
}
