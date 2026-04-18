import { withUniwind } from "uniwind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

/**
 * A SafeAreaView component wrapped with Uniwind for className support.
 * Use this component instead of importing SafeAreaView directly from react-native-safe-area-context
 * to enable Tailwind-style className props.
 */
export const SafeAreaView = withUniwind(RNSafeAreaView);
