import { useClerk, useUser } from "@clerk/clerk-expo";
import { env } from "@boomboard/env/native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useMemo } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useCSSVariable } from "uniwind";
import {
  User,
  Palette,
  Bell,
  CreditCard,
  Lightbulb,
  TriangleAlert,
  FileText,
  Shield,
  RefreshCcw,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";

import { LargeTitleScrollView } from "@/components/ui/large-title-view";
import { showBugReportMailPicker } from "@/lib/utils/bug-report";
import { useOnboarding } from "@/lib/onboarding";

// Settings item data type
interface SettingsItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  color?: SettingColor;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

type SettingColor =
  | "blue"
  | "purple"
  | "red"
  | "green"
  | "yellow"
  | "orange"
  | "sky"
  | "indigo"
  | "slate"
  | "pink";

const SETTING_COLORS: Record<SettingColor, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100/80 dark:bg-blue-900/40", icon: "#007AFF" },
  purple: { bg: "bg-purple-100/80 dark:bg-purple-900/40", icon: "#AF52DE" },
  red: { bg: "bg-red-100/80 dark:bg-red-900/40", icon: "#FF3B30" },
  green: { bg: "bg-green-100/80 dark:bg-green-900/40", icon: "#34C759" },
  yellow: { bg: "bg-yellow-100/80 dark:bg-yellow-900/40", icon: "#FFCC00" },
  orange: { bg: "bg-orange-100/80 dark:bg-orange-900/40", icon: "#FF9500" },
  sky: { bg: "bg-sky-100/80 dark:bg-sky-900/40", icon: "#5AC8FA" },
  indigo: { bg: "bg-indigo-100/80 dark:bg-indigo-900/40", icon: "#5856D6" },
  slate: { bg: "bg-slate-100/80 dark:bg-slate-900/40", icon: "#8E8E93" },
  pink: { bg: "bg-pink-100/80 dark:bg-pink-900/40", icon: "#FF2D55" },
};

/**
 * A themed icon container with pastel background
 */
const SettingIcon = ({
  icon: Icon,
  color = "blue",
  destructive,
  dangerColor,
}: {
  icon: LucideIcon;
  color?: SettingColor;
  destructive?: boolean;
  dangerColor: string;
}) => {
  const theme = SETTING_COLORS[color];
  const iconColor = destructive ? dangerColor : theme.icon;

  return (
    <View
      className={`w-8 h-8 rounded-[10px] items-center justify-center ${theme.bg}`}
    >
      <Icon size={20} color={iconColor as any} strokeWidth={2.5} />
    </View>
  );
};

interface SettingRowProps {
  item: SettingsItem;
  isLast: boolean;
  dangerColor: string;
  mutedColor: string;
}

/**
 * A single row in the settings list
 */
const SettingRow = ({
  item,
  isLast,
  dangerColor,
  mutedColor,
}: SettingRowProps) => (
  <TouchableOpacity
    className={`flex-row items-center py-2.5 px-3.5 ${
      !isLast ? "border-b border-border/50" : ""
    }`}
    onPress={item.onPress}
    activeOpacity={0.6}
  >
    <SettingIcon
      icon={item.icon}
      color={item.color}
      destructive={item.destructive}
      dangerColor={dangerColor}
    />
    <Text
      className={`flex-1 text-[17px] text-foreground ml-3.5 ${
        item.destructive ? "text-danger" : ""
      }`}
    >
      {item.label}
    </Text>
    <ChevronRight size={18} color={mutedColor as any} strokeWidth={2.5} />
  </TouchableOpacity>
);

export default function SettingsModal() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { resetOnboarding } = useOnboarding();

  // Get theme colors from CSS variables
  const foregroundColor = (useCSSVariable("--foreground") ?? "#000000") as string;
  const dangerColor = (useCSSVariable("--danger") ?? "#FF3B30") as string;
  const mutedColor = (useCSSVariable("--muted") ?? "#8E8E93") as string;

  // Get user initials for avatar
  const getInitials = useCallback(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return "?";
  }, [user]);

  // Get display name
  const displayName = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.emailAddresses?.[0]?.emailAddress || "User";
  }, [user]);

  // Get email
  const email = useMemo(() => {
    return user?.emailAddresses?.[0]?.emailAddress || "";
  }, [user]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, [signOut]);

  // Handle reset onboarding
  const handleResetOnboarding = useCallback(async () => {
    await resetOnboarding();
  }, [resetOnboarding]);

  // Handle account details navigation
  const handleAccountPress = useCallback(() => {
    router.push("/(modals)/account-details");
  }, []);

  // Handle appearance navigation
  const handleAppearancePress = useCallback(() => {
    router.push("/(modals)/appearance");
  }, []);

  // Handle manage subscriptions navigation
  const handleManageSubscriptions = useCallback(() => {
    router.push("/(modals)/manage-subscriptions");
  }, []);


  // Handle request feature
  const handleRequestFeature = useCallback(() => {
    // TODO: Implement feature request functionality
    console.log("Request a feature");
  }, []);

  // Handle report bug
  const handleReportBug = useCallback(() => {
    showBugReportMailPicker(user?.id, user?.emailAddresses?.[0]?.emailAddress);
  }, [user]);

  // Handle terms of service
  const handleTermsOfService = useCallback(async () => {
    try {
      const url = env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL;
      if (!url || !url.startsWith("http")) {
        console.error("Invalid Terms of Service URL:", url);
        return;
      }
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (error) {
      console.error("Failed to open Terms of Service:", error);
    }
  }, []);

  // Handle privacy policy
  const handlePrivacyPolicy = useCallback(async () => {
    try {
      const url = env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
      if (!url || !url.startsWith("http")) {
        console.error("Invalid Privacy Policy URL:", url);
        return;
      }
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (error) {
      console.error("Failed to open Privacy Policy:", error);
    }
  }, []);

  // Settings sections data
  const sections: SettingsSection[] = useMemo(
    () => [
      {
        title: "General",
        items: [
          {
            id: "account",
            icon: User,
            label: "Account",
            onPress: handleAccountPress,
            color: "blue",
          },
          {
            id: "appearance",
            icon: Palette,
            label: "Appearance",
            onPress: handleAppearancePress,
            color: "purple",
          },
          {
            id: "manage-subscriptions",
            icon: CreditCard,
            label: "Manage Subscriptions",
            onPress: handleManageSubscriptions,
            color: "green",
          },
        ],
      },
      {
        title: "Support",
        items: [
          {
            id: "request-feature",
            icon: Lightbulb,
            label: "Request a feature",
            onPress: handleRequestFeature,
            color: "yellow",
          },
          {
            id: "report-bug",
            icon: TriangleAlert,
            label: "Report a bug",
            onPress: handleReportBug,
            color: "orange",
          },
        ],
      },
      {
        title: "Legal",
        items: [
          {
            id: "terms",
            icon: FileText,
            label: "Terms of Service",
            onPress: handleTermsOfService,
            color: "blue",
          },
          {
            id: "privacy-policy",
            icon: Shield,
            label: "Privacy Policy",
            onPress: handlePrivacyPolicy,
            color: "indigo",
          },
        ],
      },
      {
        title: "Actions",
        items: [
          {
            id: "reset",
            icon: RefreshCcw,
            label: "Reset Onboarding",
            onPress: handleResetOnboarding,
            color: "slate",
          },
          {
            id: "signout",
            icon: LogOut,
            label: "Sign Out",
            onPress: handleSignOut,
            destructive: true,
            color: "red",
          },
        ],
      },
    ],
    [
      handleSignOut,
      handleResetOnboarding,
      handleAccountPress,
      handleAppearancePress,
      handleManageSubscriptions,
      handleRequestFeature,
      handleReportBug,
      handleTermsOfService,
      handlePrivacyPolicy,
    ]
  );

  return (
    <LargeTitleScrollView contentContainerClassName="px-5">
      {sections.map((section) => (
        <View key={section.title} className="mb-6">
          <Text className="text-[13px] font-semibold text-muted uppercase tracking-[0.5px] mb-2.5 pl-1">
            {section.title}
          </Text>
          <View className="bg-surface rounded-2xl overflow-hidden shadow-sm">
            {section.items.map((item, index) => (
              <SettingRow
                key={item.id}
                item={item}
                isLast={index === section.items.length - 1}
                dangerColor={dangerColor}
                mutedColor={mutedColor}
              />
            ))}
          </View>
        </View>
      ))}

      <Text className="text-[13px] text-muted text-center mt-4">
        Version 1.0.0
      </Text>
    </LargeTitleScrollView>
  );
}
