/**
 * Onboarding Store - Zustand store for onboarding state management
 *
 * Manages the complete onboarding flow state with persistence.
 * Replaces the OnboardingContext with a more efficient Zustand implementation.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
	OnboardingData,
	OnboardingScreenMeta,
	PricingTier,
} from "@/lib/onboarding/types";
import {
	DEFAULT_ONBOARDING_DATA,
	ONBOARDING_SCREENS,
	TOTAL_ONBOARDING_SCREENS,
} from "@/lib/onboarding/types";
import { zustandStorage } from "@/lib/storage";

/** Storage keys for onboarding data */
const ONBOARDING_STORAGE_KEY = "@cravecalm/onboarding";
const COMPLETION_STORAGE_KEY = "@cravecalm/onboarding_complete";

/** Onboarding store state interface */
interface OnboardingState {
	/** Complete onboarding data */
	data: OnboardingData;
	/** Whether onboarding is marked as complete */
	isComplete: boolean;
}

/** Onboarding store actions interface */
interface OnboardingActions {
	// State setters
	setUserName: (name: string) => void;
	setSelectedPricingTier: (tier: PricingTier) => void;

	// Navigation helpers (screen tracking only, actual navigation in hooks)
	setCurrentScreen: (screenNumber: number) => void;
	markScreenCompleted: (screenNumber: number) => void;

	// Lifecycle actions
	completeOnboarding: () => Promise<void>;
	startTrial: () => Promise<void>;
	resetOnboarding: () => void;
}

/** Computed values interface */
interface OnboardingComputed {
	/** Current screen number */
	currentScreen: number;
	/** Progress value between 0 and 1 */
	progress: number;
}

/** Combined onboarding store type */
export type OnboardingStore = OnboardingState &
	OnboardingActions &
	OnboardingComputed;

/**
 * Onboarding store using Zustand with persistence.
 *
 * Usage:
 * ```typescript
 * const data = useOnboardingStore((state) => state.data);
 * const setSelectedPricingTier = useOnboardingStore((state) => state.setSelectedPricingTier);
 * ```
 */
export const useOnboardingStore = create<OnboardingStore>()(
	persist(
		(set, get) => ({
			// Initial state
			data: { ...DEFAULT_ONBOARDING_DATA, startedAt: Date.now() },
			isComplete: false,

			// Computed getters
			get currentScreen() {
				return get().data.currentScreen;
			},
			get progress() {
				const currentScreen = get().data.currentScreen;
				return (currentScreen - 1) / (TOTAL_ONBOARDING_SCREENS - 1);
			},

			// Screen-specific setters
			setUserName: (userName: string) => {
				set((state) => ({
					data: { ...state.data, userName },
				}));
			},

			setSelectedPricingTier: (selectedPricingTier: PricingTier) => {
				set((state) => ({
					data: { ...state.data, selectedPricingTier },
				}));
			},

			// Navigation state management
			setCurrentScreen: (screenNumber: number) => {
				set((state) => ({
					data: { ...state.data, currentScreen: screenNumber },
				}));
			},

			markScreenCompleted: (screenNumber: number) => {
				set((state) => ({
					data: {
						...state.data,
						completedScreens: [
							...new Set([...state.data.completedScreens, screenNumber]),
						],
					},
				}));
			},

			// Lifecycle actions
			completeOnboarding: async () => {
				set((state) => ({
					data: {
						...state.data,
						completedAt: Date.now(),
						completedScreens: [
							...new Set([
								...state.data.completedScreens,
								TOTAL_ONBOARDING_SCREENS,
							]),
						],
					},
					isComplete: true,
				}));
			},

			startTrial: async () => {
				set((state) => ({
					data: {
						...state.data,
						trialStarted: true,
					},
				}));
				await get().completeOnboarding();
			},

			resetOnboarding: () => {
				set({
					data: {
						...DEFAULT_ONBOARDING_DATA,
						startedAt: Date.now(),
					},
					isComplete: false,
				});
			},
		}),
		{
			name: ONBOARDING_STORAGE_KEY,
			storage: createJSONStorage(() => zustandStorage),
			partialize: (state) => ({
				data: state.data,
				// todo: remove in production
				isComplete: __DEV__ ? false : state.isComplete, // Always false in dev mode
			}),
		},
	),
);

/**
 * Selector hooks for common onboarding properties.
 * These provide better performance by selecting only what's needed.
 */
export const selectOnboardingData = (state: OnboardingStore) => state.data;
export const selectOnboardingIsComplete = (state: OnboardingStore) =>
	state.isComplete;
export const selectOnboardingProgress = (state: OnboardingStore) =>
	(state.data.currentScreen - 1) / (TOTAL_ONBOARDING_SCREENS - 1);
export const selectCurrentScreen = (state: OnboardingStore) =>
	state.data.currentScreen;
