/**
 * Theme Store - Zustand store for theme management
 *
 * Manages app theme preferences with persistence.
 * Uses Uniwind for actual theme application.
 */

import { Uniwind } from "uniwind";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandStorage } from "@/lib/storage";

/** Valid theme values */
export type Theme = "system" | "light" | "dark";

/** Storage key for theme preference */
const THEME_STORAGE_KEY = "@boomboard/theme";

/** Theme store state interface */
interface ThemeState {
  /** User's theme preference ("system", "light", or "dark") */
  theme: Theme;
}

/** Theme store actions interface */
interface ThemeActions {
  /**
   * Set theme preference and apply it via Uniwind.
   * @param theme - The theme preference to set
   */
  setTheme: (theme: Theme) => void;

  /**
   * Toggle between light and dark themes (sets a fixed theme, not system).
   * @param currentTheme - The current active theme from Uniwind
   */
  toggleTheme: (currentTheme: string) => void;

  /**
   * Initialize the theme when the app starts.
   * Should be called after hydration to apply the persisted theme.
   */
  initializeTheme: () => void;
}

/** Combined theme store type */
export type ThemeStore = ThemeState & ThemeActions;

/**
 * Theme store using Zustand with persistence.
 *
 * Usage:
 * ```typescript
 * const theme = useThemeStore((state) => state.theme);
 * const setTheme = useThemeStore((state) => state.setTheme);
 * ```
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: "dark",

      // Actions
      setTheme: (theme: Theme) => {
        set({ theme });
        Uniwind.setTheme(theme);
      },

      toggleTheme: (currentTheme: string) => {
        const newTheme = currentTheme === "light" ? "dark" : "light";
        set({ theme: newTheme });
        Uniwind.setTheme(newTheme);
      },

      initializeTheme: () => {
        const { theme } = get();
        // Apply the persisted theme preference via Uniwind
        Uniwind.setTheme(theme);
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

/**
 * Selector hooks for common theme properties.
 * These provide better performance by selecting only what's needed.
 */
export const selectTheme = (state: ThemeStore) => state.theme;
export const selectSetTheme = (state: ThemeStore) => state.setTheme;
export const selectToggleTheme = (state: ThemeStore) => state.toggleTheme;
