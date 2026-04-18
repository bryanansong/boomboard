import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { useAppTheme, useHaptic } from "@/lib/hooks";

const StyledIonicons = withUniwind(Ionicons);

export function ThemeToggle() {
  const { toggleTheme, isLight } = useAppTheme();
  const { light } = useHaptic();

  return (
    <Pressable
      onPress={() => {
        light();
        toggleTheme();
      }}
      className="px-2.5"
    >
      {isLight ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <StyledIonicons name="moon" size={20} className="text-foreground" />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <StyledIonicons name="sunny" size={20} className="text-foreground" />
        </Animated.View>
      )}
    </Pressable>
  );
}

