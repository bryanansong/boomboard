import { View, Text } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
  FadeIn,
  FadeOut,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { CheckCircle2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCSSVariable } from "uniwind";

const ITEM_HEIGHT = 50; // Comfortable touch/reading size

type LoadingState = {
  text: string;
};

interface LoaderCoreProps {
  loadingStates: LoadingState[];
  value?: number;
}

const LoaderCore = ({ loadingStates, value = 0 }: LoaderCoreProps) => {
  const transitionVal = useDerivedValue(() => {
    return withTiming(value, { duration: 500 });
  });

  return (
    <View className="w-full flex-1 justify-center items-center">
      <View
        style={{ height: ITEM_HEIGHT * 5, overflow: "visible" }} // Show roughly 4 items (focus + neighbors)
        className="w-full max-w-sm relative"
      >
        {loadingStates.map((state, index) => {
          return (
            <LoaderItem
              key={state.text}
              index={index}
              state={state}
              transitionVal={transitionVal}
              itemHeight={ITEM_HEIGHT}
              isCurrent={index === value}
              value={value}
            />
          );
        })}
        {/** Gradient Overlays for Fade Effect */}
        <LinearGradient
          colors={["rgba(255,255,255,1)", "rgba(255,255,255,0)"]} // Adjust for dark mode dynamically
          className="absolute top-0 left-0 right-0 h-10 z-10 dark:opacity-0"
        />
        <LinearGradient
          colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
          className="absolute top-0 left-0 right-0 h-10 z-10 opacity-0 dark:opacity-100"
        />

        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
          className="absolute bottom-0 left-0 right-0 h-10 z-10 dark:opacity-0"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,1)"]}
          className="absolute bottom-0 left-0 right-0 h-10 z-10 opacity-0 dark:opacity-100"
        />
      </View>
    </View>
  );
};

interface LoaderItemProps {
  index: number;
  state: LoadingState;
  transitionVal: SharedValue<number>;
  itemHeight: number;
  isCurrent: boolean;
  value: number;
}

import Svg, { Path } from "react-native-svg";

const CheckFilled = ({ size = 24, color = "black" }: { size?: number; color?: string }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
       <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        fill={color}
      />
    </Svg>
  );
};

const LoaderItem = ({
  index,
  state,
  transitionVal,
  itemHeight,
  isCurrent,
  value,
}: LoaderItemProps) => {
  const foreground = useCSSVariable("--foreground");
  
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(index - transitionVal.value);
    const opacity = interpolate(
      distance,
      [0, 1, 3],
      [1, 0.4, 0], // Focus is 1, neighbors 0.4, far away 0
      Extrapolation.CLAMP,
    );

    const translateY =
      (index - transitionVal.value) * itemHeight + itemHeight * 2; // Center offset slightly adj

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View
      className="absolute left-0 right-0 flex-row items-center gap-4 px-4 h-12" // h-12 matches ITEM_HEIGHT 48
      style={[animatedStyle]}
    >
      <View className="w-6 items-center justify-center">
        {index > value && <CheckCircle2 size={24} color={foreground as string} />}
        {index <= value && (
          <CheckFilled
            size={24}
            color={"#84CC16"}
          />
        )}
      </View>
      <Text
        className={`text-lg font-medium text-foreground`}
      >
        {state.text}
      </Text>
    </Animated.View>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
  onStepChange,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  onStepChange?: (step: number) => void;
}) => {
const [currentState, setCurrentState] = useState(0);
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    const timeout = setTimeout(() => {
      setCurrentState((prevState) => {
        const nextState = loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1);
        
        if (nextState !== prevState && onStepChangeRef.current) {
          onStepChangeRef.current(nextState);
        }
        return nextState;
      });
    }, duration);

    return () => clearTimeout(timeout);
  }, [loading, loop, loadingStates.length, duration]);

  if (!loading) return null;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      className="absolute inset-0 z-100 items-center justify-center"
    >
      <BlurView
        intensity={80} // Heavy blur
        tint="prominent" // Adapts to system theme usually or "default"
        className="absolute inset-0"
      />

      <LoaderCore loadingStates={loadingStates} value={currentState} />
    </Animated.View>
  );
};
