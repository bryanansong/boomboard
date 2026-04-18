import { LinearGradient } from "expo-linear-gradient";
import { RadioGroup, ScrollShadow } from "heroui-native";
import React, { useCallback, useState, useEffect, useRef } from "react";
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
import { usePostHog } from 'posthog-react-native';

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
		question: "What is your gender?",
		type: "choice",
		options: ["Female", "Male", "Other"],
	},
	{
		id: 2,
		question: "How often do you typically view pornography?",
		type: "choice",
		options: [
			"Less than once a week",
			"More than once a day",
			"Once a day",
			"A few times a week",
		],
	},
	{
		id: 3,
		question: "Where did you hear about us?",
		type: "choice",
		options: ["TikTok", "Google", "Instagram", "YouTube", "Reddit", "X", "Facebook", "Other"],
	},
	{
		id: 4,
		question:
			"Have you noticed a shift towards more extreme or graphic material?",
		type: "choice",
		options: ["No", "Yes"],
	},
	{
		id: 5,
		question: "At what age did you first come across explicit content?",
		type: "choice",
		options: ["13 to 16", "25 or older", "17 to 24", "12 or younger"],
	},
	{
		id: 6,
		question:
			"Do you find it difficult to achieve sexual arousal without pornography or fantasy?",
		type: "choice",
		options: ["Occasionally", "Frequently", "Rarely or never"],
	},
	{
		id: 7,
		question:
			"Do you use pornography as a way to cope with emotional discomfort or pain?",
		type: "choice",
		options: ["Rarely or never", "Occasionally", "Frequently"],
	},
	{
		id: 8,
		question: "Do you turn to pornography when feeling stressed?",
		type: "choice",
		options: ["Occasionally", "Rarely or never", "Frequently"],
	},
	{
		id: 9,
		question: "Do you watch pornography out of boredom?",
		type: "choice",
		options: ["Frequently", "Occasionally", "Rarely or never"],
	},
	{
		id: 10,
		question: "Have you ever spent money on accessing explicit content?",
		type: "choice",
		options: ["Yes", "No"],
	},
];

export default function QuizScreen() {
	const insets = useSafeAreaInsets();
	const { next } = useOnboarding();
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const posthog = usePostHog();
	const hasTrackedStart = useRef(false);
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

	/**
	 * Fires `quiz_started` once on mount and `quiz_question_viewed` on every
	 * question transition (including the first). This gives PostHog a clean
	 * per-step funnel: Q1 viewed → Q2 viewed → … → quiz completed.
	 */
	useEffect(() => {
		const question = quizQuestions[currentQuestionIndex];
		const props = buildQuestionProps(question, currentQuestionIndex);

		if (!hasTrackedStart.current) {
			posthog.capture('onboarding:quiz_started', props);
			hasTrackedStart.current = true;
		}

		posthog.capture('onboarding:quiz_question_viewed', props);
	}, [currentQuestionIndex, posthog, buildQuestionProps]);

	const currentQuestion = quizQuestions[currentQuestionIndex];
	const selectedAnswer = answers[currentQuestion.id];

	const handleSelectOption = useCallback((option: string) => {
		hapticLight();
		setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));

		// Auto-advance for single-choice questions with a 200ms delay
		setTimeout(() => {
			posthog.capture('onboarding:quiz_answer_submitted', {
				...buildQuestionProps(currentQuestion, currentQuestionIndex),
				answer: option,
			});

			if (currentQuestionIndex < quizQuestions.length - 1) {
				setCurrentQuestionIndex((prev) => prev + 1);
			} else {
				next();
			}
		}, 200);
	}, [hapticLight, currentQuestion, currentQuestionIndex, posthog, buildQuestionProps, next]);

	const handleSkip = useCallback(() => {
		posthog.capture('onboarding:quiz_question_skipped', {
			...buildQuestionProps(currentQuestion, currentQuestionIndex),
		});

		if (currentQuestionIndex < quizQuestions.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		} else {
			next();
		}
	}, [currentQuestionIndex, next, posthog, currentQuestion, buildQuestionProps]);

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

