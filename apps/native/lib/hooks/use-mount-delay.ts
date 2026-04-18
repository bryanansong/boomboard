import { useState, useEffect } from "react";

/**
 * Returns `false` initially, and then returns `true` after the specified delay on mount.
 * Useful for preventing accidental clicks immediately after a screen transitions in.
 */
export function useMountDelay(delayMs = 1000) {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsReady(true), delayMs);
		return () => clearTimeout(timer);
	}, [delayMs]);

	return isReady;
}
