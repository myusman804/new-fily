"use client"

import React, { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/components/theme-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, CheckCircle, AlertCircle, Coins, DollarSign, CreditCard, Lock } from "lucide-react-native"
import { getUserData, saveUserData, getAuthToken } from "@/lib/auth-storage"
import * as DocumentPicker from "expo-document-picker"
import { Linking } from "react-native"
import { getPdfApiUrl, getBaseApiUrl } from "../../lib/api"

interface UploadedFile {
  id: string
  name: string
  size: string
  sizeBytes: number
  uploadProgress: number
  status: "uploading" | "completed" | "error"
  price: number
  downloadLink?: string
}

interface PDFFormData {
  title: string
  course: string
  level: string
  topic: string
  year: string
  file: any
}

export default function UploadPage() {
  const { colors } = useTheme()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [userCoins, setUserCoins] = useState<number>(0)
  const [hasPaidForUpload, setHasPaidForUpload] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false)
  const [authToken, setAuthToken] = useState<string>("")

  const [formData, setFormData] = useState<PDFFormData>({
    title: "",
    course: "",
    level: "",
    topic: "",
    year: "",
    file: null,
  })
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false)

  React.useEffect(() => {
    const loadUserData = async () => {
      const userData = await getUserData()
      if (userData?.coins) {
        setUserCoins(userData.coins)
      }
      if (userData?.hasPaidForUpload) {
        setHasPaidForUpload(userData.hasPaidForUpload)
      }

      const token = await getAuthToken()
      if (token) {
        setAuthToken(token)
        console.log("[v0] Auth token loaded successfully")
      } else {
        console.log("[v0] No auth token found")
      }
    }

    loadUserData()
  }, [])

  const PaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => !isProcessingPayment && setShowPaymentModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            padding: 24,
            borderRadius: 16,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <CreditCard color={colors.primary} size={32} />
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.textPrimary,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Unlock PDF Upload
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Get unlimited access to upload and share PDF documents with your school community
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.background,
              padding: 16,
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Premium Features:
            </Text>
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✓ Upload unlimited PDF files</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✓ Share documents with classmates</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✓ Organize files in folders</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✓ Priority support</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: colors.primary,
              }}
            >
              $9.99
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginLeft: 8,
              }}
            >
              one-time
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <Button
              onPress={handlePayment}
              disabled={isProcessingPayment}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 8,
                opacity: isProcessingPayment ? 0.7 : 1,
              }}
            >
              <Text
                style={{
                  //@ts-ignore
                  color: colors.primaryForeground,
                  fontWeight: "600",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                {isProcessingPayment ? "Processing..." : "Purchase Now"}
              </Text>
            </Button>

            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              disabled={isProcessingPayment}
              style={{
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 16,
                }}
              >
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
  )

  const handlePayment = async () => {
    setIsProcessingPayment(true)

    try {
      console.log("[v0] Processing payment...")

      const response = await fetch(`${getBaseApiUrl()}/update-payment-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ hasPaidForUpload: true }),
      })

      if (response.ok) {
        console.log("[v0] Payment successful")
        setHasPaidForUpload(true)
        setShowPaymentModal(false)

        // Update local storage
        const userData = await getUserData()
        if (userData) {
          await saveUserData({ ...userData, hasPaidForUpload: true })
        }

        Alert.alert("Success", "Payment processed successfully! You can now upload PDF files.")
      } else {
        const errorData = await response.json()
        console.log("[v0] Payment error:", errorData.message)
        Alert.alert("Payment Error", errorData.message || "Failed to process payment")
      }
    } catch (error) {
      console.log("[v0] Payment error:", error)
      Alert.alert("Payment Error", "Network error. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const LockedUploadArea = () => (
    <Card
      style={{
        marginBottom: 24,
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
        padding: 40,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.textSecondary + "20",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Lock color={colors.textSecondary} size={32} />
      </View>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        PDF Upload Locked
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 24,
          lineHeight: 22,
        }}
      >
        Unlock the ability to upload and share PDF documents with your school community
      </Text>

      <TouchableOpacity
        onPress={() => setShowPaymentModal(true)}
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 8,
        }}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: colors.white,
            fontWeight: "600",
          }}
        >
          Unlock for $9.99
        </Text>
      </TouchableOpacity>
    </Card>
  )

  const calculatePrice = (sizeBytes: number): number => {
    // Price calculation: $0.10 per MB, minimum $0.50
    const sizeInMB = sizeBytes / (1024 * 1024)
    const basePrice = sizeInMB * 0.1
    return Math.max(basePrice, 0.5)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileSelect = async () => {
    try {
      console.log("[v0] Starting document picker...")

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      })

      console.log("[v0] Document picker result:", result)

      if (result.canceled) {
        console.log("[v0] User canceled document selection")
        return
      }

      if (!result.assets || result.assets.length === 0) {
        console.log("[v0] No assets in result")
        Alert.alert("Error", "No file was selected. Please try again.")
        return
      }

      const file = result.assets[0]
      console.log("[v0] Selected file:", file)

      // Check if file exists and has required properties
      if (!file.name || !file.size) {
        console.log("[v0] File missing required properties:", { name: file.name, size: file.size })
        Alert.alert("Error", "Invalid file selected. Please try again.")
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a PDF file smaller than 50MB.")
        return
      }

      // Set the file in form data and show the form
      setFormData((prev) => ({ ...prev, file }))
      setShowUploadForm(true)
    } catch (error) {
      console.log("[v0] Error selecting file:", error)
      Alert.alert("Error", "Failed to select file. Please try again.")
    }
  }

  const handleFormSubmit = async () => {
    // Validate form
    if (
      !formData.title.trim() ||
      !formData.course.trim() ||
      !formData.level.trim() ||
      !formData.topic.trim() ||
      !formData.year.trim() ||
      !formData.file
    ) {
      Alert.alert("Error", "Please fill in all fields and select a PDF file.")
      return
    }

    const price = calculatePrice(formData.file.size)
    console.log("[v0] Calculated price:", price)

    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: formData.file.name,
      size: formatFileSize(formData.file.size),
      sizeBytes: formData.file.size,
      uploadProgress: 0,
      status: "uploading",
      price: price,
    }

    console.log("[v0] Adding new file:", newFile)
    setUploadedFiles((prev) => [...prev, newFile])
    setShowUploadForm(false)

    // Start upload
    await uploadFile(formData.file, newFile.id, formData)
  }

  const uploadFile = async (file: any, fileId: string, pdfDetails: PDFFormData) => {
    try {
      console.log("[v0] Starting file upload:", {
        uri: file.uri,
        type: file.mimeType || "application/pdf",
        name: file.name,
        size: file.size,
      })

      const uploadUrl = `${getPdfApiUrl()}/upload`
      console.log("[v0] Uploading to:", uploadUrl)

      if (!authToken) {
        console.log("[v0] Auth token missing")
        throw new Error("Authentication token not found")
      }

      const formData = new FormData()

      // Add PDF metadata to FormData
      formData.append("title", pdfDetails.title)
      formData.append("course", pdfDetails.course)
      formData.append("level", pdfDetails.level)
      formData.append("topic", pdfDetails.topic)
      formData.append("year", pdfDetails.year)

      const fileBlob = await fetch(file.uri).then((r) => r.blob())
      formData.append("file", fileBlob, file.name)

      console.log("[v0] FormData prepared with file and metadata")

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, uploadProgress: Math.min(f.uploadProgress + Math.random() * 15, 90) } : f,
          ),
        )
      }, 1000)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes timeout

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData, // Send FormData instead of JSON
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      clearInterval(progressInterval)

      console.log("[v0] Upload response status:", response.status)

      const responseData = await response.json()
      console.log("[v0] Upload response data:", responseData)

      if (response.ok) {
        console.log("[v0] Upload successful")
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  uploadProgress: 100,
                  status: "completed",
                  downloadLink: `${getPdfApiUrl()}/download/${responseData.pdf?._id}`,
                }
              : f,
          ),
        )
        Alert.alert("Success", "PDF uploaded successfully!")

        if (responseData.user?.coins !== undefined) {
          setUserCoins(responseData.user.coins)
          const userData = await getUserData()
          if (userData) {
            await saveUserData({ ...userData, coins: responseData.user.coins })
          }
        }
      } else {
        console.log("[v0] Upload failed:", responseData.message)
        setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f)))
        Alert.alert("Upload Error", responseData.message || "Failed to upload PDF")
      }
    } catch (error: any) {
      console.log("[v0] Upload error:", error)
      setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f)))

      if (error.name === "AbortError") {
        Alert.alert("Upload Error", "Upload timed out. Please try again with a smaller file.")
      } else if (error.message?.includes("Network request failed")) {
        Alert.alert("Upload Error", "Network connection failed. Please check your internet connection and try again.")
      } else {
        Alert.alert("Upload Error", error.message || "Failed to upload PDF")
      }
    }

    // Reset form
    setFormData({
      title: "",
      course: "",
      level: "",
      topic: "",
      year: "",
      file: null,
    })
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const getTotalPrice = (): number => {
    return uploadedFiles.reduce((total, file) => total + file.price, 0)
  }

  const handleUploadAll = () => {
    Alert.alert("Upload Complete", `All files uploaded successfully! Total cost: $${getTotalPrice().toFixed(2)}`)
  }

  const handleDownloadFile = async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId)
    if (file?.downloadLink) {
      try {
        console.log("[v0] Opening download link:", file.downloadLink)
        await Linking.openURL(file.downloadLink)
      } catch (error) {
        console.log("[v0] Error opening download link:", error)
        Alert.alert("Error", "Could not open download link")
      }
    } else {
      Alert.alert("Error", "Download link not available")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle color={colors.primary} size={20} />
      case "error":
        return <AlertCircle 
        //@ts-ignore
        color={colors.destructive} size={20} />
      default:
        return <Upload color={colors.primary} size={20} />
    }
  }

  const PDFDetailsForm = () => (
    <KeyboardAvoidingView>
      <Modal
        visible={showUploadForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUploadForm(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: 400,
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              padding: 24,
              borderRadius: 16,
              maxHeight: "80%",
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: colors.textPrimary,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                PDF Details
              </Text>

              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                    Title *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: colors.textPrimary,
                      backgroundColor: colors.background,
                    }}
                    placeholder="Enter document title"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.title}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                    Course *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: colors.textPrimary,
                      backgroundColor: colors.background,
                    }}
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.course}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, course: text }))}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                    Level *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: colors.textPrimary,
                      backgroundColor: colors.background,
                    }}
                    placeholder="e.g., Beginner, Intermediate, Advanced"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.level}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, level: text }))}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                    Topic *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: colors.textPrimary,
                      backgroundColor: colors.background,
                    }}
                    placeholder="e.g., Calculus, Quantum Physics, Organic Chemistry"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.topic}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, topic: text }))}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                    Year *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: colors.textPrimary,
                      backgroundColor: colors.background,
                    }}
                    placeholder="e.g., 2024, 2023"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.year}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, year: text }))}
                    keyboardType="numeric"
                  />
                </View>

                {formData.file && (
                  <View
                    style={{
                      backgroundColor: colors.background,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 4 }}>
                      Selected File:
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      {formData.file.name} ({formatFileSize(formData.file.size)})
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={() => setShowUploadForm(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFormSubmit}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "600" }}>Upload PDF</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: colors.textPrimary,
          }}
        >
          Upload Documents
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.cardBackground,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Coins color={colors.primary} size={16} />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: "600",
              color: colors.primary,
            }}
          >
            {userCoins}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {!hasPaidForUpload ? (
          <LockedUploadArea />
        ) : (
          <>
            {/* Upload Area */}
            <Card
              style={{
                marginBottom: 24,
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                borderWidth: 2,
                borderStyle: "dashed",
                borderRadius: 12,
              }}
            >
              <TouchableOpacity
                onPress={handleFileSelect}
                style={{
                  padding: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 200,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Upload color={colors.primary} size={32} />
                </View>

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Tap to select PDF files
                </Text>

                <Text
                  style={{
                    fontSize: 16,
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Choose from your device and fill in details
                </Text>

                <TouchableOpacity
                  onPress={handleFileSelect}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontWeight: "600",
                    }}
                  >
                    Choose Files
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  Supports PDF files up to 50MB
                </Text>
              </TouchableOpacity>
            </Card>
          </>
        )}

        <Card
          style={{
            marginBottom: 24,
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 12,
            }}
          >
            Pricing Information
          </Text>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• $0.10 per MB of file size</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Minimum charge: $0.50 per file</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Price calculated automatically</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Payment processed after upload</Text>
          </View>
        </Card>

        {/* Upload Guidelines */}
        <Card
          style={{
            marginBottom: 24,
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 12,
            }}
          >
            Upload Guidelines
          </Text>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Only PDF files are accepted</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Maximum file size: 50MB</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Files should be school-related content</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Inappropriate content will be removed</Text>
          </View>
        </Card>

        {hasPaidForUpload && uploadedFiles.length > 0 && (
          <View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.textPrimary,
                }}
              >
                Uploaded Files ({uploadedFiles.length})
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <DollarSign color={colors.primary} size={16} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.primary,
                    marginLeft: 4,
                  }}
                >
                  ${getTotalPrice().toFixed(2)}
                </Text>
              </View>
            </View>

            {uploadedFiles.map((file) => (
              <Card
                key={file.id}
                style={{
                  marginBottom: 12,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <FileText color={colors.primary} size={20} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "500",
                          color: colors.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        {file.name}
                      </Text>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                          }}
                        >
                          {file.size}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.primary,
                            fontWeight: "600",
                          }}
                        >
                          ${file.price.toFixed(2)}
                        </Text>
                      </View>

                      {file.status === "uploading" && (
                        <View style={{ marginTop: 8 }}>
                          <View
                            style={{
                              height: 4,
                              backgroundColor: colors.border,
                              borderRadius: 2,
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                height: "100%",
                                width: `${file.uploadProgress}%`,
                                backgroundColor: colors.primary,
                                borderRadius: 2,
                              }}
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.textSecondary,
                              marginTop: 4,
                            }}
                          >
                            {file.uploadProgress}% uploaded
                          </Text>
                        </View>
                      )}

                      {file.status === "completed" && (
                        <TouchableOpacity
                          onPress={() => handleDownloadFile(file.id)}
                          style={{
                            backgroundColor: colors.primary + "20",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                            marginTop: 8,
                            alignSelf: "flex-start",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.primary,
                              fontWeight: "600",
                            }}
                          >
                            Download
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {getStatusIcon(file.status)}
                    <TouchableOpacity
                      onPress={() => removeFile(file.id)}
                      style={{
                        padding: 4,
                        borderRadius: 4,
                      }}
                    >
                      <X color={colors.textSecondary} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}

            {uploadedFiles.some((file) => file.status === "completed") && (
              <Button
                onPress={handleUploadAll}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 8,
                  marginTop: 16,
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontWeight: "600",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  View All Files (${getTotalPrice().toFixed(2)})
                </Text>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      <PaymentModal />
      <PDFDetailsForm />
    </SafeAreaView>
  )
}
