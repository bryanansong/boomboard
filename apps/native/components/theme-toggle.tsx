import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
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
        <View key="moon">
          <StyledIonicons name="moon" size={20} className="text-foreground" />
        </View>
      ) : (
        <View key="sun">
          <StyledIonicons name="sunny" size={20} className="text-foreground" />
        </View>
      )}
    </Pressable>
  );
}

