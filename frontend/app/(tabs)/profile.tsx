"use client"

import { View, Text, StyleSheet, SafeAreaView, Switch, Animated, TouchableOpacity } from "react-native"
import { useRef, useEffect, useState } from "react"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useTheme, type ThemeContextType } from "@/components/theme-context"
import { Button } from "@/components/ui/button"
import { logoutUser } from "@/lib/api"
import { removeAuthToken, getUserData, removeUserData } from "@/lib/auth-storage"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "expo-router"
import { LogOut, User, Mail, Lock, Edit } from "lucide-react-native"

interface UserData {
  id: string
  name: string
  email: string
  coins: number
}

export default function ProfileTab() {
  const { theme, resolvedTheme, toggleTheme, setTheme, colors } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const themedStyles = getThemedStyles(colors)

  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const headerAnim = useRef(new Animated.Value(0)).current
  const cardAnim1 = useRef(new Animated.Value(0)).current
  const cardAnim2 = useRef(new Animated.Value(0)).current
  const cardAnim3 = useRef(new Animated.Value(0)).current

  const loadUserData = async () => {
    try {
      const storedUserData = await getUserData()
      if (storedUserData) {
        setUserData(storedUserData)
      }
    } catch (error) {
      console.log("[v0] Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserData()

    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(cardAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(cardAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(cardAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [headerAnim, cardAnim1, cardAnim2, cardAnim3])

  const handleLogout = async () => {
    try {
      const result = await logoutUser()

      await removeAuthToken()
      await removeUserData()

      toast({
        title: "Logged Out",
        description: result.message || "You have been successfully logged out.",
        variant: "success",
      })

      router.replace("/login")
    } catch (error: any) {
      await removeAuthToken()
      await removeUserData()

      toast({
        title: "Logged Out",
        description: "You have been logged out locally.",
        variant: "success",
      })

      router.replace("/login")
    }
  }

  const headerAnimatedStyle = {
    opacity: headerAnim,
    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
  }

  const cardAnimatedStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
  })

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      <Animated.View style={[themedStyles.header, headerAnimatedStyle]}>
        <Text style={themedStyles.headerTitle}>Your Profile</Text>
        <View style={themedStyles.headerRight}>
          <View style={themedStyles.headerCoinBalance}>
            <Text style={themedStyles.coinIcon}>🪙</Text>
            <Text style={themedStyles.headerCoinText}>{loading ? "..." : userData?.coins?.toString() || "0"}</Text>
          </View>
          <Button onPress={handleLogout} variant="link" style={themedStyles.logoutButton}>
            <LogOut color={colors.red} size={24} />
          </Button>
        </View>
      </Animated.View>
      <View style={themedStyles.contentContainer}>
        <Animated.View style={[themedStyles.card, cardAnimatedStyle(cardAnim1)]}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={themedStyles.profileItem}>
              <User color={colors.textSecondary} size={20} />
              <Text style={themedStyles.profileLabel}>Name:</Text>
              <Text style={themedStyles.profileValue}>
                {loading ? "Loading..." : userData?.name || "No name available"}
              </Text>
            </View>
            <View style={themedStyles.profileItem}>
              <Mail color={colors.textSecondary} size={20} />
              <Text style={themedStyles.profileLabel}>Email:</Text>
              <Text style={themedStyles.profileValue}>
                {loading ? "Loading..." : userData?.email || "No email available"}
              </Text>
            </View>
            <View style={themedStyles.profileItem}>
              <Text style={themedStyles.coinIcon}>🪙</Text>
              <Text style={themedStyles.profileLabel}>Coins:</Text>
              <Text style={themedStyles.profileValue}>
                {loading ? "Loading..." : userData?.coins?.toString() || "0"}
              </Text>
            </View>
            <TouchableOpacity
              style={themedStyles.editProfileIconButton}
              onPress={() => console.log("Edit Profile pressed")}
            >
              <Edit color={colors.primary} size={24} />
            </TouchableOpacity>
          </CardContent>
        </Animated.View>

        <Animated.View style={[themedStyles.card, cardAnimatedStyle(cardAnim2)]}>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={themedStyles.settingItem}>
              <Text style={themedStyles.settingLabel}>Dark Mode</Text>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                onValueChange={toggleTheme}
                value={resolvedTheme === "dark"}
              />
            </View>

            <View style={themedStyles.settingItem}>
              <Text style={themedStyles.settingLabel}>Theme Preference</Text>
              <View style={themedStyles.themeOptions}>
                <Text
                  style={[themedStyles.themeOption, theme === "light" && themedStyles.activeThemeOption]}
                  onPress={() => setTheme("light")}
                >
                  Light
                </Text>
                <Text
                  style={[themedStyles.themeOption, theme === "dark" && themedStyles.activeThemeOption]}
                  onPress={() => setTheme("dark")}
                >
                  Dark
                </Text>
                <Text
                  style={[themedStyles.themeOption, theme === "system" && themedStyles.activeThemeOption]}
                  onPress={() => setTheme("system")}
                >
                  System
                </Text>
              </View>
            </View>
          </CardContent>
        </Animated.View>

        <Animated.View style={[themedStyles.card, cardAnimatedStyle(cardAnim3)]}>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={themedStyles.securityItem}>
              <Lock color={colors.textSecondary} size={20} />
              <Text style={themedStyles.securityLabel}>Password</Text>
              <TouchableOpacity
                style={themedStyles.changePasswordButton}
                onPress={() => console.log("Change Password pressed")}
              >
                <Text style={themedStyles.changePasswordButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
            <View style={themedStyles.securityItem}>
              <Text style={themedStyles.securityLabel}>Two-Factor Authentication</Text>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                value={false}
                disabled={true}
              />
            </View>
          </CardContent>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

const getThemedStyles = (colors: ThemeContextType["colors"]) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 40,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.headerBorder,
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    logoutButton: {
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 16,
      gap: 16,
    },
    card: {
      width: "100%",
    },
    profileItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    profileLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textPrimary,
      minWidth: 70,
    },
    profileValue: {
      fontSize: 16,
      color: colors.textSecondary,
      flex: 1,
    },
    editProfileIconButton: {
      marginTop: 16,
      alignSelf: "flex-end",
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    themeOptions: {
      flexDirection: "row",
      gap: 10,
    },
    themeOption: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      fontSize: 14,
    },
    activeThemeOption: {
      backgroundColor: colors.primary,
      color: colors.white,
      borderColor: colors.primary,
    },
    securityItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    securityLabel: {
      fontSize: 16,
      color: colors.textPrimary,
      flex: 1,
    },
    changePasswordButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    changePasswordButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
    coinIcon: {
      fontSize: 16,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerCoinBalance: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "15",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    headerCoinText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
  })
