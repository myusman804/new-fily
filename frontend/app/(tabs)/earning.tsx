"use client"

import { View, Text, StyleSheet, SafeAreaView, Animated, Alert, ScrollView } from "react-native"
import { useRef, useEffect, useState } from "react"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme, type ThemeContextType } from "@/components/theme-context"
import { CreditCard, Upload, CheckCircle, Star, Shield, Zap } from "lucide-react-native"
import { getUserData, saveUserData, getAuthToken } from "@/lib/auth-storage"
import { getBaseApiUrl } from "@/lib/api"

export default function PaymentTab() {
  const { colors } = useTheme()
  const themedStyles = getThemedStyles(colors)

  const [hasPaidForUpload, setHasPaidForUpload] = useState<boolean>(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false)
  const [authToken, setAuthToken] = useState<string>("")

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current
  const cardAnim1 = useRef(new Animated.Value(0)).current
  const cardAnim2 = useRef(new Animated.Value(0)).current
  const cardAnim3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await getUserData()
      if (userData?.hasUploadAccess) {
        setHasPaidForUpload(userData.hasUploadAccess)
      }

      const token = await getAuthToken()
      if (token) {
        setAuthToken(token)
      }
    }

    loadUserData()

    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(cardAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(cardAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(cardAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [headerAnim, cardAnim1, cardAnim2, cardAnim3])

  const headerAnimatedStyle = {
    opacity: headerAnim,
    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
  }

  const cardAnimatedStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
  })

  const handlePayment = async () => {
    setIsProcessingPayment(true)

    try {
      const response = await fetch(`${getBaseApiUrl()}/api/auth/update-payment-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const responseData = await response.json()
        setHasPaidForUpload(true)

        const userData = await getUserData()
        if (userData) {
          await saveUserData({ ...userData, hasUploadAccess: true })
        }

        Alert.alert("Success", "Payment processed successfully! You can now upload PDF files.")
      } else {
        const errorData = await response.json()
        Alert.alert("Payment Error", errorData.message || "Failed to process payment")
      }
    } catch (error) {
      console.log("[v0] Payment error:", error)
      Alert.alert("Payment Error", "Network error. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (hasPaidForUpload) {
    return (
      <SafeAreaView style={themedStyles.safeArea}>
        <Animated.View style={[themedStyles.header, headerAnimatedStyle]}>
          <Text style={themedStyles.headerTitle}>Upload Access</Text>
        </Animated.View>
        <View style={themedStyles.contentContainer}>
          <Animated.View style={[themedStyles.card, cardAnimatedStyle(cardAnim1)]}>
            <CardContent style={themedStyles.successContainer}>
              <View style={themedStyles.successIcon}>
                <CheckCircle color={colors.primary} size={64} />
              </View>
              <Text style={themedStyles.successTitle}>Upload Access Activated!</Text>
              <Text style={themedStyles.successDescription}>
                You now have unlimited access to upload and share PDF documents with your school community.
              </Text>
              <View style={themedStyles.featuresList}>
                <Text style={themedStyles.featureItem}>✓ Upload unlimited PDF files</Text>
                <Text style={themedStyles.featureItem}>✓ Share documents with classmates</Text>
                <Text style={themedStyles.featureItem}>✓ Organize files in folders</Text>
                <Text style={themedStyles.featureItem}>✓ Priority support</Text>
              </View>
            </CardContent>
          </Animated.View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      <ScrollView>
      <Animated.View style={[themedStyles.header, headerAnimatedStyle]}>
        <Text style={themedStyles.headerTitle}>Unlock PDF Upload</Text>
      </Animated.View>
      <View style={themedStyles.contentContainer}>
        <Animated.View style={[themedStyles.card, themedStyles.heroCard, cardAnimatedStyle(cardAnim1)]}>
          <CardContent style={themedStyles.heroContent}>
            <View style={themedStyles.heroIcon}>
              <Upload color={colors.primary} size={48} />
            </View>
            <Text style={themedStyles.heroTitle}>Premium PDF Upload</Text>
            <Text style={themedStyles.heroDescription}>
              Get unlimited access to upload and share PDF documents with your school community
            </Text>
            <View style={themedStyles.priceContainer}>
              <Text style={themedStyles.priceValue}>$9.99</Text>
              <Text style={themedStyles.priceDescription}>one-time payment</Text>
            </View>
          </CardContent>
        </Animated.View>

        <Animated.View style={[themedStyles.card, cardAnimatedStyle(cardAnim2)]}>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={themedStyles.featureRow}>
              <Zap color={colors.primary} size={20} />
              <Text style={themedStyles.featureText}>Upload unlimited PDF files</Text>
            </View>
            <View style={themedStyles.featureRow}>
              <Shield color={colors.primary} size={20} />
              <Text style={themedStyles.featureText}>Secure file sharing with classmates</Text>
            </View>
            <View style={themedStyles.featureRow}>
              <Star color={colors.primary} size={20} />
              <Text style={themedStyles.featureText}>Organize files in custom folders</Text>
            </View>
            <View style={themedStyles.featureRow}>
              <CheckCircle color={colors.primary} size={20} />
              <Text style={themedStyles.featureText}>Priority customer support</Text>
            </View>
          </CardContent>
        </Animated.View>

        <Animated.View style={[themedStyles.card, cardAnimatedStyle(cardAnim3)]}>
          <CardContent style={themedStyles.paymentContainer}>
            <Button
              onPress={handlePayment}
              disabled={isProcessingPayment}
              //@ts-ignore
              style={[themedStyles.paymentButton, { opacity: isProcessingPayment ? 0.7 : 1 }]}
            >
              <View style={themedStyles.buttonContent}>
                <CreditCard color={colors.white} size={20} />
                <Text style={themedStyles.buttonText}>
                  {isProcessingPayment ? "Processing..." : "Purchase Now - $9.99"}
                </Text>
              </View>
            </Button>
            <Text style={themedStyles.paymentNote}>Secure payment • One-time purchase • Instant access</Text>
          </CardContent>
        </Animated.View>
      </View>
      </ScrollView>
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
    heroCard: {
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.primary + "30",
    },
    heroContent: {
      alignItems: "center",
      paddingVertical: 32,
    },
    heroIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: "center",
    },
    heroDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },
    priceContainer: {
      alignItems: "center",
    },
    priceValue: {
      fontSize: 48,
      fontWeight: "bold",
      color: colors.primary,
    },
    priceDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
    },
    featureText: {
      fontSize: 16,
      color: colors.textPrimary,
      flex: 1,
    },
    paymentContainer: {
      paddingVertical: 24,
    },
    paymentButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    buttonText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: "600",
    },
    paymentNote: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    successContainer: {
      alignItems: "center",
      paddingVertical: 32,
    },
    successIcon: {
      marginBottom: 24,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 12,
      textAlign: "center",
    },
    successDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },
    featuresList: {
      gap: 8,
      alignSelf: "stretch",
    },
    featureItem: {
      fontSize: 16,
      color: colors.textPrimary,
      paddingVertical: 4,
    },
  })
