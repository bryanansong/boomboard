/**
 * useOnboarding Hook - Unified onboarding state, navigation, and lifecycle
 *
 * Single hook that combines route-based screen detection, navigation,
 * domain setters, and lifecycle actions. Replaces both the old
 * useOnboardingScreen and useOnboarding hooks.
 */

import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";

import { useOnboardingStore } from "@/lib/stores";

import type { OnboardingData, OnboardingScreenMeta, PricingTier } from "./types";
import { ONBOARDING_SCREENS, TOTAL_ONBOARDING_SCREENS } from "./types";

/** Return type for the useOnboarding hook */
interface UseOnboardingReturn {
	// Route-derived screen info
	/** Current screen metadata (derived from route) */
	screenMeta: OnboardingScreenMeta | undefined;
	/** Current screen index (0-indexed) */
	currentIndex: number;
	/** Whether this is the first screen */
	isFirst: boolean;
	/** Whether this is the last screen */
	isLast: boolean;

	// State
	/** Complete onboarding data */
	data: OnboardingData;
	/** Current screen number (1-indexed) */
	currentScreen: number;
	/** Progress value between 0 and 1 */
	progress: number;
	/** Whether onboarding has been completed */
	isComplete: boolean;

	// Navigation
	/** Navigate to the next screen (marks current as completed) */
	next: () => void;
	/** Navigate to the previous screen */
	back: () => void;
	/** Navigate directly to a specific screen by number */
	goToScreen: (screenNumber: number) => void;

	// Domain setters
	/** Set the user's name */
	setUserName: (name: string) => void;
	/** Set the user's selected pricing tier */
	setSelectedPricingTier: (tier: PricingTier) => void;

	// Lifecycle actions
	/** Mark onboarding as complete and navigate to home */
	completeOnboarding: () => Promise<void>;
	/** Reset all onboarding state and navigate to first screen */
	resetOnboarding: () => Promise<void>;
	/** Start trial, complete onboarding, and navigate to home */
	startTrial: () => Promise<void>;
}

/**
 * Maps a route pathname to its corresponding screen metadata.
 *
 * @param pathname - Route pathname (e.g., "/(onboarding)/01-welcome")
 * @returns Screen metadata or undefined if not found
 */
function getScreenFromRoute(
	pathname: string,
): OnboardingScreenMeta | undefined {
	const segments = pathname.split("/").filter(Boolean);
	const routeName = segments[segments.length - 1];

	return ONBOARDING_SCREENS.find((screen) => screen.route === routeName);
}

/**
 * Unified onboarding hook providing route-based screen detection,
 * navigation, state access, domain setters, and lifecycle actions.
 *
 * @returns Onboarding state, navigation, setters, and lifecycle actions
 *
 * @example
 * ```typescript
 * // In any onboarding screen — just call next()
 * const { next } = useOnboarding();
 *
 * // Access state, lifecycle, or domain setters as needed
 * const { data, startTrial, setSelectedPricingTier } = useOnboarding();
 * ```
 */
export function useOnboarding(): UseOnboardingReturn {
	const router = useRouter();
	const pathname = usePathname();

	// Store state
	const data = useOnboardingStore((state) => state.data);
	const isComplete = useOnboardingStore((state) => state.isComplete);

	// Store actions
	const setCurrentScreen = useOnboardingStore(
		(state) => state.setCurrentScreen,
	);
	const markScreenCompleted = useOnboardingStore(
		(state) => state.markScreenCompleted,
	);
	const setSelectedPricingTier = useOnboardingStore(
		(state) => state.setSelectedPricingTier,
	);
	const setUserName = useOnboardingStore(
		(state) => state.setUserName,
	);
	const completeOnboardingAction = useOnboardingStore(
		(state) => state.completeOnboarding,
	);
	const startTrialAction = useOnboardingStore((state) => state.startTrial);
	const resetOnboardingAction = useOnboardingStore(
		(state) => state.resetOnboarding,
	);

	// Route-based screen detection (source of truth is the URL)
	const screenMeta = useMemo(() => getScreenFromRoute(pathname), [pathname]);
	const screenId = screenMeta?.id ?? 1;

	const currentIndex = useMemo(
		() => ONBOARDING_SCREENS.findIndex((s) => s.id === screenId),
		[screenId],
	);

	const isFirst = currentIndex === 0;
	const isLast = currentIndex === ONBOARDING_SCREENS.length - 1;

	// Progress derived from route-detected screen
	const progress = useMemo(
		() => (screenId - 1) / (TOTAL_ONBOARDING_SCREENS - 1),
		[screenId],
	);

	// Sync store's currentScreen with route on mount/navigation
	useEffect(() => {
		if (screenMeta) {
			setCurrentScreen(screenMeta.id);
		}
	}, [screenMeta, setCurrentScreen]);

	// --- Navigation ---

	const next = useCallback(() => {
		if (isLast || currentIndex === -1) return;

		markScreenCompleted(screenId);

		const nextScreen = ONBOARDING_SCREENS[currentIndex + 1];
		setCurrentScreen(nextScreen.id);
		router.push(`/(onboarding)/${nextScreen.route}` as never);
	}, [currentIndex, isLast, markScreenCompleted, screenId, setCurrentScreen, router]);

	const back = useCallback(() => {
		if (isFirst || currentIndex === -1) return;

		const prevScreen = ONBOARDING_SCREENS[currentIndex - 1];
		setCurrentScreen(prevScreen.id);
		router.push(`/(onboarding)/${prevScreen.route}` as never);
	}, [currentIndex, isFirst, setCurrentScreen, router]);

	const goToScreen = useCallback(
		(screenNumber: number) => {
			const target = ONBOARDING_SCREENS.find((s) => s.id === screenNumber);
			if (target) {
				setCurrentScreen(screenNumber);
				router.push(`/(onboarding)/${target.route}` as never);
			}
		},
		[setCurrentScreen, router],
	);

	// --- Lifecycle ---

	const completeOnboarding = useCallback(async () => {
		await completeOnboardingAction();
		router.replace("/(tabs)/home");
	}, [completeOnboardingAction, router]);

	const resetOnboarding = useCallback(async () => {
		resetOnboardingAction();
		router.replace("/(onboarding)/01-welcome" as never);
	}, [resetOnboardingAction, router]);

	const startTrial = useCallback(async () => {
		await startTrialAction();
		router.replace("/(tabs)/home");
	}, [startTrialAction, router]);

	return {
		// Route-derived
		screenMeta,
		currentIndex,
		isFirst,
		isLast,

		// State
		data,
		currentScreen: screenId,
		progress,
		isComplete,

		// Navigation
		next,
		back,
		goToScreen,

		// Domain setters
		setUserName,
		setSelectedPricingTier,

		// Lifecycle
		completeOnboarding,
		resetOnboarding,
		startTrial,
	};
}

// Backwards-compatible alias
export { useOnboarding as useOnboardingContext };
