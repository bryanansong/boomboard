import { FlashList, FlashListProps } from "@shopify/flash-list";
import { useHeaderHeight } from "@react-navigation/elements";
import React from "react";
import { ScrollView, ScrollViewProps, View, ViewProps } from "react-native";
import { twMerge } from "tailwind-merge";
import { withUniwind } from "uniwind";

/**
 * Extra padding added below the header for visual spacing.
 */
const HEADER_PADDING_OFFSET = 16;
const HEADER_PADDING_OFFSET_NO_LARGE_TITLE = 8;

// Wrap components with withUniwind to ensure they respond to theme changes
const ThemedScrollView = withUniwind(ScrollView);
const ThemedView = withUniwind(View);

interface LargeTitleScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  /**
   * Set to true if the screen doesn't have a large title.
   * This reduces the top padding to account for the smaller header.
   */
  noLargeTitle?: boolean;
}

/**
 * A ScrollView wrapper for screens utilizing Large Title navigation patterns.
 * Automatically handles the top padding required for transparent headers with large titles
 * and ensures content works correctly with `contentInsetAdjustmentBehavior`.
 *
 * Use this component for any scrollable screen content that sits behind a transparent header.
 *
 * @example
 * ```tsx
 * import { LargeTitleScrollView } from '@/components/ui/large-title-view';
 *
 * function SettingsScreen() {
 *   return (
 *     <LargeTitleScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
 *       <Text>Your content here</Text>
 *     </LargeTitleScrollView>
 *   );
 * }
 * ```
 */
export function LargeTitleScrollView({
  children,
  contentContainerStyle,
  style,
  noLargeTitle = false,
  contentContainerClassName,
  ...props
}: LargeTitleScrollViewProps & { contentContainerClassName?: string }) {
  return (
    <ThemedScrollView
      style={style}
      className="flex-1 bg-background"
      contentContainerClassName={twMerge("pb-10", contentContainerClassName)}
      contentContainerStyle={[contentContainerStyle]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ThemedScrollView>
  );
}

interface LargeTitleViewProps extends ViewProps {
  children: React.ReactNode;
  /**
   * Set to true if the screen doesn't have a large title.
   * This reduces the top padding to account for the smaller header.
   */
  noLargeTitle?: boolean;
}

/**
 * A View wrapper for screens utilizing Large Title navigation patterns.
 * Automatically handles the top padding required for transparent headers.
 *
 * Use this component as the root container for non-scrollable screens with complex headers.
 *
 * @example
 * ```tsx
 * import { LargeTitleView } from '@/components/ui/large-title-view';
 *
 * function ConfirmScreen() {
 *   return (
 *     <LargeTitleView style={{ paddingHorizontal: 20 }}>
 *       <Text>Your content here</Text>
 *     </LargeTitleView>
 *   );
 * }
 * ```
 */
export function LargeTitleView({
  children,
  style,
  noLargeTitle = false,
  ...props
}: LargeTitleViewProps) {
  const headerHeight = useHeaderHeight();
  const paddingOffset = noLargeTitle
    ? HEADER_PADDING_OFFSET_NO_LARGE_TITLE
    : HEADER_PADDING_OFFSET;

  return (
    <ThemedView
      className="flex-1 bg-background"
      style={[{ paddingTop: headerHeight + paddingOffset }, style]}
      {...props}
    >
      {children}
    </ThemedView>
  );
}

/**
 * Props for the LargeTitleFlashList component.
 * Extends FlashListProps with Large Title specific options.
 */
interface LargeTitleFlashListProps<T>
  extends Omit<FlashListProps<T>, "contentContainerStyle"> {
  /**
   * Set to true if the screen doesn't have a large title.
   * This reduces the top padding to account for the smaller header.
   */
  noLargeTitle?: boolean;
  /**
   * Additional styles for the content container.
   * The top padding for the header will be automatically applied.
   */
  contentContainerStyle?: FlashListProps<T>["contentContainerStyle"];
}

/**
 * A FlashList wrapper for screens utilizing Large Title navigation patterns.
 * Automatically handles the top padding required for transparent headers.
 *
 * Use this component when you need optimized list rendering for large data sets
 * on screens with Large Titles.
 *
 * @example
 * ```tsx
 * import { LargeTitleFlashList } from '@/components/ui/large-title-view';
 *
 * interface Item {
 *   id: string;
 *   title: string;
 * }
 *
 * function ItemListScreen() {
 *   const data: Item[] = [...];
 *
 *   return (
 *     <LargeTitleFlashList<Item>
 *       data={data}
 *       renderItem={({ item }) => <ItemRow item={item} />}
 *       estimatedItemSize={50}
 *       contentContainerStyle={{ paddingHorizontal: 20 }}
 *     />
 *   );
 * }
 * ```
 */
export function LargeTitleFlashList<T>({
  contentContainerStyle,
  noLargeTitle = false,
  ...props
}: LargeTitleFlashListProps<T>) {
  const headerHeight = useHeaderHeight();
  const paddingOffset = noLargeTitle
    ? HEADER_PADDING_OFFSET_NO_LARGE_TITLE
    : HEADER_PADDING_OFFSET;

  return (
    <FlashList<T>
      contentContainerStyle={Object.assign(
        {
          paddingTop: headerHeight + paddingOffset,
          paddingBottom: 40,
        },
        contentContainerStyle ?? {}
      )}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}
