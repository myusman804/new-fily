import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const TOKEN_KEY = "auth_token"
const USER_DATA_KEY = "user_data"

export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(TOKEN_KEY, token)
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token)
    }
  } catch (error) {
    console.error("Error saving auth token:", error)
    throw error
  }
}

export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(TOKEN_KEY)
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY)
    }
  } catch (error) {
    console.error("Error getting auth token:", error)
    return null
  }
}

export const saveUserData = async (userData: any): Promise<void> => {
  try {
    const userDataString = JSON.stringify(userData)
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(USER_DATA_KEY, userDataString)
    } else {
      await SecureStore.setItemAsync(USER_DATA_KEY, userDataString)
    }
    console.log("✅ User data saved:", userData)
  } catch (error) {
    console.error("❌ Saving user data failed:", error)
    throw error
  }
}

export const getUserData = async (): Promise<any | null> => {
  try {
    let userData: string | null
    if (Platform.OS === "web") {
      userData = await AsyncStorage.getItem(USER_DATA_KEY)
    } else {
      userData = await SecureStore.getItemAsync(USER_DATA_KEY)
    }

    if (userData) {
      const parsed = JSON.parse(userData)
      console.log("🔁 User data retrieved:", parsed)
      return parsed
    }
    return null
  } catch (error) {
    console.error("❌ Retrieving user data failed:", error)
    return null
  }
}

export const removeAuthToken = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(TOKEN_KEY)
      await AsyncStorage.removeItem(USER_DATA_KEY)
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
      await SecureStore.deleteItemAsync(USER_DATA_KEY)
    }
    console.log("🗑️ Token and user data removed")
  } catch (error) {
    console.error("Error removing auth token:", error)
    throw error
  }
}

export const removeUserData = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(USER_DATA_KEY)
    } else {
      await SecureStore.deleteItemAsync(USER_DATA_KEY)
    }
    console.log("🗑️ User data removed")
  } catch (error) {
    console.error("❌ Removing user data failed:", error)
    throw error
  }
}
