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

/** Type guard for Clerk API errors */
interface ClerkError {
  clerkError: boolean;
  errors: Array<{ code: string; message: string }>;
}

function isClerkError(err: unknown): err is ClerkError {
  return (
    typeof err === "object" &&
    err !== null &&
    "clerkError" in err &&
    (err as ClerkError).clerkError === true
  );
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
  const { startSSOFlow } = useSSO();
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  const { next } = useOnboarding();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { medium: hapticMedium } = useHaptic();

  const onGooglePress = useCallback(async () => {
    hapticMedium();
    // If already signed in (e.g. from a previous session), skip OAuth entirely
    if (isSignedIn) {
      next();
      return;
    }

    try {
      setIsGoogleLoading(true);

      // Redirect back to this screen after OAuth completes. Path must match
      // this file’s route (06-sign-in) so the deep link opens a real screen and
      // the auth session can complete. Update Clerk Dashboard allowed redirect
      // URLs if you change this path.
      const redirectUrl = Linking.createURL("(onboarding)/06-sign-in");

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (result.createdSessionId) {
        await result.setActive!({ session: result.createdSessionId });
        // Proceed to next onboarding screen (e.g. paywall)
        next();
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
      // If Clerk says a session already exists, the user IS signed in — just proceed
      if (isClerkError(err) && err.errors.some((e) => e.code === "session_exists")) {
        console.log("Session already exists, proceeding to next screen.");
        next();
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
  }, [startSSOFlow, isSignedIn, toast, next, hapticMedium]);

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
            onPress={() => {
              hapticMedium();
              toast.show({
                label: "Not Configured",
                description: "Apple Auth is not set up.",
                variant: "warning",
              })
            }}
          >
            <StyledIonicons name="logo-apple" size={25} className="text-foreground -mt-[2px]" />
            <Text className="text-foreground font-semibold text-[17px]">
              Continue With Apple
            </Text>
          </PressableFeedback>
          
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
              onPress={next}
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
