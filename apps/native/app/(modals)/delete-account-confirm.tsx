import { useClerk, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View, Alert } from "react-native";
import { useToast, Button, Surface, Spinner } from "heroui-native";
import { TriangleAlert } from "lucide-react-native";

import { LargeTitleView } from "@/components/ui/large-title-view";
import { DeletionReason } from "@/lib/deletion/deletion-reasons";

/**
 * Screen C: Confirmation
 * Final step in the deletion flow. Explains consequences and processes deletion.
 * Part of the retention-optimized deletion flow.
 */
export default function DeleteAccountConfirmScreen() {
  const params = useLocalSearchParams<{
    reason: DeletionReason;
    freeText?: string;
  }>();

  const reason = params.reason as DeletionReason;
  const freeText = params.freeText ?? "";

  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  /** Handle final account deletion */
  const handleDeleteAction = useCallback(async () => {
    Alert.alert(
      "Confirm Deletion",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);

              // TODO: Analytics - Track 'deletion_confirmed' event
              // Purpose: Measure final confirmation rate after seeing all offers
              // Payload: { reason, freeText }

              // TODO: Call backend deletion request endpoint
              // The backend should:
              // 1. Store the deletion request with reason/freeText for analysis
              // 2. Mark user.deletionRequested = true
              // 3. Schedule hard delete after grace period (if applicable)

              // Simulate API call for now
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // If user functionality is available, delete the user
              if (user) {
                // await user.delete();
              }

              // Sign out the user
              await signOut();

              // TODO: Analytics - Track 'deletion_completed' event
              // Purpose: Measure successful deletion completion
              // Payload: { reason }

              toast.show({
                label: "Account Deleted",
                description: "Your account has been permanently deleted.",
                variant: "success",
                duration: 5000,
              });

              // Navigation will be handled by auth state changes
              router.replace("/");
            } catch (error) {
              console.error("Delete account error:", error);
              toast.show({
                label: "Error",
                description: "Failed to delete account. Please try again.",
                variant: "danger",
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [user, signOut, toast, reason, freeText]);

  return (
    <LargeTitleView noLargeTitle className="flex-1 px-5 pt-8">
        {/* Warning Icon */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-danger/10 items-center justify-center mb-6">
            <TriangleAlert size={50} color="#FF3B30" />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center mb-3">
            Delete Account
          </Text>
          <Text className="text-[17px] text-muted text-center px-4 leading-6">
            This is permanent. All your data will be deleted and cannot be
            recovered.
          </Text>
        </View>

        {/* Important Information */}
        <Surface className="p-5 mb-8 border border-border/50 rounded-2xl">
          <Text className="text-[15px] font-semibold text-foreground mb-4 uppercase tracking-wider">
            What happens next
          </Text>
          <View className="gap-4">
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-danger mt-2 mr-3" />
              <Text className="flex-1 text-[16px] text-muted leading-5">
                Your profile and all personal data will be permanently removed.
              </Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-danger mt-2 mr-3" />
              <Text className="flex-1 text-[16px] text-muted leading-5">
                Any active subscriptions will be cancelled immediately.
              </Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-danger mt-2 mr-3" />
              <Text className="flex-1 text-[16px] text-muted leading-5">
                Deletion is processed within 30 days per our privacy policy.
              </Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-danger mt-2 mr-3" />
              <Text className="flex-1 text-[16px] text-muted leading-5">
                This action is irreversible and cannot be undone.
              </Text>
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View className="mt-auto mb-8 gap-4">
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.dismissAll()}
            isDisabled={isDeleting}
          >
            <Button.Label>Keep My Account</Button.Label>
          </Button>
          <Button
            variant="danger"
            size="md"
            onPress={handleDeleteAction}
            isDisabled={isDeleting}
          >
            {isDeleting ? (
              <View className="flex-row items-center">
                <Spinner size="sm" color="white" className="mr-2" />
                <Button.Label>Deleting...</Button.Label>
              </View>
            ) : (
              <Button.Label>Permanently Delete Account</Button.Label>
            )}
          </Button>
        </View>
    </LargeTitleView>
  );
}
