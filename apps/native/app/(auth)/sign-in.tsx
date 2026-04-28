import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Button, useToast } from "heroui-native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { storage } from "@/lib/storage";

import { useOnboardingStore } from "@/lib/stores/onboarding-store";

/** Preloads the browser for Android devices to reduce authentication load time */
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onPress = useCallback(async () => {
    try {
      setIsLoading(true);

			// Redirect back to this screen after OAuth completes. Using the current
			// route (sign-in) ensures Expo Router lands on a valid page. The
			// Stack.Protected guards in _layout will automatically move the user to
			// (tabs) once isSignedIn becomes true.
			const redirectUrl = Linking.createURL("(auth)/sign-in");

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (result.createdSessionId) {
        await result.setActive!({ session: result.createdSessionId });
        // AuthGuard will handle navigation automatically
      } else if (result.authSessionResult?.type === "dismiss") {
        // User dismissed the browser — this is a genuine cancellation
        toast.show({
          label: "Sign In Cancelled",
          description: "Please try again to continue.",
          variant: "warning",
          duration: 3000,
        });
      } else {
        toast.show({
          label: "Sign In Incomplete",
          description: "Something went wrong. Please try again.",
          variant: "warning",
          duration: 3000,
        });
      }
    } catch (err) {
      console.error("[Auth] OAuth error:", err);
      toast.show({
        label: "Sign In Failed",
        description: "Something went wrong. Please try again.",
        variant: "danger",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, toast]);

  const handleClearStorage = useCallback(async () => {
    if (!__DEV__) {
      return;
    }

    try {
      storage.clearAll();
      toast.show({
        label: "Storage Cleared",
        description: "MMKV storage has been cleared. Reload the app.",
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error clearing storage:", err);
      toast.show({
        label: "Clear Failed",
        description: "Failed to clear storage.",
        variant: "danger",
        duration: 3000,
      });
    }
  }, [toast]);

  return (
    <View className="flex-1 bg-white justify-center p-6">
      <View className="items-stretch">
        {/* Branding */}
        <View className="mb-16 items-center">
          <Text className="text-5xl mb-4">🔊</Text>
          <Text className="text-[32px] font-bold text-neutral-900 mb-2 text-center">
            BoomBoard
          </Text>
          <Text className="text-base text-neutral-400 text-center leading-6">
            Your sounds, instantly.
          </Text>
        </View>

        {/* Sign In Button */}
        <View className="mt-2.5">
          <Button onPress={onPress} isDisabled={isLoading}>
            <Button.Label>
              {isLoading ? "Signing in..." : "Continue with Google"}
            </Button.Label>
          </Button>
        </View>

        {__DEV__ && (
          <>
          <View className="mt-5">
            <Button onPress={handleClearStorage} variant="tertiary">
              <Button.Label>Clear MMKV Storage (Dev)</Button.Label>
            </Button>
          </View>
          <View className="mt-2">
            <Button
              onPress={() => {
                // Reset onboarding state and navigate to welcome screen
                useOnboardingStore.getState().resetOnboarding();
                router.replace("/(onboarding)/01-welcome" as never);
              }}
              variant="tertiary"
            >
              <Button.Label>Restart Onboarding</Button.Label>
            </Button>
          </View>
          </>
        )}
      </View>
    </View>
  );
}
