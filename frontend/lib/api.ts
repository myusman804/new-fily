function getBackendUrl(): string {
  // In Next.js, only NEXT_PUBLIC_ prefixed variables are available in the browser
  if (typeof window !== "undefined") {
    // Client-side: use NEXT_PUBLIC_ prefixed variables
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.98.122:3000"
  } else {
    // Server-side: can access any environment variable
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.98.122:3000"
  }
}

export const BACKEND_BASE_URL = getBackendUrl()

async function makeRequestWithTimeout(url: string, options: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - please check your connection")
    }
    throw error
  }
}

async function makeRequest(url: string, options: RequestInit) {
  try {
    console.log(`[v0] Making request to: ${url}`)
    const response = await makeRequestWithTimeout(url, options, 10000)
    console.log(`[v0] Response status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[v0] Response data:`, data)
    return data
  } catch (error) {
    console.error(`[v0] Network request failed for ${url}:`, error)

    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("Network request failed") ||
        error.message.includes("fetch") ||
        error.name === "TypeError")

    return {
      error: true,
      message: isNetworkError
        ? "Cannot connect to server. Please check if the backend is running."
        : error instanceof Error
          ? error.message
          : "Request failed",
      details: `Failed to connect to ${BACKEND_BASE_URL}`,
      networkError: isNetworkError,
      url: url,
    }
  }
}

export function getBaseApiUrl(): string {
  return `${BACKEND_BASE_URL}/api/auth`
}

export function getPdfApiUrl(): string {
  return `${BACKEND_BASE_URL}/api/pdf`
}

export async function registerUser(data: { name: string; email: string; password: string }) {
  return makeRequest(`${getBaseApiUrl()}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function verifyOtp(data: { email: string; otp: string }) {
  return makeRequest(`${getBaseApiUrl()}/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function resendOtp(data: { email: string }) {
  return makeRequest(`${getBaseApiUrl()}/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function loginUser(data: { email: string; password: string }) {
  return makeRequest(`${getBaseApiUrl()}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function logoutUser() {
  const token = getAuthToken()
  return makeRequest(`${getBaseApiUrl()}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function getDashboardData() {
  const token = getAuthToken()
  return makeRequest(`${getBaseApiUrl()}/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function testConnection() {
  try {
    console.log(`[v0] Testing connection to: ${BACKEND_BASE_URL}`)
    const response = await makeRequestWithTimeout(
      `${getBaseApiUrl()}/test`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
      5000,
    )

    return {
      success: true,
      message: "Backend server is reachable",
      url: BACKEND_BASE_URL,
    }
  } catch (error) {
    console.error(`[v0] Connection test failed:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
      url: BACKEND_BASE_URL,
      suggestions: [
        "Check if backend server is running",
        "Verify IP address is correct",
        "Check network connectivity",
        "Try restarting the backend server",
      ],
    }
  }
}

const TOKEN_KEY = "auth_token"
const USER_DATA_KEY = "user_data"

export const saveAuthToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    console.log("✅ Token saved:", token)
  } catch (error) {
    console.error("❌ Saving token failed:", error)
  }
}

export const saveUserData = (userData: any) => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
    console.log("✅ User data saved:", userData)
  } catch (error) {
    console.error("❌ Saving user data failed:", error)
  }
}

export const getUserData = (): any | null => {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY)
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

export const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    console.log("🔁 Token retrieved:", token)
    return token
  } catch (error) {
    console.error("❌ Retrieving token failed:", error)
    return null
  }
}

export const removeAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    console.log("🗑️ Token and user data removed")
  } catch (error) {
    console.error("❌ Removing token failed:", error)
  }
}

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
  const token = await import("./auth-storage").then((m) => m.getAuthToken())
  return makeRequest(`${BACKEND_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  })
}

export const removeUserData = () => {
  try {
    localStorage.removeItem(USER_DATA_KEY)
    console.log("🗑️ User data removed")
  } catch (error) {
    console.error("❌ Removing user data failed:", error)
  }
}
