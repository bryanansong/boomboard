import { Button } from "heroui-native";
import React, { useCallback, useMemo, useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { MembershipCard } from "@/components/membership-card";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";
import { ChevronRightIcon } from "lucide-react-native";
/**
 * Formats the current date as a human-readable string (e.g., "Feb 20, 2026").
 *
 * @returns Formatted date string
 */
function formatJoinDate(): string {
	return new Date().toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Membership Gift Screen
 *
 * Shown just before the store review screen. Presents the user with their
 * personalised membership card as a gift, using their name from the quiz.
 */
export default function MembershipGiftScreen() {
	const insets = useSafeAreaInsets();
	const { next } = useOnboarding();
	const { user } = useUser();

	const firstName = user?.firstName ?? "Member";
	const joinDate = useMemo(() => formatJoinDate(), []);
	const { medium: hapticMedium } = useHaptic();

	const handleContinue = useCallback(() => {
		hapticMedium();
		next();
	}, [hapticMedium, next]);

	return (
		<View className="flex-1 bg-background">
			<View
				className="flex-1 px-8 gap-4"
				style={{
					paddingTop: insets.top + 40,
					paddingBottom: insets.bottom + 20,
				}}
			>
				{/* Header Copy */}
				<View className="items-center">
					<Text className="mb-1 text-lg text-muted">
						A gift from us to you
					</Text>
					<Text className="font-bold text-3xl text-foreground text-center">
						This one's yours, {firstName}.
					</Text>
				</View>

				{/* Membership Card */}
				<View className="flex-1 items-center justify-center gap-5">
					<MembershipCard
						name={firstName}
						title="MEMBERSHIP CARD"
						joinDate={joinDate}
					/>
					<View className="items-center">
						<Text className="text-center text-lg text-muted max-w-[300px]">
							We made this to mark the start of your journey
						</Text>
					</View>
				</View>

				{/* CTA Button */}
				<Button onPress={handleContinue} className="flex-row items-center">
					<View className="w-5" />
					<View className="flex-1 items-center">
						<Button.Label>Continue</Button.Label>
					</View>
					<ChevronRightIcon color="white" size={20} />
				</Button>
			</View>
		</View>
	);
}
