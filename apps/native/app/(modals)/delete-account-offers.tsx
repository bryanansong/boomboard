import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { Button, Surface, PressableFeedback } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { useCSSVariable } from "uniwind";

import { LargeTitleView } from "@/components/ui/large-title-view";
import {
  DeletionReason,
  DELETION_REASON_LABELS,
  REASON_OFFERS,
  OfferType,
  type DeletionOffer,
} from "@/lib/deletion/deletion-reasons";
import { showBugReportMailPicker } from "@/lib/utils/bug-report";

/**
 * Screen B: Reason-Matched Offers
 * Shows retention alternatives based on the user's deletion reason.
 * Part of the retention-optimized deletion flow.
 */
export default function DeleteAccountOffersScreen() {
  const params = useLocalSearchParams<{
    reason: DeletionReason;
    freeText?: string;
  }>();

  const reason = params.reason as DeletionReason;
  const freeText = params.freeText ?? "";

  // Get theme colors
  const accentColor = (useCSSVariable("--accent") ?? "#007AFF") as string;
  const mutedColor = (useCSSVariable("--muted") ?? "#8E8E93") as string;

  // Get offers for this reason
  const offers = useMemo(() => {
    return REASON_OFFERS[reason] ?? REASON_OFFERS[DeletionReason.OTHER];
  }, [reason]);

  // Get human-readable reason label
  const reasonLabel = DELETION_REASON_LABELS[reason] ?? "your concern";

  // TODO: Analytics - Track 'deletion_offer_shown' event
  // Purpose: Measure offer exposure rate and by-reason breakdown
  // Payload: { reason, offers: offers.map(o => o.type) }
  useEffect(() => {
    // Track deletion_offer_shown event here
  }, [reason, offers]);

  /** Handle offer selection */
  const handleOfferPress = useCallback(
    (offer: DeletionOffer) => {
      // TODO: Analytics - Track 'deletion_offer_clicked' event
      // Purpose: Measure offer acceptance rate, understand which offers work
      // Payload: { reason, offerType: offer.type }

      switch (offer.type) {
        case OfferType.PAUSE:
          // Navigate to pause subscription flow
          router.replace("/(modals)/manage-subscriptions");
          break;

        case OfferType.DOWNGRADE:
          // Navigate to subscription management
          router.replace("/(modals)/manage-subscriptions");
          break;

        case OfferType.CONTACT_SUPPORT:
          // Open support contact
          showBugReportMailPicker(undefined, undefined);
          router.back();
          break;

        case OfferType.REPORT_BUG:
          // Open bug report with prefilled context
          showBugReportMailPicker(undefined, undefined);
          router.back();
          break;

        case OfferType.REQUEST_FEATURE:
          // Open feature request (using same bug report for now)
          showBugReportMailPicker(undefined, undefined);
          router.back();
          break;

        default:
          router.back();
      }
    },
    [reason]
  );

  /** Handle continue to deletion confirmation */
  const handleContinueToDelete = useCallback(() => {
    router.push({
      pathname: "/(modals)/delete-account-confirm",
      params: { reason, freeText },
    });
  }, [reason, freeText]);

  /** Render a single offer card */
  const renderOfferCard = useCallback(
    (offer: DeletionOffer, index: number) => {
      const Icon = offer.icon;
      return (
        <PressableFeedback
          key={offer.type}
          className="flex-row items-center border-b border-border/30"
          onPress={() => handleOfferPress(offer)}
        >
          <View className="w-12 h-12 rounded-full bg-accent/10 items-center justify-center mr-4">
            <Icon
              size={24}
              color={accentColor}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-semibold text-foreground mb-1">
              {offer.title}
            </Text>
            <Text className="text-[14px] text-muted leading-5">
              {offer.description}
            </Text>
          </View>
          <ChevronRight size={20} color={mutedColor} />
        </PressableFeedback>
      );
    },
    [handleOfferPress, accentColor, mutedColor]
  );

  return (
    <LargeTitleView noLargeTitle className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            We hear you
          </Text>
          <Text className="text-[16px] text-muted leading-6">
            You mentioned "{reasonLabel.toLowerCase()}". Before you go, would
            any of these help?
          </Text>
        </View>

        {/* Retention Offers */}
        <Surface className="gap-3">
          {offers.map(renderOfferCard)}
        </Surface>

        {/* Action Buttons */}
        <View className="mt-auto mb-8 gap-2">
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.back()}
          >
            <Button.Label>Go back</Button.Label>
          </Button>
          <Button
            variant="danger-soft"
            size="lg"
            onPress={handleContinueToDelete}
          >
            <Button.Label className="text-danger">
              Continue to deletion
            </Button.Label>
          </Button>
        </View>
    </LargeTitleView>
  );
}
