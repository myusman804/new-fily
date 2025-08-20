export const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000/api/auth"

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
  return BACKEND_BASE_URL
}

export async function registerUser(data: { name: string; email: string; password: string }) {
  return makeRequest(`${BACKEND_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function verifyOtp(data: { email: string; otp: string }) {
  return makeRequest(`${BACKEND_BASE_URL}/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function resendOtp(data: { email: string }) {
  return makeRequest(`${BACKEND_BASE_URL}/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function loginUser(data: { email: string; password: string }) {
  return makeRequest(`${BACKEND_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function logoutUser() {
  const token = await import("./auth-storage").then((m) => m.getAuthToken())
  return makeRequest(`${BACKEND_BASE_URL}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function getDashboardData() {
  const token = await import("./auth-storage").then((m) => m.getAuthToken())
  return makeRequest(`${BACKEND_BASE_URL}/dashboard`, {
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
      `${BACKEND_BASE_URL}/test`,
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
