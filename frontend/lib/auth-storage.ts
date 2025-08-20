import AsyncStorage from "@react-native-async-storage/async-storage"

const TOKEN_KEY = "auth_token"
const USER_DATA_KEY = "user_data"

export const saveAuthToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token)
    console.log("✅ Token saved:", token)
  } catch (error) {
    console.error("❌ Saving token failed:", error)
  }
}

export const saveUserData = async (userData: any) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
    console.log("✅ User data saved:", userData)
  } catch (error) {
    console.error("❌ Saving user data failed:", error)
  }
}

export const getUserData = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY)
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

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY)
    console.log("🔁 Token retrieved:", token)
    return token
  } catch (error) {
    console.error("❌ Retrieving token failed:", error)
    return null
  }
}

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY)
    await AsyncStorage.removeItem(USER_DATA_KEY)
    console.log("🗑️ Token and user data removed")
  } catch (error) {
    console.error("❌ Removing token failed:", error)
  }
}

export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY)
    console.log("🗑️ User data removed")
  } catch (error) {
    console.error("❌ Removing user data failed:", error)
  }
}
