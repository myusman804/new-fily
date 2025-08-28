"use client"

import { useState, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  type TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/components/theme-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, ArrowLeft, CheckCircle } from "lucide-react-native"
import { getAuthToken } from "@/lib/auth-storage"
import { getPdfApiUrl } from "@/lib/api"

interface PDFFormData {
  title: string
  course: string
  level: string
  topic: string
  year: string
  file: any
}

interface PDFFormPageProps {
  file: any
  onBack: () => void
  onUploadComplete: (uploadedFile: any) => void
}

export default function PDFFormPage({ file, onBack, onUploadComplete }: PDFFormPageProps) {
  const { colors } = useTheme()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form refs for keyboard navigation
  const courseRef = useRef<TextInput>(null)
  const levelRef = useRef<TextInput>(null)
  const topicRef = useRef<TextInput>(null)
  const yearRef = useRef<TextInput>(null)

  const [formData, setFormData] = useState<PDFFormData>({
    title: "",
    course: "",
    level: "",
    topic: "",
    year: "",
    file: file,
  })

  const calculatePrice = (sizeBytes: number): number => {
    const sizeInMB = sizeBytes / (1024 * 1024)
    const basePrice = sizeInMB * 0.1
    return Math.max(basePrice, 80)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFormSubmit = async () => {
    if (
      !formData.title.trim() ||
      !formData.course.trim() ||
      !formData.level.trim() ||
      !formData.topic.trim() ||
      !formData.year.trim() ||
      !formData.file
    ) {
      Alert.alert("Error", "Please fill in all fields.")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const authToken = await getAuthToken()
      if (!authToken) {
        throw new Error("Authentication token not found")
      }

      console.log("[v0] Starting upload process...")
      console.log("[v0] File info:", {
        name: formData.file.name,
        size: formData.file.size,
        uri: formData.file.uri,
        type: formData.file.type,
      })

      const uploadUrl = `${getPdfApiUrl()}/upload`
      console.log("[v0] Upload URL:", uploadUrl)

      const uploadFormData = new FormData()

      uploadFormData.append("title", formData.title)
      uploadFormData.append("course", formData.course)
      uploadFormData.append("level", formData.level)
      uploadFormData.append("topic", formData.topic)
      uploadFormData.append("year", formData.year)

      uploadFormData.append("file", {
        uri: formData.file.uri,
        type: formData.file.type || "application/pdf",
        name: formData.file.name,
      } as any)

      console.log("[v0] FormData prepared, making request...")

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 90))
      }, 1000)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("[v0] Request timeout")
        controller.abort()
      }, 300000)

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
        body: uploadFormData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", response.headers)

      const responseData = await response.json()
      console.log("[v0] Response data:", responseData)

      if (response.ok) {
        const uploadedFile = {
          id: Date.now().toString(),
          name: formData.file.name,
          size: formatFileSize(formData.file.size),
          sizeBytes: formData.file.size,
          uploadProgress: 100,
          status: "completed",
          price: calculatePrice(formData.file.size),
          downloadLink: `${getPdfApiUrl()}/download/${responseData.pdf?._id}`,
        }

        console.log("[v0] Upload successful!")
        Alert.alert("Success", "PDF uploaded successfully!", [
          {
            text: "OK",
            onPress: () => {
              onUploadComplete(uploadedFile)
              onBack()
            },
          },
        ])
      } else {
        throw new Error(responseData.message || `Server error: ${response.status}`)
      }
    } catch (error: any) {
      console.log("[v0] Upload error:", error)

      if (error.name === "AbortError") {
        Alert.alert("Upload Error", "Upload timed out. Please try again with a smaller file.")
      } else if (error.message?.includes("Network request failed") || error.message?.includes("fetch")) {
        Alert.alert(
          "Network Error",
          "Cannot connect to server. Please check:\n• Your internet connection\n• Server is running\n• API URL is correct",
        )
      } else if (error.message?.includes("Authentication")) {
        Alert.alert("Authentication Error", "Please log in again and try uploading.")
      } else {
        Alert.alert("Upload Error", `Failed to upload PDF: ${error.message}`)
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.headerBorder,
              backgroundColor: colors.cardBackground,
            }}
          >
            <Button 
            //@ts-ignore
            onPress={onBack} variant="ghost" style={{ marginRight: 12, padding: 8 }} disabled={isUploading}>
              <ArrowLeft color={colors.textPrimary} size={24} />
            </Button>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.textPrimary,
                flex: 1,
              }}
            >
              PDF Details
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1, padding: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* File Info Card */}
            <Card
              style={{
                marginBottom: 24,
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                padding: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <FileText color={colors.primary} size={24} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    {file.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    {formatFileSize(file.size)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.primary,
                      fontWeight: "600",
                    }}
                  >
                    Estimated cost: ₦{calculatePrice(file.size).toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Form Fields */}
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
                  marginBottom: 20,
                }}
              >
                Document Information
              </Text>

              <View style={{ gap: 20 }}>
                <Input
                  label="Title *"
                  placeholder="Enter document title"
                  value={formData.title}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => courseRef.current?.focus()}
                  editable={!isUploading}
                />

                <Input
                //@ts-ignore
                  ref={courseRef}
                  label="Course *"
                  placeholder="e.g., Mathematics, Physics, Chemistry"
                  value={formData.course}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, course: text }))}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => levelRef.current?.focus()}
                  editable={!isUploading}
                />

                <Input
                //@ts-ignore
                  ref={levelRef}
                  label="Level *"
                  placeholder="e.g., 100lvl, 200lvl, 300lvl, 400lvl"
                  value={formData.level}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, level: text }))}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => topicRef.current?.focus()}
                  editable={!isUploading}
                />

                <Input
                //@ts-ignore
                  ref={topicRef}
                  label="Topic *"
                  placeholder="e.g., Calculus, Quantum Physics, Organic Chemistry"
                  value={formData.topic}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, topic: text }))}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => yearRef.current?.focus()}
                  editable={!isUploading}
                />

                <Input
                //@ts-ignore
                  ref={yearRef}
                  label="semester *"
                  placeholder="e.g., 1st, 2nd, 3rd, 4th"
                  value={formData.year}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, year: text }))}
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                  editable={!isUploading}
                />
              </View>
            </Card>

            {/* Upload Progress */}
            {isUploading && (
              <Card
                style={{
                  marginBottom: 24,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  padding: 20,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <CheckCircle color={colors.primary} size={20} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginLeft: 8,
                    }}
                  >
                    Uploading PDF...
                  </Text>
                </View>

                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.border,
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${uploadProgress}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  {Math.round(uploadProgress)}% completed
                </Text>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              onPress={handleFormSubmit}
              disabled={isUploading}
              style={{
                backgroundColor: isUploading ? colors.textSecondary : colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
              }}
            >
              {isUploading ? "Uploading..." : "Upload PDF"}
            </Button>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
