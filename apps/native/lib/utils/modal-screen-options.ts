import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { isIOS, isIOS26OrLater } from './platform';

/**
 * Default screen options for modal screens with native iOS large title header
 * and progressive blur effect on scroll.
 * 
 * These options provide:
 * - Large title that collapses on scroll (iOS pattern)
 * - Progressive blur effect on the header background
 * - Transparent header that works correctly on both platforms
 * - Automatic handling for iOS 26+ blur behavior
 * 
 * Use the LargeTitleScrollView or LargeTitleView components from '@/components/ui/large-title-view'
 * which automatically handle the header padding for transparent headers.
 * 
 * @example
 * ```tsx
 * import { LargeTitleScrollView } from '@/components/ui/large-title-view';
 * 
 * function MyModalScreen() {
 *   return (
 *     <LargeTitleScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
 *       <Text>Your content here</Text>
 *     </LargeTitleScrollView>
 *   );
 * }
 * ```
 */
export function getModalScreenOptions(title: string): NativeStackNavigationOptions {
  // Note: We can't use hooks here, so we'll rely on the ModalScrollView's bg-background class
  // The contentStyle backgroundColor will be handled by the component itself
  return {
    title,
    headerLargeTitle: true,
    headerTransparent: isIOS(),
    headerBlurEffect: isIOS26OrLater() ? undefined : 'regular',
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerLargeStyle: {
      backgroundColor: 'transparent',
    },
    headerStyle: {
      backgroundColor: isIOS() ? 'transparent' : undefined,
    },
    headerTintColor: undefined, // Will be handled by CSS variables via className
    headerLargeTitleStyle: {
      color: undefined, // Will be handled by CSS variables via className
      fontWeight: '400',
    },
    headerTitleStyle: {
      color: undefined, // Will be handled by CSS variables via className
      fontWeight: '600',
    },
    headerBackTitle: '', // Hide previous screen title
    headerBackButtonDisplayMode: 'minimal',
    // Remove contentStyle backgroundColor - let ModalScrollView handle it with className
  };
}

/**
 * Screen options for modal screens without large title but with blurred header.
 * 
 * Use this for screens that need the blurred header effect but don't want
 * the large title behavior (e.g., account details, forms).
 * 
 * @example
 * ```tsx
 * <Stack.Screen
 *   name="account-details"
 *   options={getModalScreenOptionsWithoutLargeTitle('Account details')}
 * />
 * ```
 */
export function getModalScreenOptionsWithoutLargeTitle(title: string): NativeStackNavigationOptions {
  return {
    title,
    headerLargeTitle: false,
    headerTransparent: isIOS(),
    headerBlurEffect: isIOS26OrLater() ? undefined : 'regular',
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerStyle: {
      backgroundColor: isIOS() ? 'transparent' : undefined,
    },
    headerTintColor: undefined, // Will be handled by CSS variables via className
    headerTitleStyle: {
      color: undefined, // Will be handled by CSS variables via className
      fontWeight: '600',
    },
    headerBackTitle: '', // Hide previous screen title
    headerBackButtonDisplayMode: 'minimal',
    // Remove contentStyle backgroundColor - let ModalScrollView handle it with className
  };
}

/**
 * Base screen options shared across all modal screens.
 * Individual screens can override these with getModalScreenOptions().
 */
export const baseModalScreenOptions: NativeStackNavigationOptions = {
  presentation: 'modal',
  headerLargeTitle: true,
  headerTransparent: isIOS(),
  headerBlurEffect: isIOS26OrLater() ? undefined : 'regular',
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerLargeStyle: {
    backgroundColor: 'transparent',
  },
  headerStyle: {
    backgroundColor: isIOS() ? 'transparent' : undefined,
  },
  headerTintColor: undefined, // Will be handled by CSS variables via className
  headerLargeTitleStyle: {
    color: undefined, // Will be handled by CSS variables via className
    fontWeight: '700',
  },
  headerTitleStyle: {
    color: undefined, // Will be handled by CSS variables via className
    fontWeight: '600',
  },
  headerBackTitle: '', // Hide previous screen title
  headerBackButtonDisplayMode: 'minimal',
  // Remove contentStyle backgroundColor - let ModalScrollView handle it with className
};
