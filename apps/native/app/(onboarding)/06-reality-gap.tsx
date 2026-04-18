import { Button, RadioGroup } from "heroui-native";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { QuizOption } from "@/components/quiz";
import { SafeAreaView } from "@/components/safe-area-view";
import { StoryProgressBar } from "@/components/story";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";

interface TextSlide {
	type: "text";
	body: string;
}

interface StatSlide {
	type: "stat";
	/** Small text above the stat */
	preText: string;
	/** Large highlighted number/text */
	stat: string;
	/** Text below the stat */
	postText: string;
	/** Footnote at the very bottom */
	footnote?: string;
}

interface QuestionSlide {
	type: "question";
	/** The question title */
	title: string;
	/** Answer options */
	options: { label: string; value: string }[];
}

type Slide = TextSlide | StatSlide | QuestionSlide;

/** Derives a stable slug from slide content for analytics identification. */
function toSlideSlug(slide: Slide): string {
	const raw =
		slide.type === "text"
			? slide.body
			: slide.type === "stat"
				? slide.stat
				: slide.title;
	return raw
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 60);
}

// ---------------------------------------------------------------------------
// Slide Data — customise this array to match your product's narrative
// ---------------------------------------------------------------------------

const SLIDES: Slide[] = [
	{
		type: "text",
		body: "Some not-so-good news,\nand some great news.",
	},
	{
		type: "stat",
		preText:
			"The bad news is that you'll spend 159 days on your phone this year.\nMeaning that you're on track to spend",
		stat: "31 years",
		postText:
			"of your life looking down at your phone. Yep, you read this right.",
		footnote:
			"Projection of your current Screen Time habits, based on an average 16 waking hours each day.",
	},
	{
		type: "stat",
		preText: "The good news is that our app can help you get back",
		stat: "9 years+",
		postText:
			"of your life free from distractions, and help you achieve your dreams.",
		footnote: "According to your profile combined with our program.",
	},
	{
		type: "question",
		title: "What level of commitment feels right?",
		options: [
			{
				label: "I need firm controls that block distractions for me",
				value: "firm",
			},
			{
				label: "I want to understand my habits first",
				value: "understand",
			},
			{
				label: "I'm just curious and exploring",
				value: "curious",
			},
		],
	},
	{
		type: "text",
		body: "Let's take the first step:\nWe'll connect to your data to give you a personalized focus report.",
	},
];

// ---------------------------------------------------------------------------
// Slide Renderers
// ---------------------------------------------------------------------------

const TextSlideView = React.memo(({ slide }: { slide: TextSlide }) => (
	<View className="flex-1 items-center justify-center px-8">
		<Text className="text-center font-medium text-3xl text-foreground leading-8">
			{slide.body}
		</Text>
	</View>
));
TextSlideView.displayName = "TextSlideView";

const StatSlideView = React.memo(({ slide }: { slide: StatSlide }) => (
	<View className="flex-1 justify-between px-4 pt-16 pb-4">
		{/* Top section */}
		<View className="flex-1 justify-center">
			<Text className="mb-2 text-center text-foreground text-2xl leading-6">
				{slide.preText}
			</Text>
			<Text className="my-4 text-center text-8xl text-foreground">
				{slide.stat}
			</Text>
			<Text className="mt-2 text-center text-foreground text-2xl leading-6">
				{slide.postText}
			</Text>
		</View>

		{/* Footnote */}
		{slide.footnote && (
			<Text className="text-center text-muted text-md leading-5">
				{slide.footnote}
			</Text>
		)}
	</View>
));
StatSlideView.displayName = "StatSlideView";

interface QuestionSlideViewProps {
	slide: QuestionSlide;
	selectedValue: string;
	onSelect: (value: string) => void;
}

const QuestionSlideView = React.memo(
	({ slide, selectedValue, onSelect }: QuestionSlideViewProps) => (
		<View className="flex-1 px-6 pt-12">
			<Text className="mb-8 text-center font-bold text-foreground text-xl">
				{slide.title}
			</Text>

			<RadioGroup
				value={selectedValue}
				onValueChange={onSelect}
				className="gap-3"
			>
				{slide.options.map((option) => (
					<QuizOption
						key={option.value}
						label={option.label}
						value={option.value}
					/>
				))}
			</RadioGroup>
		</View>
	),
);
QuestionSlideView.displayName = "QuestionSlideView";

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function RealityGapScreen() {
	const { next } = useOnboarding();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [questionAnswer, setQuestionAnswer] = useState("");
	const { light: hapticLight, medium: hapticMedium } = useHaptic();

	const currentSlide = SLIDES[currentIndex];
	const isLastSlide = currentIndex === SLIDES.length - 1;

	/** Builds a consistent property bag for every reality-gap analytics event. */
	const buildSlideProps = useCallback(
		(slide: Slide, index: number) => ({
			slide_index: index,
			slide_step: index + 1,
			slide_slug: toSlideSlug(slide),
			total_slides: SLIDES.length,
		}),
		[],
	);

	/** Whether the Continue button should be disabled */
	const isContinueDisabled =
		currentSlide.type === "question" && questionAnswer === "";

	const handleContinue = useCallback(() => {
		hapticMedium();
		if (isLastSlide) {
			next();
		} else {
			setCurrentIndex((prev) => prev + 1);
		}
	}, [hapticMedium, isLastSlide, next]);

	const handleSelectAnswer = useCallback((value: string) => {
		hapticLight();
		setQuestionAnswer(value);
	}, [hapticLight]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Progress bars */}
			<View className="px-4 pt-3">
				<StoryProgressBar
					currentIndex={currentIndex}
					totalSlides={SLIDES.length}
				/>
			</View>

			{/* Slide content */}
			{currentSlide.type === "text" && <TextSlideView slide={currentSlide} />}
			{currentSlide.type === "stat" && <StatSlideView slide={currentSlide} />}
			{currentSlide.type === "question" && (
				<QuestionSlideView
					slide={currentSlide}
					selectedValue={questionAnswer}
					onSelect={handleSelectAnswer}
				/>
			)}

			{/* Continue button */}
			<View className="px-6 pb-6">
				<Button
					onPress={handleContinue}
					isDisabled={isContinueDisabled}
					variant={isContinueDisabled ? "secondary" : "primary"}
					size="lg"
				>
					<Button.Label>Continue</Button.Label>
				</Button>
			</View>
		</SafeAreaView>
	);
}
