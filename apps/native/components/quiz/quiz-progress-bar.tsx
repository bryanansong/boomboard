import React from "react";
import { View } from "react-native";

interface QuizProgressBarProps {
	currentStep: number;
	totalSteps: number;
}

export function QuizProgressBar({
	currentStep,
	totalSteps,
}: QuizProgressBarProps) {
	const widthPercent = `${(currentStep / totalSteps) * 100}%`;

	return (
		<View className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
			<View
				className="h-full rounded-full bg-blue-500"
				style={{ width: widthPercent as `${number}%` }}
			/>
		</View>
	);
}

export default QuizProgressBar;
