"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/components/theme-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, CheckCircle, AlertCircle, Lock } from "lucide-react-native"
import { getUserData } from "@/lib/auth-storage"
import * as DocumentPicker from "expo-document-picker"
import PDFFormPage from "@/components/form"
import { useNavigation } from "@react-navigation/native"

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

export default function UploadPage() {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [hasPaidForUpload, setHasPaidForUpload] = useState<boolean>(false)
  const [showPDFForm, setShowPDFForm] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)

  const loadUserData = async () => {
    const userData = await getUserData()
    if (userData?.hasPaidForUpload) {
      setHasPaidForUpload(userData.hasPaidForUpload)
    }
  }

  const refreshUserData = async () => {
    try {
      const userData = await getUserData()
      if (userData) {
        setHasPaidForUpload(userData.hasPaidForUpload || false)
      }
      console.log("[v0] Refreshed user data, hasPaidForUpload:", userData?.hasPaidForUpload)
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  useEffect(() => {
    loadUserData()

    const unsubscribe = navigation.addListener("focus", () => {
      refreshUserData()
    })

    return unsubscribe
  }, [navigation])

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
        Please purchase upload access from the Payment tab to upload PDF documents
      </Text>
    </Card>
  )

  const calculatePrice = (sizeBytes: number): number => {
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
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      const file = result.assets[0]

      if (!file.name || !file.size) {
        Alert.alert("Error", "Invalid file selected. Please try again.")
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a PDF file smaller than 50MB.")
        return
      }

      setSelectedFile(file)
      setShowPDFForm(true)
    } catch (error) {
      Alert.alert("Error", "Failed to select file. Please try again.")
    }
  }

  const handleUploadComplete = (uploadedFile: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, uploadedFile])
  }

  const handleBackFromPDFForm = () => {
    setShowPDFForm(false)
    setSelectedFile(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle color={colors.primary} size={20} />
      case "error":
        return <AlertCircle color={colors.red} size={20} />
      default:
        return <Upload color={colors.primary} size={20} />
    }
  }

  const handleDownloadFile = (fileId: string) => {
    // Placeholder for download file logic
    Alert.alert("Download", `Downloading file with ID: ${fileId}`)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId))
  }

  if (showPDFForm && selectedFile) {
    return <PDFFormPage file={selectedFile} onBack={handleBackFromPDFForm} onUploadComplete={handleUploadComplete} />
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              backgroundColor: colors.cardBackground,
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
          </View>

          <ScrollView
            style={{ flex: 1, padding: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {!hasPaidForUpload ? (
              <>
                <LockedUploadArea />
                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                  onPress={refreshUserData}
                >
                  <Text style={[styles.refreshButtonText, { color: colors.textPrimary }]}>
                    Already paid? Refresh status
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Card
                  style={{
                    marginBottom: 24,
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.primary,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderRadius: 16,
                  }}
                >
                  <TouchableOpacity
                    onPress={handleFileSelect}
                    style={{
                      padding: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 200,
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24,
                      }}
                    >
                      <Upload color={colors.primary} size={40} />
                    </View>

                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: colors.textPrimary,
                        marginBottom: 8,
                        textAlign: "center",
                      }}
                    >
                      Upload PDF Document
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
                      Select a PDF file from your device and add details to share with your school community
                    </Text>

                    <Button
                      onPress={handleFileSelect}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 32,
                        paddingVertical: 16,
                        borderRadius: 12,
                      }}
                    >
                      Choose PDF File
                    </Button>

                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginTop: 16,
                        textAlign: "center",
                      }}
                    >
                      Supports PDF files up to 50MB • ₦0.10 per MB (min ₦0.50)
                    </Text>
                  </TouchableOpacity>
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
                      marginBottom: 16,
                    }}
                  >
                    Upload Guidelines
                  </Text>

                  <View style={{ gap: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 20 }}>
                      • Only PDF files are accepted for upload
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 20 }}>
                      • Maximum file size is 50MB per document
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 20 }}>
                      • Files should contain school-related educational content
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 20 }}>
                      • Inappropriate or copyrighted content will be removed
                    </Text>
                  </View>
                </Card>
              </>
            )}

            {hasPaidForUpload && uploadedFiles.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: 16,
                  }}
                >
                  Uploaded Files ({uploadedFiles.length})
                </Text>

                {uploadedFiles.map((file) => (
                  <Card
                    key={file.id}
                    style={{
                      marginBottom: 16,
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      padding: 20,
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
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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

                          {file.status === "completed" && (
                            <TouchableOpacity
                              onPress={() => handleDownloadFile(file.id)}
                              style={{
                                backgroundColor: colors.primary + "20",
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 8,
                                marginTop: 12,
                                alignSelf: "flex-start",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
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

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        {getStatusIcon(file.status)}
                        <TouchableOpacity
                          onPress={() => removeFile(file.id)}
                          style={{
                            padding: 8,
                            borderRadius: 6,
                          }}
                        >
                          <X color={colors.textSecondary} size={20} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
