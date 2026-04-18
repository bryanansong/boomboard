import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { withUniwind } from 'uniwind';

const StyledAnimatedView = withUniwind(Animated.View);
const StyledDateTimePicker = withUniwind(DateTimePicker);

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  initialDate?: Date;
}

export function DatePickerComponent({
  visible,
  onClose,
  onDateSelect,
  initialDate = new Date(),
}: DatePickerProps) {
  const [tempDate, setTempDate] = useState(initialDate);
  const backdropOpacity = useSharedValue(0);
  const slideUp = useSharedValue(300);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setTempDate(initialDate);
      backdropOpacity.value = withTiming(1, { duration: 250 });
      slideUp.value = withTiming(0, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      slideUp.value = withTiming(300, { duration: 250 });
    }
  }, [visible, initialDate]);

  const handleDone = useCallback(() => {
    onDateSelect(tempDate);
    onClose();
  }, [tempDate, onDateSelect, onClose]);

  const onChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <StyledAnimatedView className="absolute inset-0 bg-black/30" style={backdropStyle}>
          <Pressable className="flex-1" onPress={onClose} />
        </StyledAnimatedView>

        {/* Picker Container */}
        <StyledAnimatedView
          className="bg-surface rounded-t-2xl pt-3"
          style={[containerStyle, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View className="items-center justify-center my-2.5">
            <StyledDateTimePicker
              testID="datePicker"
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={onChange}
              textColor="var(--foreground)"
              className="h-[200px] w-full"
            />
          </View>

          {/* Done Button */}
          <Pressable
            className="mx-5 mt-4 bg-accent rounded-[30px] py-4 items-center justify-center active:opacity-85 active:scale-98"
            onPress={handleDone}
            style={({ pressed }) => pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : undefined}
          >
            <Text className="text-[17px] font-semibold text-accent-foreground tracking-[-0.2px]">Done</Text>
          </Pressable>
        </StyledAnimatedView>
      </View>
    </Modal>
  );
}
