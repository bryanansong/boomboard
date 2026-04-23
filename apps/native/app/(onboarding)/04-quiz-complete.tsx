
import { Button } from "heroui-native";
import React, { useCallback, useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";


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


				{/* Header Titles */}
				<View className="mt-8 items-center justify-center">
					<Text className="text-center font-bold text-4xl tracking-tight text-foreground">
						{"You're all set"}
					</Text>
					<Text className="mt-4 text-center text-lg text-muted font-medium">
						{"Next, we'll wrap up setup so your sounds are ready when you are."}
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
