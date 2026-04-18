import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { useOnboarding } from "@/lib/onboarding";
import { usePostHog } from 'posthog-react-native';
import { useHaptic } from "@/lib/hooks";

const loadingStates = [
	{ text: "Analyzing your profile..." },
	{ text: "Building your personalized toolkit..." },
	{ text: "Securing your data..." },
	{ text: "Finalizing your plan..." },
];

export default function ProcessingScreen() {
	const { next } = useOnboarding();
	const [loading, setLoading] = useState(true);
	const posthog = usePostHog();
	const { light: hapticLight, success: hapticSuccess } = useHaptic();

	// Stable ref so the timer never restarts when `next` reference changes
	const nextRef = useRef(next);
	nextRef.current = next;

	useEffect(() => {
		posthog.capture('onboarding:processing_started');

		// 5 states * 1800ms = 9000ms
		const stepDuration = 1800;
		const totalTime = stepDuration * loadingStates.length;

		// Navigate after loader completes — fires exactly once
		const timer = setTimeout(() => {
			setLoading(false);
			hapticSuccess();
			nextRef.current();
		}, totalTime + 500);

		return () => clearTimeout(timer);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<View className="flex-1 bg-background">
			<MultiStepLoader
				loadingStates={loadingStates}
				loading={loading}
				duration={1800}
				loop={false}
				onStepChange={() => hapticLight()}
			/>
		</View>
	);
}
