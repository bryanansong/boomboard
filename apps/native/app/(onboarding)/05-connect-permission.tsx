import { SafeAreaView } from "@/components/safe-area-view";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";
import { Image } from "expo-image";
import { PressableFeedback } from "heroui-native";
import React, { useCallback } from "react";
import { Alert, Text, View } from "react-native";
import PERMISSION_IMAGE from "@/assets/content/3x-screentime-permission.png";

/**
 * Displays a native alert simulating a permission request.
 *
 * @param onGranted - Callback invoked when the user taps "Continue"
 * @param onDenied - Callback invoked when the user taps "Don't Allow"
 */
function showPermissionAlert(onGranted: () => void, onDenied: () => void): void {
	Alert.alert(
		"\"Opal\" Would Like to Access Screen Time",
		"Providing \"Opal\" access to Screen Time may allow it to see your activity data, restrict content, and limit the usage of apps and websites",
		[
			{ text: "Continue", onPress: onGranted },
			{ text: "Don't Allow", style: "cancel", onPress: onDenied },
		],
	);
}

export default function ConnectPermissionScreen() {
	const { next } = useOnboarding();
	const { medium: hapticMedium } = useHaptic();

	const handleImagePress = useCallback(() => {
		hapticMedium();
		showPermissionAlert(
			() => {
				next();
			},
			() => {
			}
		);
	}, [next, hapticMedium]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="items-center px-6 mt-12">
				<Text className="text-center font-bold text-3xl text-foreground leading-9">
					Connect to Your Data,{"\n"}Securely.
				</Text>

				<Text className="text-center text-lg text-muted mt-4 px-2">
					To personalize your experience, this app will need your
					permission.
				</Text>
			</View>

			{/* Permission image — tappable */}
			<View className="flex-1 items-center justify-center px-8">
				<PressableFeedback onPress={handleImagePress}>
					<Image
						source={PERMISSION_IMAGE}
						contentFit="contain"
						style={{ width: 370, height: 340 }}
						accessibilityLabel="Example permission dialog"
					/>
				</PressableFeedback>
			</View>

			{/* Privacy footer */}
			<View className="items-center px-8 pb-10">
				<Text className="text-center text-lg text-muted leading-5">
					Your sensitive data is protected by Apple and never leaves
					your device.
				</Text>

				<Text className="text-center font-bold text-lg text-foreground mt-4">
					Learn More
				</Text>
			</View>
		</SafeAreaView>
	);
}
