import { Button } from "heroui-native";
import React from "react";
import { View } from "react-native";

interface DevModeQuizControlsProps {
	onSkip: () => void;
	onPrevious: () => void;
	currentIndex: number;
	totalQuestions: number;
}

export function DevModeQuizControls({
	onSkip,
	onPrevious,
	currentIndex,
	totalQuestions,
}: DevModeQuizControlsProps) {
	// Only render in development mode
	if (!__DEV__) {
		return null;
	}

	return (
		<View className="flex-row gap-2">
			<Button variant="ghost" onPress={onPrevious} className="flex-1">
				<Button.Label>
					← Prev ({currentIndex === 0 ? totalQuestions : currentIndex})
				</Button.Label>
			</Button>
			<Button variant="ghost" onPress={onSkip} className="flex-1">
				<Button.Label>Skip →</Button.Label>
			</Button>
		</View>
	);
}
