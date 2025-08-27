import { getAuthToken } from "./auth-storage"

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.98.122:3000"

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
  const token = await getAuthToken()
  return makeRequest(`${getBaseApiUrl()}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function getDashboardData() {
  const token = await getAuthToken()
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

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
  const token = await getAuthToken()
  return makeRequest(`${getBaseApiUrl()}/api/auths/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  })
}

export async function getAllPdfs() {
  const token = await getAuthToken()
  return makeRequest(`${getPdfApiUrl()}/all-pdfs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function searchAllPdfs(query: string) {
  const token = await getAuthToken()
  return makeRequest(`${getPdfApiUrl()}/search-all?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function getMyPdfs() {
  const token = await getAuthToken()
  return makeRequest(`${getPdfApiUrl()}/my-pdfs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function deletePdf(pdfId: string) {
  const token = await getAuthToken()
  return makeRequest(`${getPdfApiUrl()}/${pdfId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export async function uploadPdf(formData: FormData) {
  const token = await getAuthToken()
  return makeRequest(`${getPdfApiUrl()}/upload`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })
}

export async function updateUploadPaymentStatus() {
  const token = await getAuthToken()
  return makeRequest(`${getBaseApiUrl()}/update-upload-payment-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

export { getAuthToken } from "./auth-storage"
