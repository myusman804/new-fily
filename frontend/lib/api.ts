import { getAuthToken } from "../lib/auth-storage" // Assuming
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

export function getPaymentApiUrl(): string {
  return `${BACKEND_BASE_URL}/api/payment`
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
  if (!token) {
    console.log("[v0] No auth token found for upload payment")
    return { error: true, message: "Please login again" }
  }

  console.log("[v0] Making upload payment request with token:", token.substring(0, 20) + "...")
  return makeRequest(`${getBaseApiUrl()}/update-upload-payment-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
}

export const processDownloadPayment = async (paymentData: { amount: number; currency?: string }) => {
  try {
    const token = await getAuthToken()
    console.log("[v0] processDownloadPayment - Token retrieved:", token ? token.substring(0, 20) + "..." : "No token")

    if (!token) {
      console.log("[v0] processDownloadPayment - No auth token found")
      return { error: true, message: "Please login again" }
    }

    console.log("[v0] processDownloadPayment - Making request to:", `${getPaymentApiUrl()}/download`)
    const response = await fetch(`${getPaymentApiUrl()}/download`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })

    console.log("[v0] processDownloadPayment - Response status:", response.status)
    const data = await response.json()
    console.log("[v0] processDownloadPayment - Response data:", data)
    return data
  } catch (error) {
    console.error("[v0] processDownloadPayment - Error:", error)
    return { error: true, message: "Failed to process payment" }
  }
}

export const getDownloadPaymentInfo = async () => {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${getPaymentApiUrl()}/download-info`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting download payment info:", error)
    return { error: true, message: "Failed to get payment info" }
  }
}

export const checkDownloadPaymentStatus = async () => {
  try {
    const token = await getAuthToken()
    console.log(
      "[v0] checkDownloadPaymentStatus - Token retrieved:",
      token ? token.substring(0, 20) + "..." : "No token",
    )

    if (!token) {
      console.log("[v0] checkDownloadPaymentStatus - No auth token found")
      return { error: true, message: "Please login again" }
    }

    const response = await fetch(`${getPaymentApiUrl()}/download-status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] checkDownloadPaymentStatus - Response status:", response.status)
    const data = await response.json()
    console.log("[v0] checkDownloadPaymentStatus - Response data:", data)

    return {
      ...data,
      hasPaid: data.hasPaidForDownload, // Map backend property to frontend expectation
    }
  } catch (error) {
    console.error("[v0] checkDownloadPaymentStatus - Error:", error)
    return { error: true, message: "Failed to check payment status" }
  }
}

export const downloadPaidPdf = async (pdfId: string) => {
  try {
    const token = await getAuthToken()
    console.log("[v0] downloadPaidPdf - Starting download for PDF:", pdfId)

    const response = await fetch(`${getPdfApiUrl()}/download-paid/${pdfId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("[v0] downloadPaidPdf - Response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.log("[v0] downloadPaidPdf - Error response:", errorData)
      throw new Error(errorData.message || "Download failed")
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get("Content-Disposition")
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : `document_${pdfId}.pdf`

    console.log("[v0] downloadPaidPdf - Download successful, filename:", filename)

    return {
      blob,
      filename,
      size: blob.size,
    }
  } catch (error) {
    console.error("[v0] downloadPaidPdf - Error:", error)
    throw error
  }
}
