/**
 * CraveCalm Onboarding Flow Types
 *
 * These types define the data structures for the onboarding journey.
 */

export type PricingTier = "weekly" | "monthly" | "annual";

// Initial/default onboarding data - types inferred from this structure
export const DEFAULT_ONBOARDING_DATA = {
	currentScreen: 1,
	completedScreens: [] as number[],

	userName: null as string | null,
	selectedPricingTier: null as PricingTier | null,
	trialStarted: false,

	startedAt: null as number | null,
	completedAt: null as number | null,
};

// Export the inferred type
export type OnboardingData = typeof DEFAULT_ONBOARDING_DATA;

// Screen metadata - inferred from the array
export const ONBOARDING_SCREENS = [
	{ id: 1, name: "Welcome Hero", route: "01-welcome" },
	{ id: 2, name: "Membership Card", route: "02-membership-card" },
	{ id: 3, name: "Quiz", route: "03-quiz" },
	{ id: 4, name: "Quiz Complete", route: "04-quiz-complete" },
	{ id: 5, name: "Sign In", route: "06-sign-in" },
] as const;

export type OnboardingScreenMeta = (typeof ONBOARDING_SCREENS)[number];

// Total screens count
export const TOTAL_ONBOARDING_SCREENS = ONBOARDING_SCREENS.length;
