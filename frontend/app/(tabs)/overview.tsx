"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { testConnection } from "@/lib/api"
import { SafeAreaView } from "react-native-safe-area-context"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "@/components/theme-context"
import type { ThemeContextType } from "@/components/theme-context"
import { getAuthToken, getUserData } from "@/lib/auth-storage"

export default function OverviewTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { colors } = useTheme()

  const isLoadingRef = useRef(false)

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current
  const cardAnim1 = useRef(new Animated.Value(0)).current
  const cardAnim2 = useRef(new Animated.Value(0)).current
  const cardAnim3 = useRef(new Animated.Value(0)).current
  const cardAnim4 = useRef(new Animated.Value(0)).current

  const getUserDataFromToken = async () => {
    try {
      const token = await getAuthToken()
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        console.log("[v0] JWT Token payload:", JSON.stringify(payload, null, 2))

        const userData = {
          id: payload.userId || payload.user?.id || payload.id,
          email: payload.email || payload.user?.email || "user@example.com",
          name: payload.name || payload.user?.name || payload.username || "User",
        }

        console.log("[v0] Extracted user data:", userData)
        return userData
      }
    } catch (error) {
      console.log("[v0] Error decoding token:", error)
    }
    return null
  }

  const fetchDashboardData = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log("[v0] Request already in progress, skipping...")
      return
    }

    isLoadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting dashboard data fetch...")

      const storedUserData = await getUserData()

      if (storedUserData) {
        console.log("[v0] Using stored user data from login:", storedUserData)
        const dashboardData = {
          user: {
            name: storedUserData.name,
            email: storedUserData.email,
            coins: storedUserData.coins,
          },
          earnings: {
            total: null,
            thisMonth: null,
          },
          campaigns: {
            active: null,
            total: null,
          },
        }

        setData(dashboardData)
        toast({
          title: "Welcome back!",
          description: `Hello ${storedUserData.name}! Your dashboard is ready.`,
          variant: "success",
        })
        return
      }

      console.log("[v0] No stored user data, trying JWT token...")
      const userData = await getUserDataFromToken()

      if (userData) {
        const fallbackData = {
          user: {
            name: userData.name,
            email: userData.email,
            coins: null,
          },
          earnings: { total: null, thisMonth: null },
          campaigns: { active: null, total: null },
        }

        setData(fallbackData)
        toast({
          title: "Dashboard Ready",
          description: "Using account information from your session.",
          variant: "info",
        })
      } else {
        throw new Error("No user data available")
      }
    } catch (error: any) {
      console.log("[v0] Dashboard fetch error:", error.message)
      setError("Unable to load user data. Please try logging in again.")
      toast({
        title: "Data Error",
        description: "Please log in again to refresh your data.",
        //@ts-ignore
        variant: "error",
      })
      router.replace("/login")
    } finally {
      setLoading(false)
      isLoadingRef.current = false

      setTimeout(() => {
        if (!error) {
          Animated.stagger(100, [
            Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(cardAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(cardAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(cardAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(cardAnim4, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start()
        }
      }, 100)
    }
  }, [toast, router])

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      const result = await testConnection()
      if (result.success) {
        toast({
          title: "Connection Success",
          description: result.message,
          variant: "success",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: `${result.message}\n\nSuggestions:\n${result.suggestions?.join("\n")}`,
          //@ts-ignore
          variant: "error",
        })
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Unable to test connection",
        //@ts-ignore
        variant: "error",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    return () => {
      isLoadingRef.current = false
    }
  }, []) // Removed fetchDashboardData from dependencies to prevent infinite loop

  const themedStyles = getThemedStyles(colors)

  if (loading) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.loadingText}>Loading dashboard...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={themedStyles.errorContainer}>
        <Text style={themedStyles.errorTitle}>Connection Error</Text>
        <Text style={themedStyles.errorText}>{error}</Text>
        <Text style={themedStyles.errorHint}>
          Make sure your backend server is running on:
          {"\n"}http://192.168.180.122:3000
        </Text>
        <View style={themedStyles.buttonContainer}>
          <TouchableOpacity
            style={[themedStyles.retryButton, themedStyles.testButton]}
            onPress={handleTestConnection}
            disabled={testingConnection}
          >
            <Text style={themedStyles.retryButtonText}>{testingConnection ? "Testing..." : "Test Connection"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={themedStyles.retryButton} onPress={fetchDashboardData}>
            <Text style={themedStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
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
        <Text style={themedStyles.headerTitle}>AdsMoney Dashboard</Text>
        <View style={themedStyles.headerCoinBalance}>
          <Text style={themedStyles.coinIcon}>🪙</Text>
          <Text style={themedStyles.headerCoinText}>{data?.user?.coins || "0"}</Text>
        </View>
      </Animated.View>
      <View style={themedStyles.contentContainer}>
        <Animated.View style={[themedStyles.card, themedStyles.welcomeCard, cardAnimatedStyle(cardAnim1)]}>
          <CardHeader>
            <CardTitle>Welcome, {data?.user?.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={themedStyles.cardContentText}>Your journey to maximizing ad revenue starts here.</Text>
            <Text style={themedStyles.cardDescriptionText}>
              Explore your performance metrics and manage your campaigns.
            </Text>
          </CardContent>
        </Animated.View>

        <Animated.View style={[themedStyles.metricCard, themedStyles.coinCard, cardAnimatedStyle(cardAnim2)]}>
          <CardHeader>
            <CardTitle style={themedStyles.coinTitle}>💰 Coin Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={themedStyles.coinValue}>{data?.user?.coins}</Text>
            <Text style={themedStyles.metricDescription}>Available coins</Text>
          </CardContent>
        </Animated.View>

        <Animated.View style={[themedStyles.metricCard, cardAnimatedStyle(cardAnim3)]}>
          <CardHeader>
            <CardTitle style={themedStyles.metricTitle}>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={themedStyles.metricValue}>
              {data?.earnings?.total ? `$${data.earnings.total.toFixed(2)}` : "No data"}
            </Text>
            <Text style={themedStyles.metricDescription}>All time</Text>
          </CardContent>
        </Animated.View>

        <Animated.View style={[themedStyles.metricCard, cardAnimatedStyle(cardAnim4)]}>
          <CardHeader>
            <CardTitle style={themedStyles.metricTitle}>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={themedStyles.metricValue}>
              {data?.campaigns?.active !== null ? data.campaigns.active : "No data"}
            </Text>
            <Text style={themedStyles.metricDescription}>Currently running</Text>
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
      paddingTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 16,
      textAlign: "center",
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 16,
    },
    errorHint: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
      fontFamily: "monospace",
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    testButton: {
      backgroundColor: colors.textSecondary,
    },
    retryButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
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
    contentContainer: {
      flex: 1,
      paddingHorizontal: 16,
      gap: 16,
    },
    card: {
      width: "100%",
    },
    welcomeCard: {
      marginBottom: 8,
    },
    cardContentText: {
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    cardDescriptionText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    metricCard: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    coinCard: {
      backgroundColor: colors.primary + "10",
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    metricTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    coinTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.primary,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.primary,
    },
    coinValue: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.primary,
    },
    metricDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    buttonContainer: {
      flexDirection: "row",
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
    coinIcon: {
      fontSize: 16,
    },
  })
