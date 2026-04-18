/**
 * useAppTheme Hook - Theme state management hook
 *
 * Drop-in replacement for the old useAppTheme context hook.
 * Uses Zustand store internally for better performance.
 */

import { useMemo } from "react";
import { useUniwind } from "uniwind";

import { useThemeStore } from "@/lib/stores";
import type { Theme } from "@/lib/stores";

/**
 * Interface matching the old AppThemeContext API for backwards compatibility.
 */
interface AppThemeHookReturn {
  /** Current active theme ("light" or "dark") */
  currentTheme: string;
  /** User's theme preference ("system", "light", or "dark") */
  theme: Theme;
  /** Whether current active theme is light */
  isLight: boolean;
  /** Whether current active theme is dark */
  isDark: boolean;
  /** Whether adaptive/system theme is enabled */
  isSystemTheme: boolean;
  /** Whether preferences are still loading */
  isLoading: boolean;
  /** Set theme preference */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark (sets a fixed theme) */
  toggleTheme: () => void;
  /** Initialize theme on app load */
  initializeTheme: () => void;
}

/**
 * Hook providing access to theme state and actions.
 * This is a drop-in replacement for the old useAppTheme context hook.
 *
 * @returns Theme state and action functions
 *
 * @example
 * ```typescript
 * const { isDark, setTheme, toggleTheme } = useAppTheme();
 *
 * // Set specific theme
 * setTheme("dark");
 *
 * // Toggle between light/dark
 * toggleTheme();
 * ```
 */
export function useAppTheme(): AppThemeHookReturn {
  // Get Uniwind state for the actual active theme
  const { theme: activeTheme, hasAdaptiveThemes } = useUniwind();

  // Get store state and actions
  const theme = useThemeStore((state) => state.theme);
  const setThemeAction = useThemeStore((state) => state.setTheme);
  const toggleThemeAction = useThemeStore((state) => state.toggleTheme);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  // Compute derived values
  const isLight = useMemo(() => activeTheme === "light", [activeTheme]);
  const isDark = useMemo(() => activeTheme === "dark", [activeTheme]);

  // Create stable toggle function that uses current theme
  const toggleTheme = useMemo(
    () => () => toggleThemeAction(activeTheme),
    [toggleThemeAction, activeTheme]
  );

  return {
    currentTheme: activeTheme,
    theme,
    isLight,
    isDark,
    isSystemTheme: hasAdaptiveThemes,
    isLoading: false, // Sync storage
    setTheme: setThemeAction,
    toggleTheme,
    initializeTheme,
  };
}
