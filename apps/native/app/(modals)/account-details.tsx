import { useUser, useClerk } from "@clerk/clerk-expo";
import { useNavigation, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Text,
  View,
  Alert,
  TextInput,
  Button as RNButton,
} from "react-native";
import {
  useToast,
  Surface,
  Button,
  PressableFeedback,
} from "heroui-native";

import { LargeTitleScrollView } from "@/components/ui/large-title-view";
import { DatePickerComponent } from "@/components/ui/date-picker";

/**
 * Account Details Modal Screen
 * Allows users to view and edit their account information.
 */
export default function AccountDetailsModal() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [birthday, setBirthday] = useState<Date | null>(() => {
    const metadataBirthday = user?.publicMetadata?.birthday as
      | string
      | undefined;
    if (metadataBirthday) {
      return new Date(metadataBirthday);
    }
    return new Date(2003, 8, 23);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingField, setEditingField] = useState<
    "firstName" | "lastName" | "birthday" | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [birthdayText, setBirthdayText] = useState(() => {
    const metadataBirthday = user?.publicMetadata?.birthday as
      | string
      | undefined;
    if (metadataBirthday) {
      const date = new Date(metadataBirthday);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return "September 23, 2003";
  });

  /** Get user initials for avatar fallback */
  const getInitials = useCallback(() => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return "BA";
  }, [firstName, lastName, user]);

  /** Calculate age from birthday */
  const age = useMemo(() => {
    if (!birthday) return null;
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      calculatedAge--;
    }
    return calculatedAge;
  }, [birthday]);

  /** Format birthday for display */
  const formattedBirthday = useMemo(() => {
    if (!birthday) return "";
    return birthday.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [birthday]);

  /** Check if there are unsaved changes */
  const checkChanges = useCallback(() => {
    const hasFirstNameChange = firstName !== (user?.firstName || "");
    const hasLastNameChange = lastName !== (user?.lastName || "");
    const metadataBirthday = user?.publicMetadata?.birthday as
      | string
      | undefined;
    const currentBirthday = metadataBirthday
      ? new Date(metadataBirthday).toISOString()
      : null;
    const newBirthday = birthday ? birthday.toISOString() : null;
    const hasBirthdayChange = currentBirthday !== newBirthday;

    setHasChanges(hasFirstNameChange || hasLastNameChange || hasBirthdayChange);
  }, [firstName, lastName, birthday, user]);

  useEffect(() => {
    checkChanges();
  }, [firstName, lastName, birthday, checkChanges]);

  /** Handle save account information */
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    // todo: Implement API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.show({
      label: "Saved",
      description: "Your account information has been updated. (Placeholder)",
      variant: "success",
      duration: 3000,
    });

    setHasChanges(false);
    setIsSaving(false);
  }, [firstName, lastName, birthday, toast]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNButton
          title="Save"
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        />
      ),
    });
  }, [navigation, hasChanges, isSaving, handleSave]);

  /** Handle edit profile photo */
  const handleEditPhoto = useCallback(() => {
    toast.show({
      label: "Edit Photo",
      description: "Photo editing functionality coming soon.",
      variant: "default",
      duration: 3000,
    });
  }, [toast]);

  /** Handle log out */
  const handleSignOut = useCallback(async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            console.error("Sign out error:", err);
          }
        },
      },
    ]);
  }, [signOut]);

  /** Handle delete account navigation */
  const handleDeleteAccount = useCallback(() => {
    router.push("/(modals)/delete-account");
  }, []);

  /** Handle first name change */
  const handleFirstNameChange = useCallback((text: string) => {
    setFirstName(text);
  }, []);

  /** Handle last name change */
  const handleLastNameChange = useCallback((text: string) => {
    setLastName(text);
  }, []);

  /** Handle birthday field blur */
  const handleBirthdayBlur = useCallback(() => {
    const parsedDate = new Date(birthdayText);
    if (!isNaN(parsedDate.getTime())) {
      setBirthday(parsedDate);
      setBirthdayText(
        parsedDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    } else if (birthdayText.trim() === "") {
      setBirthday(null);
    } else {
      setBirthdayText(formattedBirthday);
      toast.show({
        label: "Invalid Date",
        description: "Please enter a valid date format.",
        variant: "warning",
        duration: 2000,
      });
    }
    setEditingField(null);
  }, [birthdayText, formattedBirthday, toast]);

  return (
    <>
      <LargeTitleScrollView contentContainerClassName="px-5" noLargeTitle={true}>
        {/* Profile Section */}
        <View className="items-center mt-5 mb-8">
          <View className="mb-4">
            <View className="w-[100px] h-[100px] rounded-full bg-accent-soft items-center justify-center">
              <Text className="text-4xl font-semibold text-accent-soft-foreground">
                {getInitials()}
              </Text>
            </View>
          </View>
          <Text className="text-2xl font-semibold text-foreground mb-2">
            {firstName && lastName
              ? `${firstName} ${lastName}`
              : firstName || "User"}
          </Text>
          <PressableFeedback onPress={handleEditPhoto}>
            <Text className="text-[15px] text-muted">Edit photo</Text>
          </PressableFeedback>
        </View>

        {/* Account Information Card */}
        <Surface className="overflow-hidden mb-20 shadow-sm">
          {/* First Name Row */}
          {editingField === "firstName" ? (
            <View className="flex-row items-center justify-between py-3 px-3">
              <Text className="text-[17px] text-foreground font-normal">
                First Name
              </Text>
              <TextInput
                className="text-[17px] text-foreground font-normal text-right min-w-[100px] p-0"
                value={firstName}
                onChangeText={handleFirstNameChange}
                onBlur={() => setEditingField(null)}
                autoFocus
                placeholder="First Name"
              />
            </View>
          ) : (
            <PressableFeedback
              className="flex-row items-center justify-between py-3 px-3"
              onPress={() => setEditingField("firstName")}
            >
              <Text className="text-[17px] text-foreground font-normal">
                First Name
              </Text>
              <Text className="text-[17px] text-foreground font-normal">
                {firstName || "Not set"}
              </Text>
            </PressableFeedback>
          )}

          

          {/* Last Name Row */}
          {editingField === "lastName" ? (
            <View className="flex-row items-center justify-between py-3 px-3">
              <Text className="text-[17px] text-foreground font-normal">
                Last Name
              </Text>
              <TextInput
                className="text-[17px] text-foreground font-normal text-right min-w-[100px] p-0"
                value={lastName}
                onChangeText={handleLastNameChange}
                onBlur={() => setEditingField(null)}
                autoFocus
                placeholder="Last Name"
              />
            </View>
          ) : (
            <PressableFeedback
              className="flex-row items-center justify-between py-3 px-3"
              onPress={() => setEditingField("lastName")}
            >
              <Text className="text-[17px] text-foreground font-normal">
                Last Name
              </Text>
              <Text className="text-[17px] text-foreground font-normal">
                {lastName || "Not set"}
              </Text>
            </PressableFeedback>
          )}

          

          {/* Birthday Row */}
          <PressableFeedback
            className="flex-row items-center justify-between py-3 px-3"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className="text-[17px] text-foreground font-normal">
              Birthday
            </Text>
            <View className="flex-row items-center">
              <Text className="text-[17px] text-foreground font-normal">
                {formattedBirthday || "Not set"}
              </Text>
              <Text className="text-[22px] text-muted font-medium ml-2">›</Text>
            </View>
          </PressableFeedback>

          

          {/* Age Row */}
          <View className="flex-row items-center justify-between py-3 px-3">
            <Text className="text-[17px] text-foreground font-normal">Age</Text>
            <Text className="text-[17px] text-muted font-normal">
              {age ? `${age} years old` : "Not set"}
            </Text>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View className="gap-3 mb-8">
          <Button
            variant="secondary"
            size="lg"
            onPress={handleSignOut}
          >
            <Button.Label>Sign Out</Button.Label>
          </Button>

          <Button
            variant="danger-soft"
            size="lg"
            onPress={handleDeleteAccount}
          >
            <Button.Label className="text-[17px] font-normal text-danger">
              Delete account
            </Button.Label>
          </Button>
        </View>
      </LargeTitleScrollView>

      {/* Date Picker Modal */}
      <DatePickerComponent
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => {
          setBirthday(date);
          setBirthdayText(
            date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          );
        }}
        initialDate={birthday || new Date(2003, 8, 23)}
      />
    </>
  );
}

// Add header right button for Save
AccountDetailsModal.options = {
  headerRight: () => {
    // This will be handled by the layout
    return null;
  },
};
