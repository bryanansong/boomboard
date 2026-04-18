/**
 * Stores Module - Zustand store exports
 *
 * This module provides centralized exports for all Zustand stores.
 * Import stores from here rather than directly from individual files.
 */

export { useThemeStore, selectTheme, selectThemeHasHydrated, selectSetTheme, selectToggleTheme } from "./theme-store";
export type { ThemeStore, Theme } from "./theme-store";

export {
  useOnboardingStore,
  selectOnboardingData,
  selectOnboardingIsComplete,
  selectOnboardingIsLoading,
  selectOnboardingProgress,
  selectCurrentScreen,
} from "./onboarding-store";
export type { OnboardingStore } from "./onboarding-store";
