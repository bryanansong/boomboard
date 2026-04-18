import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "heroui-native";
import React, { useCallback, useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fingerHeartImage = require("@/assets/content/finger-heart.png");

/** Gradient circle ring dimensions */
const CIRCLE_SIZE = 260;
const INNER_CIRCLE_SIZE = 230;

export default function QuizCompleteScreen() {
	const insets = useSafeAreaInsets();
	const { next, data } = useOnboarding();
	const { medium: hapticMedium } = useHaptic();

	const handleContinue = useCallback(() => {
		hapticMedium();
		next();
	}, [hapticMedium, next]);

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>

			{/* Main Content */}
			<View className="flex-1 items-center justify-center px-8">
				{/* Gradient Circle with Illustration */}
				<View
					className="items-center justify-center"
					style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
				>
					<LinearGradient
						colors={["#f0c6d4", "#c6d4f0"]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={{
							width: CIRCLE_SIZE,
							height: CIRCLE_SIZE,
							borderRadius: CIRCLE_SIZE / 2,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<View
							className="items-center justify-center bg-background"
							style={{
								width: INNER_CIRCLE_SIZE,
								height: INNER_CIRCLE_SIZE,
								borderRadius: INNER_CIRCLE_SIZE / 2,
							}}
						>
							<Image
								source={fingerHeartImage}
								style={{ width: 160, height: 160 }}
								contentFit="contain"
							/>
						</View>
					</LinearGradient>
				</View>

				{/* Header Titles */}
				<View className="mt-8 items-center justify-center">
					<Text className="text-center font-bold text-4xl tracking-tight text-foreground">
						Thank you for{"\n"}trusting us
					</Text>
					<Text className="mt-4 text-center text-lg text-muted font-medium">
						Now let's personalize the app for you...
					</Text>
				</View>

				<View className="mt-10 w-full pt-6 pb-2">
					<View className="w-full rounded-3xl bg-zinc-100 dark:bg-zinc-900 px-3 py-6">
						<Text className="text-center font-semibold text-foreground text-[17px]">
							Your privacy and security matter to us.
						</Text>
						<Text className="mt-2 text-center text-[15px] leading-[22px] text-foreground">
							We promise to always keep your{"\n"}personal information private and{"\n"}secure.
						</Text>
					</View>

					{/* Floating Badge above the card */}
					<View className="absolute top-0 w-full items-center">
						<View 
							className="items-center justify-center rounded-full bg-background" 
							style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}
						>
							<Text className="text-4xl leading-tight">🔒</Text>
						</View>
					</View>
				</View>
			</View>

			{/* Continue Button */}
			<View
				className="px-6 pb-6"
				style={{ paddingBottom: insets.bottom + 20 }}
			>
				<Button
					onPress={handleContinue}
					size="lg"
				>
					<Button.Label>Continue</Button.Label>
				</Button>
			</View>
		</View>
	);
}
