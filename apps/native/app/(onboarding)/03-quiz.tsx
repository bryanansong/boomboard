import { LinearGradient } from "expo-linear-gradient";
import { RadioGroup, ScrollShadow } from "heroui-native";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, View, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
	DevModeQuizControls,
	QuizOption,
	QuizProgressBar,
} from "@/components/quiz";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";

interface QuizQuestion {
	id: number;
	question: string;
	type: "text" | "choice";
	options?: string[];
	placeholder?: string;
}

/** Derives a stable slug from question text for analytics identification. */
function toQuestionSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 60);
}

const quizQuestions: QuizQuestion[] = [
	{
		id: 1,
		question: "Which best describes you?",
		type: "choice",
		options: [
			"Content creator or streamer",
			"I host or go to parties and social events",
			"I love memes and viral audio",
			"I just want the perfect clip ready for any moment",
		],
	},
	{
		id: 2,
		question: "What kinds of sounds do you want in your library?",
		type: "choice",
		options: [
			"Viral clips and trending audio",
			"Custom reactions I record myself",
			"Crowd-pleasers and classics",
			"A mix of everything",
		],
	},
	{
		id: 3,
		question: "When do you most want one-tap sounds?",
		type: "choice",
		options: [
			"While creating or going live",
			"In person with friends",
			"In chats or messages",
			"Whenever the moment hits",
		],
	},
	{
		id: 4,
		question: "How did you hear about Boomboard?",
		type: "choice",
		options: ["TikTok", "Instagram", "YouTube", "Friend", "App Store search", "Other"],
	},
];

export default function QuizScreen() {
	const insets = useSafeAreaInsets();
	const { next } = useOnboarding();
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const { light: hapticLight } = useHaptic();

	/** Builds a consistent property bag for every quiz analytics event. */
	const buildQuestionProps = useCallback(
		(question: QuizQuestion, index: number) => ({
			question_id: question.id,
			question_index: index,
			question_step: index + 1,
			question_text: question.question,
			question_slug: toQuestionSlug(question.question),
			total_questions: quizQuestions.length,
		}),
		[],
	);

	const currentQuestion = quizQuestions[currentQuestionIndex];
	const selectedAnswer = answers[currentQuestion.id];

	const handleSelectOption = useCallback((option: string) => {
		hapticLight();
		setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));

		// Auto-advance for single-choice questions with a 200ms delay
		setTimeout(() => {
			if (currentQuestionIndex < quizQuestions.length - 1) {
				setCurrentQuestionIndex((prev) => prev + 1);
			} else {
				next();
			}
		}, 200);
	}, [hapticLight, currentQuestion, currentQuestionIndex, next]);

	const handleSkip = useCallback(() => {
		if (currentQuestionIndex < quizQuestions.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		} else {
			next();
		}
	}, [currentQuestionIndex, next]);

	const handlePrevious = useCallback(() => {
		setCurrentQuestionIndex((prev) =>
			prev === 0 ? quizQuestions.length - 1 : prev - 1,
		);
	}, []);

	return (
		<KeyboardAvoidingView
			className="flex-1"
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<View className="flex-1 bg-background">
				{/* Fixed Header Section */}
				<View className="px-6 pt-5" style={{ paddingTop: insets.top + 20 }}>
					{/* Progress Bar */}
					<QuizProgressBar
						currentStep={currentQuestionIndex + 1}
						totalSteps={quizQuestions.length}
					/>
				</View>

				<Animated.View
					key={currentQuestion.id}
					entering={FadeIn.duration(400).delay(100)}
					exiting={FadeOut.duration(200)}
					className="flex-1"
				>
					{/* Question Header */}
					<View className="mt-6 mb-2 px-6 items-center gap-2">
						<Text className="font-bold text-foreground text-3xl">
							{`Question #${currentQuestion.id}`}
						</Text>
						<Text className="text-center text-xl text-foreground">
							{currentQuestion.question}
						</Text>
					</View>

					{/* Scrollable Options / Input Section */}
					<ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
						<ScrollView className="px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
							<View className="py-4">
								<RadioGroup
									value={selectedAnswer || ""}
									onValueChange={(val: string) => handleSelectOption(val)}
									className="gap-3"
								>
									{currentQuestion.options?.map((option) => (
										<QuizOption key={option} label={option} value={option} />
									))}
								</RadioGroup>
							</View>
						</ScrollView>
					</ScrollShadow>
				</Animated.View>

				{/* Fixed Footer Section with Buttons */}
				<View
					className="gap-3 px-6 pb-6"
					style={{ paddingBottom: insets.bottom + 20 }}
				>
					{/* Dev Mode Controls - easy to remove entire block */}
					<DevModeQuizControls
						onSkip={handleSkip}
						onPrevious={handlePrevious}
						currentIndex={currentQuestionIndex}
						totalQuestions={quizQuestions.length}
					/>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

