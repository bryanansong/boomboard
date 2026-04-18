/**
 * NavigationThemeProvider - React Navigation theme wrapper
 *
 * Provides the navigation theme based on the system color scheme.
 * This ensures the navigation container's background color matches
 * the app theme, preventing jarring flashes when modals bounce or animate.
 */

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

interface NavigationThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps children with React Navigation's ThemeProvider.
 *
 * @param children - Child components to wrap
 * @returns ThemeProvider wrapping children with appropriate theme
 *
 * @example
 * ```tsx
 * <NavigationThemeProvider>
 *   <StackLayout />
 * </NavigationThemeProvider>
 * ```
 */
export function NavigationThemeProvider({
  children,
}: NavigationThemeProviderProps) {
  const colorScheme = useColorScheme();

  const navigationTheme = useMemo(
    () => (colorScheme === "dark" ? DarkTheme : DefaultTheme),
    [colorScheme]
  );

  return <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>;
}
