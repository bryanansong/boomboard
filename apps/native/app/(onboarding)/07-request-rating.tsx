import { SafeAreaView } from "@/components/safe-area-view";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic, useMountDelay } from "@/lib/hooks";
import { Avatar, Button, ScrollShadow } from "heroui-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as StoreReview from "expo-store-review";
import React, { useCallback, useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { Star } from "lucide-react-native";
import wreathImage from "@/assets/content/rating-wreath.png";

import avatarAsianMan from "@/assets/avatars/avatar-asian-man.jpg";
import avatarBlackWoman from "@/assets/avatars/avatar-black-woman.jpg";
import avatarWhiteWoman from "@/assets/avatars/avatar-white-woman-1.jpg";
import avatarAsianWoman1 from "@/assets/avatars/avatar-asian-woman-1.jpg";
import avatarAsianWoman2 from "@/assets/avatars/avatar-asian-woman-2.jpg";
import avatarAsianWoman3 from "@/assets/avatars/avatar-asian-woman-3.jpg";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Testimonial {
	name: string;
	quote: string;
	avatar: number;
}

const TESTIMONIALS: Testimonial[] = [
	{
		name: "Kevin Nguyen",
		avatar: avatarAsianMan,
		quote:
			"This app has been a lifesaver for me. The progress tracking and motivational notifications have kept me on track. I haven't looked back in 3 months and feel more in control of my life.",
	},
	{
		name: "Aisha Coleman",
		avatar: avatarBlackWoman,
		quote:
			"I was skeptical at first, but the panic button feature alone is worth it. Every time I felt an urge, the guided exercises brought me back to focus.",
	},
	{
		name: "Sarah Mitchell",
		avatar: avatarWhiteWoman,
		quote:
			"The community support and daily check-ins have made such a difference. I finally feel like I have the tools to succeed.",
	},
];

const AVATAR_IMAGES = [
	avatarAsianWoman1,
	avatarAsianWoman2,
	avatarAsianWoman3,
	avatarAsianMan,
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Renders a row of 5 gold star icons */
const StarRow = React.memo(({ size = 20 }: { size?: number }) => (
	<View className="flex-row">
		{Array.from({ length: 5 }).map((_, i) => (
			<Star
				key={i}
				size={size}
				color="#DB9966"
				fill="#DB9966"
				strokeWidth={0}
			/>
		))}
	</View>
));
StarRow.displayName = "StarRow";

/** Rating badge with wreath decoration, rating score, stars, and app rating count */
const RatingBadge = React.memo(() => (
	<View className="items-center my-4">
		<View className="flex-row items-center">
			{/* Left wreath — horizontally flipped */}
			<Image
				source={wreathImage}
				contentFit="contain"
				style={{ width: 64, height: 90, transform: [{ scaleX: -1 }] }}
			/>

			{/* Center content */}
			<View className="items-center mx-1">
				<View className="flex-row items-center gap-1">
					<Text className="text-foreground text-3xl">4.8</Text>
					<StarRow size={25} />
				</View>
				<Text className="text-muted text-lg font-semibold mt-1">
					10K+ App Ratings
				</Text>
			</View>

			{/* Right wreath — original orientation */}
			<Image
				source={wreathImage}
				contentFit="contain"
				style={{ width: 64, height: 90 }}
			/>
		</View>
	</View>
));
RatingBadge.displayName = "RatingBadge";


/** Row of overlapping avatar circles + user count */
const AvatarStrip = React.memo(() => (
	<View className="flex-row items-center justify-center mt-4">
		<View className="flex-row pl-2">
			{AVATAR_IMAGES.map((src, i) => (
				<Avatar
					key={i}
					size="md"
					className={`border border-background ml-[-12px] z-[${AVATAR_IMAGES.length - i}]`}
					alt={`User avatar ${i + 1}`}
				>
					<Avatar.Image source={src} />
				</Avatar>
			))}
		</View>
		<Text className="text-muted ml-2 text-base">+ 70,000 people</Text>
	</View>
));
AvatarStrip.displayName = "AvatarStrip";

/** A single testimonial card */
const TestimonialCard = React.memo(({ item }: { item: Testimonial }) => (
	<View className="bg-muted/20 rounded-3xl px-5 py-3 border border-muted/30">
		{/* Header row: avatar + name + stars */}
		<View className="flex-row items-center justify-between mb-2">
			<View className="flex-row items-center gap-3">
				<Avatar size="sm" alt={`Avatar of ${item.name}`}>
					<Avatar.Image source={item.avatar} />
				</Avatar>
				<Text className="text-foreground font-medium text-lg">
					{item.name}
				</Text>
			</View>
			<StarRow size={20} />
		</View>

		{/* Quote */}
		<Text className="text-muted text-base leading-6">
			&quot;{item.quote}&quot;
		</Text>
	</View>
));
TestimonialCard.displayName = "TestimonialCard";

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SocialProofScreen() {
	const { next } = useOnboarding();
	const { medium: hapticMedium } = useHaptic();
	const isButtonReady = useMountDelay(1000);

	const handleNext = useCallback(() => {
		hapticMedium();
		next();
	}, [hapticMedium, next]);

	/** Request store review on mount */
	useEffect(() => {
		const requestReview = async () => {
			try {
				if (await StoreReview.hasAction()) {
					await StoreReview.requestReview();
				}
			} catch (error) {
				console.error("Store review error:", error);
			}
		};
		requestReview();
	}, []);


	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollShadow
				LinearGradientComponent={LinearGradient}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-4 pb-6"
					showsVerticalScrollIndicator={false}
				>
					{/* Title */}
					<Text className="text-center font-semibold text-4xl text-foreground mt-2">
						Give us a rating
					</Text>

					{/* Hero stars */}
					<RatingBadge />

					{/* Subtitle */}
					<Text className="text-center font-semibold text-2xl text-foreground">
						This app was made for people{"\n"}like you
					</Text>

					{/* Avatar strip */}
					<AvatarStrip />

					{/* Testimonials */}
					<View className="gap-4 mt-8">
						{TESTIMONIALS.map((t) => (
							<TestimonialCard key={t.name} item={t} />
						))}
					</View>
				</ScrollView>
			</ScrollShadow>

			{/* Next button */}
			<View className="px-6 pb-6">
				<Button onPress={handleNext} disabled={!isButtonReady} size="lg">
					<Button.Label>Next</Button.Label>
				</Button>
			</View>
		</SafeAreaView>
	);
}
