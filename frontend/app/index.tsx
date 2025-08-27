"use client"

import { useEffect } from "react"
import { router } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import { storage } from "@/utils/storage"

export default function IndexPage() {
  useEffect(() => {

    const checkAuth = async () => {
      try {
        const token = await storage.getItem("authToken")
        if (token) {
          router.replace("/(tabs)/overview")
        } else {
          router.replace("/login")
        }
      } catch (error) {
        router.replace("/login")
      }
    }

    checkAuth()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  )
}
