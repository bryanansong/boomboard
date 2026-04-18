import { RadioGroup, Label, useRadioGroup } from "heroui-native";
import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { useAppTheme } from "@/lib/hooks";

import tiktokLogo from "../../assets/logos/tiktok.svg";
import googleLogo from "../../assets/logos/google.svg";
import instagramLogo from "../../assets/logos/instagram.svg";
import youtubeLogo from "../../assets/logos/youtube.svg";
import redditLogo from "../../assets/logos/reddit.svg";
import facebookLogo from "../../assets/logos/facebook.svg";
import xDarkLogo from "../../assets/logos/x-dark.svg";
import xLightLogo from "../../assets/logos/x-light.svg";

const LOGO_MAP: Record<string, any> = {
  TikTok: tiktokLogo,
  Google: googleLogo,
  Instagram: instagramLogo,
  YouTube: youtubeLogo,
  Reddit: redditLogo,
  Facebook: facebookLogo,
};

interface QuizOptionProps {
  label: string;
  value: string;
}

export function QuizOption({ label, value }: QuizOptionProps) {
  const { value: isSelected } = useRadioGroup();
  const { isDark } = useAppTheme();

  const selected = value === isSelected;
  const textColor = selected
    ? isDark ? "#000000" : "#FFFFFF"
    : isDark ? "#FFFFFF" : "#000000";

  const logoSource = label === "X" 
    ? (isDark ? xLightLogo : xDarkLogo) 
    : LOGO_MAP[label];

  return (
    <RadioGroup.Item
      value={value}
      className={`p-6 py-5 rounded-xl ${
        selected ? "bg-foreground" : "bg-surface"
      }`}
    >
      <Label>
        <View className="flex-row items-center gap-4">
          {logoSource && (
            <Image 
              source={logoSource} 
              style={{ width: 24, height: 24 }} 
              contentFit="contain" 
            />
          )}
          <Text style={{ color: textColor }} className="text-lg tracking-wide leading-tight">{label}</Text>
        </View>
      </Label>
    </RadioGroup.Item>
  );
}

export default QuizOption;
