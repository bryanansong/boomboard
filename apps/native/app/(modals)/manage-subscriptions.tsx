import { useCallback, useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { LargeTitleScrollView } from "@/components/ui/large-title-view";

/**
 * Subscription tier information.
 */
interface SubscriptionInfo {
  tier: string;
  price: string;
  billingCycle: string;
  nextBillingDate: string;
  features: string[];
}

/**
 * Mock subscription data - replace with actual data fetching.
 */
const MOCK_SUBSCRIPTION: SubscriptionInfo = {
  tier: "Premium",
  price: "$9.99",
  billingCycle: "Monthly",
  nextBillingDate: "February 10, 2026",
  features: [
    "Unlimited access to all features",
    "Priority customer support",
    "Early access to new features",
    "Ad-free experience",
  ],
};

/**
 * Unsubscribe modal component with feedback input.
 */
function UnsubscribeModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState("");

  const handleConfirm = useCallback(() => {
    onConfirm(feedback);
    setFeedback("");
  }, [feedback, onConfirm]);

  const handleClose = useCallback(() => {
    setFeedback("");
    onClose();
  }, [onClose]);

  const isButtonDisabled = feedback.trim().length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={20}
        tint="dark"
        className="flex-1 justify-center items-center px-5"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full"
        >
          <View className="bg-surface rounded-2xl overflow-hidden shadow-lg w-full max-w-[400px] self-center">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
              <Text className="text-[17px] font-semibold text-foreground">
                Unsubscribe
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.6}
                className="p-1"
              >
                <Ionicons name="close" size={24} color="var(--muted)" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="p-4">
              <Text className="text-[15px] text-muted mb-4">
                We're sorry to see you go. Please let us know why you're leaving
                so we can improve the app for everyone.
              </Text>

              <TextInput
                className="bg-field-background rounded-xl px-4 py-3 text-[15px] text-field-foreground min-h-[120px]"
                placeholder="Tell us why you're leaving..."
                placeholderTextColor="var(--field-placeholder)"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Footer */}
            <View className="px-4 pb-4">
              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${
                  isButtonDisabled ? "bg-muted" : "bg-danger"
                }`}
                activeOpacity={isButtonDisabled ? 1 : 0.6}
                onPress={handleConfirm}
                disabled={isButtonDisabled}
              >
                <Text
                  className={`text-[17px] font-semibold ${
                    isButtonDisabled ? "text-muted" : "text-danger-foreground"
                  }`}
                >
                  Confirm and Unsubscribe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

/**
 * Feature list item component.
 */
function FeatureItem({ feature }: { feature: string }) {
  return (
    <View className="flex-row items-center py-2">
      <View className="w-5 h-5 rounded-full bg-success items-center justify-center mr-3">
        <Ionicons name="checkmark" size={14} color="var(--success-foreground)" />
      </View>
      <Text className="text-[15px] text-foreground flex-1">{feature}</Text>
    </View>
  );
}

/**
 * Manage Subscriptions modal screen.
 * Displays current subscription information and provides unsubscribe functionality.
 */
export default function ManageSubscriptionsModal() {
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const subscription = MOCK_SUBSCRIPTION;

  /**
   * Handles opening the unsubscribe confirmation modal.
   */
  const handleUnsubscribePress = useCallback(() => {
    setShowUnsubscribeModal(true);
  }, []);

  /**
   * Handles closing the unsubscribe modal.
   */
  const handleCloseUnsubscribe = useCallback(() => {
    setShowUnsubscribeModal(false);
  }, []);

  /**
   * Placeholder handler for confirming unsubscription.
   * TODO: Implement actual unsubscription logic.
   * @param feedback - User's feedback on why they're leaving
   */
  const handleConfirmUnsubscribe = useCallback((feedback: string) => {
    console.log("[PLACEHOLDER] handleConfirmUnsubscribe called");
    console.log("  - Feedback:", feedback);
    
    // TODO: Implement actual unsubscription logic:
    // - Call subscription cancellation API
    // - Submit feedback to analytics/backend
    // - Update local subscription state
    // - Show success confirmation
    // - Navigate back or update UI accordingly

    setShowUnsubscribeModal(false);
  }, []);

  return (
    <>
      <LargeTitleScrollView contentContainerClassName="px-5" noLargeTitle={true}>
        {/* Current Plan Section */}
        <View className="mt-6">
          <Text className="text-[13px] font-semibold text-muted uppercase tracking-[0.5px] mb-2.5 pl-1">
            Current Plan
          </Text>
          <View className="bg-surface rounded-2xl overflow-hidden shadow-sm">
            {/* Subscription Tier */}
            <View className="flex-row items-center justify-between py-4 px-4">
              <Text className="text-[17px] text-foreground">Plan</Text>
              <View className="flex-row items-center">
                <View className="bg-accent px-2.5 py-1 rounded-full mr-2">
                  <Text className="text-[13px] font-semibold text-accent-foreground">
                    {subscription.tier}
                  </Text>
                </View>
              </View>
            </View>

            <View className="h-[0.5px] bg-border ml-4" />

            {/* Price */}
            <View className="flex-row items-center justify-between py-4 px-4">
              <Text className="text-[17px] text-foreground">Price</Text>
              <Text className="text-[17px] text-muted">
                {subscription.price} / {subscription.billingCycle.toLowerCase()}
              </Text>
            </View>

            <View className="h-[0.5px] bg-border ml-4" />

            {/* Billing Cycle */}
            <View className="flex-row items-center justify-between py-4 px-4">
              <Text className="text-[17px] text-foreground">Billing Cycle</Text>
              <Text className="text-[17px] text-muted">
                {subscription.billingCycle}
              </Text>
            </View>

            <View className="h-[0.5px] bg-border ml-4" />

            {/* Next Billing Date */}
            <View className="flex-row items-center justify-between py-4 px-4">
              <Text className="text-[17px] text-foreground">Next Billing</Text>
              <Text className="text-[17px] text-muted">
                {subscription.nextBillingDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="mt-6">
          <Text className="text-[13px] font-semibold text-muted uppercase tracking-[0.5px] mb-2.5 pl-1">
            Your Benefits
          </Text>
          <View className="bg-surface rounded-2xl overflow-hidden shadow-sm px-4 py-2">
            {subscription.features.map((feature, index) => (
              <FeatureItem key={index} feature={feature} />
            ))}
          </View>
        </View>

        {/* Unsubscribe Button */}
        <View className="mt-8 mb-8">
          <TouchableOpacity
            className="bg-danger/10 rounded-xl py-4 items-center shadow-sm"
            activeOpacity={0.6}
            onPress={handleUnsubscribePress}
          >
            <Text className="text-[17px] font-normal text-danger">
              Unsubscribe
            </Text>
          </TouchableOpacity>
          <Text className="text-[13px] text-muted text-center mt-3 px-4">
            Your subscription will remain active until the end of your current
            billing period.
          </Text>
        </View>
      </LargeTitleScrollView>

      {/* Unsubscribe Confirmation Modal */}
      <UnsubscribeModal
        visible={showUnsubscribeModal}
        onClose={handleCloseUnsubscribe}
        onConfirm={handleConfirmUnsubscribe}
      />
    </>
  );
}
