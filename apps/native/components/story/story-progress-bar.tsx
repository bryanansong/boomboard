/**
 * StoryProgressBar - Instagram-style segmented progress indicator.
 *
 * Renders a row of bars representing each slide.
 * Completed slides are fully filled, the active slide is partially
 * filled (animated), and future slides are empty.
 *
 * @param currentIndex - 0-based index of the active slide
 * @param totalSlides - Total number of slides
 */

import React from "react";
import { View } from "react-native";

interface StoryProgressBarProps {
	/** 0-based index of the currently active slide */
	currentIndex: number;
	/** Total number of slides in the story */
	totalSlides: number;
}

export const StoryProgressBar = React.memo(
	({ currentIndex, totalSlides }: StoryProgressBarProps) => {
		return (
			<View className="flex-row gap-1.5">
				{Array.from({ length: totalSlides }).map((_, i) => {
					const isCompleted = i < currentIndex;
					const isActive = i === currentIndex;

					return (
						<View
							key={i}
							className="h-[4px] flex-1 overflow-hidden rounded-full bg-muted/50"
						>
							{(isCompleted || isActive) && (
								<View className="h-full w-full rounded-full bg-foreground" />
							)}
						</View>
					);
				})}
			</View>
		);
	},
);

StoryProgressBar.displayName = "StoryProgressBar";
