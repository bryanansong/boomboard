/**
 * Onboarding Layout
 *
 * Wraps all onboarding screens with the OnboardingProvider context.
 */

import React from "react";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Select, Separator } from "heroui-native";

type SelectOption = {
	value: string;
	label: string;
};

const ONBOARDING_SCREENS: SelectOption[] = [
	{ value: "01-welcome", label: "01 Welcome" },
	{ value: "02-membership-card", label: "02 Membership Card" },
	{ value: "03-quiz", label: "03 Quiz" },
	{ value: "04-quiz-complete", label: "04 Quiz Complete" },
	{ value: "06-sign-in", label: "06 Sign In" },
];

function DevScreenSelector() {
	if (!__DEV__) return null;

	const router = useRouter();

	const handleValueChange = (option: SelectOption | SelectOption[] | undefined) => {
		if (!option || Array.isArray(option)) return;
		if (option.value) {
			router.push(`/(onboarding)/${option.value}` as any);
		}
	};

	return (
		<View className="absolute top-12 right-4 z-50 opacity-80 pointer-events-auto">
			<Select onValueChange={handleValueChange} presentation="bottom-sheet">
				<Select.Trigger>
					<Select.Value className="mr-2" placeholder="Dev: Jump to Screen" />
					<Select.TriggerIndicator />
				</Select.Trigger>
				<Select.Portal>
					<Select.Overlay />
					<Select.Content presentation="bottom-sheet" snapPoints={['50%']}>
						<Select.ListLabel className="mb-2 px-4">Jump to Screen (Dev Only)</Select.ListLabel>
						{ONBOARDING_SCREENS.map((screen, index) => (
							<React.Fragment key={screen.value}>
								<Select.Item value={screen.value} label={screen.label} />
								{index < ONBOARDING_SCREENS.length - 1 && <Separator />}
							</React.Fragment>
						))}
					</Select.Content>
				</Select.Portal>
			</Select>
		</View>
	);
}

export default function OnboardingLayout() {
	return (
		<View className="flex-1">
			<Stack
				screenOptions={{ headerShown: false, animation: "slide_from_right", gestureEnabled: false }}
			>
				<Stack.Screen name="index" options={{ animation: "none" }} />
				<Stack.Screen name="01-welcome" options={{ animation: "none" }} />
				<Stack.Screen name="02-membership-card" />
				<Stack.Screen name="03-quiz" />
				<Stack.Screen name="04-quiz-complete" />
				<Stack.Screen name="06-sign-in" />
			</Stack>
			<DevScreenSelector />
		</View>
	);
}
