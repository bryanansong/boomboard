import { FlashList, type FlashListProps } from "@shopify/flash-list";
import { useHeaderHeight } from "@react-navigation/elements";
import { PressableFeedback } from "heroui-native";
import type React from "react";
import {
	type PressableProps,
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewProps,
} from "react-native";
import { twMerge } from "tailwind-merge";
import { withUniwind } from "uniwind";

// Wrap components with withUniwind to ensure they respond to theme changes
const ThemedScrollView = withUniwind(ScrollView);
const ThemedView = withUniwind(View);

interface TabScreenScrollViewProps extends ScrollViewProps {
	children: React.ReactNode;
	/**
	 * Optional visual layer pinned to the screen top.
	 * Useful for decorative backgrounds that should ignore safe-area insets.
	 */
	topOverlay?: React.ReactNode;
	/**
	 * Optional className for the content container.
	 * Common patterns: 'px-5', 'p-5 pb-10', etc.
	 */
	contentContainerClassName?: string;
}

/**
 * A ScrollView wrapper for tab screens utilizing native Large Title navigation.
 *
 * This component is designed to work with native stack navigation headers
 * configured using `getTabScreenOptions()`. It automatically handles:
 * - Content inset adjustment for transparent headers
 * - Proper scroll behavior for large title collapse
 * - Theme-aware background colors
 *
 * For this to work correctly, the parent Stack.Screen must have:
 * - `headerLargeTitle: true`
 * - `headerTransparent: true`
 * - `headerBlurEffect: 'regular'` (or undefined for iOS 26+)
 *
 * @example
 * ```tsx
 * import { TabScreenScrollView } from '@/components/ui/tab-screen-view';
 *
 * function HomeScreen() {
 *   return (
 *     <TabScreenScrollView contentContainerClassName="px-5 pb-10">
 *       <YourContent />
 *     </TabScreenScrollView>
 *   );
 * }
 * ```
 */
export function TabScreenScrollView({
	children,
	topOverlay,
	contentContainerStyle,
	style,
	contentContainerClassName,
	...props
}: TabScreenScrollViewProps) {
	const headerHeight = useHeaderHeight();

	return (
		<ThemedScrollView
			style={style}
			className="flex-1 bg-background"
			contentContainerClassName={twMerge("pb-10", contentContainerClassName)}
			contentContainerStyle={contentContainerStyle}
			contentInsetAdjustmentBehavior="automatic"
			showsVerticalScrollIndicator={false}
			{...props}
		>
			{topOverlay ? (
				<ThemedView
					className="absolute inset-x-0 z-0"
					pointerEvents="none"
					style={{ top: -headerHeight }}
				>
					{topOverlay}
				</ThemedView>
			) : null}
			{children}
		</ThemedScrollView>
	);
}

interface TabScreenViewProps extends ViewProps {
	children: React.ReactNode;
}

/**
 * A View wrapper for non-scrollable tab screens with Large Title headers.
 *
 * Use this for static content that doesn't need scrolling but still needs
 * proper padding for the transparent header.
 *
 * Note: For most tab screens, prefer TabScreenScrollView as it provides
 * better UX with the large title collapse behavior.
 *
 * @example
 * ```tsx
 * import { TabScreenView } from '@/components/ui/tab-screen-view';
 *
 * function StaticScreen() {
 *   return (
 *     <TabScreenView className="px-5">
 *       <YourStaticContent />
 *     </TabScreenView>
 *   );
 * }
 * ```
 */
export function TabScreenView({
	children,
	style,
	...props
}: TabScreenViewProps) {
	return (
		<ThemedView className="flex-1 bg-background" style={style} {...props}>
			{children}
		</ThemedView>
	);
}

/**
 * Props for the TabScreenFlashList component.
 * Extends FlashListProps with tab screen-specific options.
 */
interface TabScreenFlashListProps<T>
	extends Omit<FlashListProps<T>, "contentContainerStyle"> {
	/**
	 * Additional styles for the content container.
	 */
	contentContainerStyle?: FlashListProps<T>["contentContainerStyle"];
}

/**
 * A FlashList wrapper for tab screens utilizing native Large Title navigation.
 *
 * Provides optimized list rendering with proper header integration for tab screens.
 *
 * @example
 * ```tsx
 * import { TabScreenFlashList } from '@/components/ui/tab-screen-view';
 *
 * function SoundLibraryScreen() {
 *   return (
 *     <TabScreenFlashList
 *       data={sounds}
 *       renderItem={({ item }) => <SoundItem sound={item} />}
 *       estimatedItemSize={80}
 *       contentContainerStyle={{ paddingHorizontal: 20 }}
 *     />
 *   );
 * }
 * ```
 */
export function TabScreenFlashList<T>({
	contentContainerStyle,
	...props
}: TabScreenFlashListProps<T>) {
	return (
		<FlashList<T>
			contentContainerStyle={Object.assign(
				{ paddingBottom: 40 },
				contentContainerStyle ?? {},
			)}
			contentInsetAdjustmentBehavior="automatic"
			showsVerticalScrollIndicator={false}
			{...props}
		/>
	);
}

/**
 * A reusable header button for tab screens.
 *
 * Provides consistent styling, centering, and hit targets for icons
 * placed in the native header (headerLeft or headerRight).
 *
 * @example
 * ```tsx
 * <Stack.Screen
 *   options={{
 *     ...getTabScreenOptions('Home'),
 *     headerRight: () => (
 *       <TabScreenHeaderButton onPress={handlePress}>
 *         <Settings size={22} color={iconColor} />
 *       </TabScreenHeaderButton>
 *     ),
 *   }}
 * />
 * ```
 */
export function TabScreenHeaderButton({
	children,
	onPress,
	className,
	style,
	...props
}: {
	children: React.ReactNode;
	onPress?: () => void;
	className?: string;
	style?: PressableProps["style"];
}) {
	return (
		<PressableFeedback
			onPress={onPress}
			hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
			className={twMerge(
				"h-9 w-9 items-center justify-center",
				className,
			)}
			style={style}
			{...props}
		>
			{children}
		</PressableFeedback>
	);
}
