import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AuthRoutesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: Platform.OS === "android" ? "none" : undefined }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}

