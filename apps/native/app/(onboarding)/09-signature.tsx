import { SafeAreaView } from "@/components/safe-area-view";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { Button } from "heroui-native";
import { BadgeCheck } from "lucide-react-native";
import React, { useMemo, useState, useCallback, useRef } from "react";
import { Text, View, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PIConfetti, PIConfettiMethods } from 'react-native-fast-confetti';

const COMMITMENTS = [
  "Be willing and open to learn",
  "Try to become the best version of myself",
  "Be open to change",
  "Care about my personal wellbeing",
];

export default function SignatureScreen() {
  const { next } = useOnboarding();
  const [lines, setLines] = useState<{ x: number; y: number }[][]>([]);
  const { success: hapticSuccess } = useHaptic();
  
  const confettiRef = useRef<PIConfettiMethods>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleContinue = useCallback(() => {
    if (isAnimating) return;
    hapticSuccess();
    
    // Play confetti explosion and wait before transitioning
    setIsAnimating(true);
    confettiRef.current?.restart();
    
    setTimeout(() => {
      next();
    }, 2000);
  }, [next, hapticSuccess, isAnimating]);

  // Build the Skia Path directly from the points
  const signaturePath = useMemo(() => {
    const path = Skia.Path.Make();
    lines.forEach((line) => {
      if (line.length === 0) return;
      path.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) {
        path.lineTo(line[i].x, line[i].y);
      }
    });
    return path;
  }, [lines]);

  // Native gesture detector for recording the drawing paths
  const pan = Gesture.Pan()
    .runOnJS(true)
    .maxPointers(1)
    .onStart((e) => {
      setLines((prev) => [...prev, [{ x: e.x, y: e.y }]]);
    })
    .onUpdate((e) => {
      setLines((prev) => {
        const newLines = [...prev];
        if (newLines.length > 0) {
          newLines[newLines.length - 1].push({ x: e.x, y: e.y });
        }
        return newLines;
      });
    });

  const hasSignature = lines.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#0000ff]">
      {/* Content Area */}
      <View className="flex-1 px-8 pt-10">
        {/* Header */}
        <Text className="text-center font-bold text-4xl text-white mb-4">
          Sign your commitment
        </Text>
        <Text className="text-center text-lg text-white mb-8">
          From this day onwards I will:
        </Text>

        {/* Commitments List */}
        <View className="mb-10 pl-2">
          {COMMITMENTS.map((commitment, index) => (
            <View key={index} className="flex-row items-center mb-4">
              <BadgeCheck size={24} color="#0000ff" fill="white" />
              <Text className="text-white text-lg ml-3 shrink">
                {commitment}
              </Text>
            </View>
          ))}
        </View>

        {/* Signature Pad container */}
        <View className="flex-1 mb-8 relative">
          <GestureDetector gesture={pan}>
            <View className="flex-1 bg-white/10 rounded-3xl border border-white/20 overflow-hidden touch-none w-full h-full">
              <Canvas style={{ flex: 1 }}>
                <Path
                  path={signaturePath}
                  color="white"
                  style="stroke"
                  strokeWidth={4}
                  strokeCap="round"
                  strokeJoin="round"
                />
              </Canvas>
            </View>
          </GestureDetector>

          {!hasSignature && (
            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <Text className="text-white/50 text-xl font-medium">Sign here</Text>
            </View>
          )}

          {hasSignature && (
            <View className="absolute top-4 right-4 z-10">
              <Pressable
                onPress={() => setLines([])}
                hitSlop={10}
                className="bg-black/20 px-3 py-1.5 rounded-full"
              >
                <Text className="text-white text-xs font-medium">Clear</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View className="px-8 pb-10">
        <Button
          onPress={handleContinue}
          className="w-full bg-white/70 h-14 rounded-full"
          isDisabled={!hasSignature || isAnimating}
          style={{ opacity: hasSignature ? 1 : 0.5 }}
        >
          <Text className="text-[#0000ff] font-bold text-lg">Continue</Text>
        </Button>
      </View>

      <View pointerEvents="none" className="absolute inset-0 z-50">
        <PIConfetti 
          ref={confettiRef} 
          colors={["#FFFFFF", "#F8FAFC", "#F1F5F9", "#E2E8F0"]} 
          count={450} 
          fallDuration={3500} 
          sizeVariation={0.2}
        />
      </View>
    </SafeAreaView>
  );
}
