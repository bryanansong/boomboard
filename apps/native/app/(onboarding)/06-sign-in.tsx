import { useAuth, useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Button, useToast, PressableFeedback } from "heroui-native";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { useOnboarding } from "@/lib/onboarding";
import { useHaptic } from "@/lib/hooks";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

function isAlreadySignedInClerkError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "errors" in err) {
    const errors = (err as { errors?: Array<{ code?: string; message?: string }> }).errors;
    if (Array.isArray(errors)) {
      return errors.some(
        (e) =>
          e.code === "session_exists" ||
          /already signed in/i.test(e.message ?? ""),
      );
    }
  }
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : String(err);
  return /already signed in/i.test(msg);
}

// Preloads the browser for Android devices to reduce authentication load time
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

export default function SignInScreen() {
  useWarmUpBrowser();
  const { isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const { toast } = useToast();
  const { completeOnboarding } = useOnboarding();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { medium: hapticMedium } = useHaptic();

  const onGooglePress = useCallback(async () => {
    hapticMedium();

    if (isSignedIn) {
      try {
        setIsGoogleLoading(true);
        await completeOnboarding();
      } finally {
        setIsGoogleLoading(false);
      }
      return;
    }

    try {
      setIsGoogleLoading(true);

      // Same SSO pattern as (auth)/sign-in. Deep link must open this route while
      // onboarding is incomplete (the (auth) group is not mounted then).
      const redirectUrl = Linking.createURL("(onboarding)/06-sign-in");

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (result.createdSessionId) {
        await result.setActive!({ session: result.createdSessionId });
        // This is the last onboarding screen; `next()` is a no-op here. Finish
        // onboarding and let the root Stack.Protected guards route to the app.
        await completeOnboarding();
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
      if (isAlreadySignedInClerkError(err)) {
        await completeOnboarding();
        return;
      }
      console.error("[Onboarding] OAuth error:", err);
      toast.show({
        label: "Sign In Failed",
        description: "Something went wrong. Please try again.",
        variant: "danger",
        duration: 3000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isSignedIn, startSSOFlow, toast, completeOnboarding, hapticMedium]);

  return (
    <SafeAreaView className="flex-1 bg-background px-8">
      {/* Header */}
      <View className="items-center mt-12 mb-10">
        <Text className="text-4xl font-bold text-foreground mb-10 tracking-tight">
          App Name
        </Text>
        
        <Text className="text-4xl text-foreground mb-2">
          Save your progress
        </Text>
        <Text className="text-lg text-muted text-center font-medium">
          Let's get started on your journey
        </Text>
      </View>

      {/* Inputs and Buttons Area */}
      <View className="flex-1 justify-start pt-2 gap-5">
        {/* Auth Buttons */}
        <View className="gap-3 mt-2">
          <PressableFeedback 
            className="w-full h-14 bg-background-secondary rounded-full flex-row items-center justify-center gap-3 border border-border"
            onPress={onGooglePress}
            isDisabled={isGoogleLoading}
          >
            <StyledIonicons name="logo-google" size={25} className="text-foreground" />
            <Text className="text-foreground font-semibold text-[17px]">
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </Text>
          </PressableFeedback>

          {__DEV__ && (
            <Button
              onPress={() => {
                void completeOnboarding();
              }}
              variant="outline"
              size="lg"
            >
              <Button.Label>[DEV] Skip Sign In</Button.Label>
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
