import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isIOS, isIOS26OrLater } from "./platform";

/**
 * Get screen options for tab screens with native Large Title header behavior.
 * 
 * This creates the native iOS pattern where:
 * - A large title displays when scrolled to top
 * - Title collapses into the header bar on scroll with progressive blur
 * - Content scrolls behind the transparent header
 * 
 * Use with `TabScreenScrollView` from '@/components/ui/tab-screen-view'
 * for proper content layout and scroll behavior.
 * 
 * @param title - The screen title displayed in the header
 * @returns Native stack navigation options configured for large title behavior
 * 
 * @example
 * ```tsx
 * // In home/_layout.tsx
 * import { Stack } from 'expo-router';
 * import { getTabScreenOptions } from '@/lib/utils/tab-screen-options';
 * 
 * export default function HomeLayout() {
 *   return (
 *     <Stack screenOptions={{ headerShown: true }}>
 *       <Stack.Screen
 *         name="index"
 *         options={getTabScreenOptions('Home')}
 *       />
 *     </Stack>
 *   );
 * }
 * ```
 */
export function getTabScreenOptions(
  title: string
): NativeStackNavigationOptions {
  return {
    title,
    headerLargeTitle: true,
    headerTransparent: isIOS(),
    headerBlurEffect: isIOS26OrLater() ? undefined : "regular",
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerLargeStyle: {
      backgroundColor: "transparent",
    },
    headerStyle: {
      backgroundColor: isIOS() ? "transparent" : undefined,
    },
    headerLargeTitleStyle: {
      fontWeight: "600",
    },
    headerTitleStyle: {
      fontWeight: "600",
    },
  };
}

/**
 * Get screen options with custom header right component.
 * 
 * Use this when you need to add custom elements to the header
 * (e.g., settings icon, streak indicator, action buttons).
 * 
 * @param title - The screen title displayed in the header
 * @param headerRight - React component to render in the header right area
 * @returns Native stack navigation options with custom header right
 * 
 * @example
 * ```tsx
 * import { getTabScreenOptionsWithHeaderRight } from '@/lib/utils/tab-screen-options';
 * import { SettingsButton } from '@/components/settings-button';
 * 
 * <Stack.Screen
 *   name="index"
 *   options={getTabScreenOptionsWithHeaderRight('Home', () => <SettingsButton />)}
 * />
 * ```
 */
export function getTabScreenOptionsWithHeaderRight(
  title: string,
  headerRight: () => React.ReactNode
): NativeStackNavigationOptions {
  return {
    ...getTabScreenOptions(title),
    headerRight,
  };
}

/**
 * Get screen options with custom header left component.
 * 
 * @param title - The screen title displayed in the header
 * @param headerLeft - React component to render in the header left area
 * @returns Native stack navigation options with custom header left
 * 
 * @example
 * ```tsx
 * import { getTabScreenOptionsWithHeaderLeft } from '@/lib/utils/tab-screen-options';
 * 
 * <Stack.Screen
 *   name="index"
 *   options={getTabScreenOptionsWithHeaderLeft('Alerts', () => <FilterButton />)}
 * />
 * ```
 */
export function getTabScreenOptionsWithHeaderLeft(
  title: string,
  headerLeft: () => React.ReactNode
): NativeStackNavigationOptions {
  return {
    ...getTabScreenOptions(title),
    headerLeft,
  };
}

/**
 * Get screen options with both custom header left and right components.
 * 
 * @param title - The screen title displayed in the header
 * @param options - Object containing headerLeft and headerRight components
 * @returns Native stack navigation options with custom header components
 * 
 * @example
 * ```tsx
 * import { getTabScreenOptionsWithCustomHeader } from '@/lib/utils/tab-screen-options';
 * 
 * <Stack.Screen
 *   name="index"
 *   options={getTabScreenOptionsWithCustomHeader('Home', {
 *     headerLeft: () => <StreakIndicator />,
 *     headerRight: () => <SettingsButton />,
 *   })}
 * />
 * ```
 */
export function getTabScreenOptionsWithCustomHeader(
  title: string,
  options: {
    headerLeft?: () => React.ReactNode;
    headerRight?: () => React.ReactNode;
  }
): NativeStackNavigationOptions {
  return {
    ...getTabScreenOptions(title),
    ...options,
  };
}
