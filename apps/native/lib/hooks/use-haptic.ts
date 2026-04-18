import { useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const IS_IOS = Platform.OS === "ios";

/**
 * Returns memoised haptic trigger functions covering every `expo-haptics` style.
 *
 * **Impact** (physical tap feel, increasing intensity):
 * - `light`   – subtle tap (option selection, toggles)
 * - `medium`  – standard press (primary button taps)
 * - `heavy`   – pronounced thud (destructive actions, major transitions)
 *
 * **Notification** (semantic feedback):
 * - `success` – positive confirmation (completing a step, saving)
 * - `warning` – caution signal (validation issues, approaching limits)
 * - `error`   – failure signal (form errors, denied actions)
 *
 * **Selection**:
 * - `selection` – ultra-light tick (picker scrolls, segment changes)
 *
 * All triggers silently no-op on non-iOS platforms.
 */
export function useHaptic() {
	// ── Impact ──────────────────────────────────────────────────────────
	const light = useCallback(() => {
		if (IS_IOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}, []);

	const medium = useCallback(() => {
		if (IS_IOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	}, []);

	const heavy = useCallback(() => {
		if (IS_IOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
	}, []);

	// ── Notification ────────────────────────────────────────────────────
	const success = useCallback(() => {
		if (IS_IOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	}, []);

	const warning = useCallback(() => {
		if (IS_IOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	}, []);

	const error = useCallback(() => {
		if (IS_IOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
	}, []);

	// ── Selection ───────────────────────────────────────────────────────
	const selection = useCallback(() => {
		if (IS_IOS) Haptics.selectionAsync();
	}, []);

	return { light, medium, heavy, success, warning, error, selection } as const;
}

/**
 * Fires a light haptic when a tab screen gains focus.
 * Skips the initial mount so it only triggers on actual tab switches.
 */
export function useTabFocusHaptic(): void {
	const hasMounted = useRef(false);
	const { light } = useHaptic();

	useFocusEffect(() => {
		if (hasMounted.current) light();
		hasMounted.current = true;
	});
}

