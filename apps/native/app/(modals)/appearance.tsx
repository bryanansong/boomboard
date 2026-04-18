import { Ionicons } from "@expo/vector-icons";
import { Card, PressableFeedback, Surface } from "heroui-native";
import { useCallback } from "react";
import { Text, View } from "react-native";

import { LargeTitleScrollView } from "@/components/ui/large-title-view";
import { Theme, useAppTheme } from "@/lib/hooks";

/** Configuration for each theme option */
interface ThemeOptionConfig {
  id: Theme;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/** Theme options configuration array */
const THEME_OPTIONS: ThemeOptionConfig[] = [
  { id: "system", label: "System", icon: "contrast-outline" },
  { id: "light", label: "Light", icon: "sunny-outline" },
  { id: "dark", label: "Dark", icon: "moon-outline" },
];

/** Colors for progress rings in the preview */
const RING_COLORS = ["#FF9500", "#34C759", "#007AFF"];

/**
 * Renders a visual phone preview for a given theme option.
 * Shows split preview for system, light-only for light, dark-only for dark.
 */
function ThemePreview({ theme }: { theme: Theme }) {
  const isSystemTheme = theme === "system";
  const isLightTheme = theme === "light";
  const isDarkTheme = theme === "dark";

  // Preview colors (static, not actual theme colors)
  const lightBg = "#F5F5F7";
  const darkBg = "#1C1C1E";
  const lightElement = "#E5E5EA";
  const darkElement = "#2C2C2E";

  /**
   * Renders a single panel inside the phone preview.
   */
  const renderPanel = (panelTheme: "light" | "dark", ringColors: string[]) => {
    const bg = panelTheme === "light" ? lightBg : darkBg;
    const elementColor = panelTheme === "light" ? lightElement : darkElement;

    return (
      <View className="flex-1" style={{ backgroundColor: bg }}>
        {/* Header bar placeholder */}
        <View
          className="h-3 mx-2 mt-2 rounded-sm"
          style={{ backgroundColor: elementColor }}
        />

        {/* Content area with progress rings */}
        <View className="flex-1 flex-row justify-center items-center gap-1 px-1">
          {ringColors.map((color, index) => (
            <View
              key={index}
              className="w-5 h-5 rounded-full border-2"
              style={{ borderColor: color }}
            />
          ))}
        </View>

        {/* Bottom bar placeholder */}
        <View
          className="h-2 mx-2 mb-2 rounded-sm"
          style={{ backgroundColor: elementColor }}
        />
      </View>
    );
  };

  return (
    <Surface
      variant="secondary"
      className="w-[90px] h-[110px] rounded-xl overflow-hidden border border-border p-0"
    >
      <View className="flex-1 flex-row">
        {isSystemTheme && (
          <>
            {renderPanel("light", [RING_COLORS[0]])}
            {renderPanel("dark", [RING_COLORS[1], RING_COLORS[2]])}
          </>
        )}
        {isLightTheme && renderPanel("light", RING_COLORS)}
        {isDarkTheme && renderPanel("dark", RING_COLORS)}
      </View>
    </Surface>
  );
}

/**
 * Individual theme option card with selectable state.
 */
function ThemeOptionCard({
  option,
  isSelected,
  onSelect,
}: {
  option: ThemeOptionConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <PressableFeedback
      className={`flex-1 items-center py-4 rounded-xl ${
        isSelected ? "border-2 border-accent" : ""
      }`}
      onPress={onSelect}
    >
      <ThemePreview theme={option.id} />
      <View className="flex-row items-center mt-3 gap-1.5">
        <Ionicons
          name={option.icon}
          size={16}
          color={isSelected ? "var(--foreground)" : "var(--muted)"}
        />
        <Text
          className={`text-[15px] ${
            isSelected ? "text-foreground font-medium" : "text-muted"
          }`}
        >
          {option.label}
        </Text>
      </View>
    </PressableFeedback>
  );
}

/**
 * Appearance modal screen for theme selection.
 * Allows users to toggle between System, Light, and Dark themes.
 */
export default function AppearanceModal() {
  const { theme, setTheme } = useAppTheme();

  const handleThemeSelect = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme);
    },
    [setTheme]
  );

  /**
   * Determines if an option is currently selected.
   */
  const isOptionSelected = useCallback(
    (optionId: Theme) => theme === optionId,
    [theme]
  );

  return (
    <LargeTitleScrollView contentContainerClassName="px-5" noLargeTitle={true}>
      <View className="mt-6">
        <Text className="text-[20px] font-semibold text-foreground mb-4">
          App theme
        </Text>

        {/* Theme options card using heroui Card component */}
        <Card className="p-3">
          <Card.Body className="p-0">
            <View className="flex-row">
              {THEME_OPTIONS.map((option) => (
                <ThemeOptionCard
                  key={option.id}
                  option={option}
                  isSelected={isOptionSelected(option.id)}
                  onSelect={() => handleThemeSelect(option.id)}
                />
              ))}
            </View>
          </Card.Body>
        </Card>
      </View>
    </LargeTitleScrollView>
  );
}
