import React from "react";
import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";

interface QuizProgressBarProps {
	currentStep: number;
	totalSteps: number;
}

export function QuizProgressBar({
	currentStep,
	totalSteps,
}: QuizProgressBarProps) {
	const animatedStyle = useAnimatedStyle(
		() => ({
			width: withSpring(`${(currentStep / totalSteps) * 100}%`, {
				damping: 20,
				stiffness: 100,
			}),
		}),
		[currentStep, totalSteps],
	);

	return (
		<View className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
			<Animated.View
				className="h-full rounded-full bg-blue-500"
				style={animatedStyle}
			/>
		</View>
	);
}

export default QuizProgressBar;
