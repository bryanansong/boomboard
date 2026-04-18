import {
  PauseCircle,
  ArrowDownCircle,
  MessageCircle,
  Bug,
  Lightbulb,
  ShieldCheck,
  type LucideIcon,
  MessageSquareText,
} from "lucide-react-native";

/**
 * Deletion flow types and constants.
 *
 * Defines the reasons users may want to delete their account
 * and the corresponding retention offers.
 */

/**
 * Reasons a user might want to delete their account.
 * Used for exit survey and analytics.
 */
export enum DeletionReason {
  TOO_EXPENSIVE = "too_expensive",
  MISSING_FEATURES = "missing_features",
  BUGS_PERFORMANCE = "bugs_performance",
  DONT_USE_ENOUGH = "dont_use_enough",
  SWITCHING_COMPETITOR = "switching_competitor",
  OTHER = "other",
}

/**
 * Human-readable labels for each deletion reason.
 */
export const DELETION_REASON_LABELS: Record<DeletionReason, string> = {
  [DeletionReason.TOO_EXPENSIVE]: "Too expensive",
  [DeletionReason.MISSING_FEATURES]: "Missing features I need",
  [DeletionReason.BUGS_PERFORMANCE]: "Bugs or performance issues",
  [DeletionReason.DONT_USE_ENOUGH]: "I don't use the app enough",
  [DeletionReason.SWITCHING_COMPETITOR]: "Switching to a different app",
  [DeletionReason.OTHER]: "Other reason",
};

/**
 * Ordered list of deletion reasons for the exit survey.
 */
export const DELETION_REASONS_ORDER: DeletionReason[] = [
  DeletionReason.TOO_EXPENSIVE,
  DeletionReason.MISSING_FEATURES,
  DeletionReason.BUGS_PERFORMANCE,
  DeletionReason.DONT_USE_ENOUGH,
  DeletionReason.SWITCHING_COMPETITOR,
  DeletionReason.OTHER,
];

/**
 * Types of offers that can be shown to retain users.
 */
export enum OfferType {
  PAUSE = "pause",
  DOWNGRADE = "downgrade",
  CONTACT_SUPPORT = "contact_support",
  REPORT_BUG = "report_bug",
  REQUEST_FEATURE = "request_feature",
}

/**
 * Configuration for a retention offer.
 */
export interface DeletionOffer {
  type: OfferType;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Reason-matched offers configuration.
 * Maps each deletion reason to a list of alternative offers.
 */
export const REASON_OFFERS: Record<DeletionReason, DeletionOffer[]> = {
  [DeletionReason.TOO_EXPENSIVE]: [
    {
      type: OfferType.PAUSE,
      title: "Pause your subscription",
      description: "Take a break for 1-2 months. Your data stays safe.",
      icon: PauseCircle,
    },
    {
      type: OfferType.DOWNGRADE,
      title: "Switch to a cheaper plan",
      description: "Keep using core features at a lower price.",
      icon: ArrowDownCircle,
    },
    {
      type: OfferType.CONTACT_SUPPORT,
      title: "Talk to us",
      description: "We may be able to help with your billing.",
      icon: MessageCircle,
    },
  ],
  [DeletionReason.BUGS_PERFORMANCE]: [
    {
      type: OfferType.REPORT_BUG,
      title: "Report the issue",
      description: "Help us fix it. We'll follow up personally.",
      icon: Bug,
    },
    {
      type: OfferType.CONTACT_SUPPORT,
      title: "Chat with support",
      description: "Get help resolving your issue right now.",
      icon: MessageSquareText,
    },
  ],
  [DeletionReason.MISSING_FEATURES]: [
    {
      type: OfferType.REQUEST_FEATURE,
      title: "Request this feature",
      description: "Tell us what you need. We prioritize user feedback.",
      icon: Lightbulb,
    },
    {
      type: OfferType.CONTACT_SUPPORT,
      title: "Talk to our team",
      description: "Learn about upcoming features that might help.",
      icon: MessageCircle,
    },
  ],
  [DeletionReason.DONT_USE_ENOUGH]: [
    {
      type: OfferType.PAUSE,
      title: "Pause instead",
      description: "Come back when you're ready. No commitment.",
      icon: PauseCircle,
    },
    {
      type: OfferType.DOWNGRADE,
      title: "Try a lighter plan",
      description: "Pay less for occasional use.",
      icon: ArrowDownCircle,
    },
  ],
  [DeletionReason.SWITCHING_COMPETITOR]: [
    {
      type: OfferType.CONTACT_SUPPORT,
      title: "Tell us what's missing",
      description: "Your feedback helps us improve.",
      icon: MessageCircle,
    },
  ],
  [DeletionReason.OTHER]: [
    {
      type: OfferType.CONTACT_SUPPORT,
      title: "Talk to us first",
      description: "We'd love to understand and help if we can.",
      icon: MessageCircle,
    },
  ],
};
