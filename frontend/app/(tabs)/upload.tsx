"use client"

import React, { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/components/theme-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, CheckCircle, AlertCircle, Coins, DollarSign, CreditCard, Lock } from "lucide-react-native"
import { getUserData, saveUserData } from "@/lib/auth-storage"
import * as DocumentPicker from "expo-document-picker"

interface UploadedFile {
  id: string
  name: string
  size: string
  sizeBytes: number
  uploadProgress: number
  status: "uploading" | "completed" | "error"
  price: number
}

export default function UploadPage() {
  const { colors } = useTheme()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [userCoins, setUserCoins] = useState<number>(0)
  const [hasPaidForUpload, setHasPaidForUpload] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false)

  React.useEffect(() => {
    const loadUserData = async () => {
      const userData = await getUserData()
      if (userData?.coins) {
        setUserCoins(userData.coins)
      }
      if (userData?.hasPaidForUpload) {
        setHasPaidForUpload(userData.hasPaidForUpload)
      }
    }
    loadUserData()
  }, [])

  const handlePayment = async () => {
    setIsProcessingPayment(true)

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Update user data to mark as paid
        const userData = await getUserData()
        const updatedUserData = {
          ...userData,
          hasPaidForUpload: true,
          coins: userData?.coins || 0, // Keep existing coins
        }

        await saveUserData(updatedUserData)
        setHasPaidForUpload(true)
        setShowPaymentModal(false)
        setIsProcessingPayment(false)

        Alert.alert("Payment Successful!", "You can now upload PDF files to the platform.")
      } catch (error) {
        setIsProcessingPayment(false)
        Alert.alert("Payment Failed", "Please try again.")
      }
    }, 2000)
  }

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
                //@ts-ignore
                color: colors.text,
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
                //@ts-ignore
                color: colors.text,
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
              one-time payment
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
                {isProcessingPayment ? "Processing Payment..." : "Pay $9.99 & Unlock"}
              </Text>
            </Button>

            {!isProcessingPayment && (
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
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
            )}
          </View>
        </Card>
      </View>
    </Modal>
  )

  const LockedUploadArea = () => (
    <Card
      style={{
        marginBottom: 24,
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
        borderWidth: 2,
        borderRadius: 12,
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
          //@ts-ignore
          color: colors.text,
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
            //@ts-ignore
            color: colors.primaryForeground,
            fontWeight: "600",
            fontSize: 16,
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

      // Check file size limit (10MB)
      if (file.size > 10 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a PDF file smaller than 10MB.")
        return
      }

      const price = calculatePrice(file.size)
      console.log("[v0] Calculated price:", price)

      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        uploadProgress: 0,
        status: "uploading",
        price: price,
      }

      console.log("[v0] Adding new file:", newFile)
      setUploadedFiles((prev) => [...prev, newFile])

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === newFile.id ? { ...f, uploadProgress: Math.min(f.uploadProgress + 20, 100) } : f)),
        )
      }, 500)

      // Complete upload after 3 seconds
      setTimeout(() => {
        clearInterval(interval)
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === newFile.id ? { ...f, uploadProgress: 100, status: "completed" } : f)),
        )
        console.log("[v0] File upload completed")
      }, 3000)
    } catch (error) {
      console.error("[v0] Error picking document:", error)
      //@ts-ignore
      Alert.alert("Error", `Failed to select document: ${error.message || "Unknown error"}. Please try again.`)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleUploadAll = () => {
    const completedFiles = uploadedFiles.filter((file) => file.status === "completed")
    const totalPrice = completedFiles.reduce((sum, file) => sum + file.price, 0)

    Alert.alert("Upload Files", `Upload ${completedFiles.length} file(s) for $${totalPrice.toFixed(2)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Upload",
        onPress: () => {
          // Here you would integrate with your backend
          Alert.alert("Success", "Files uploaded successfully!")
          setUploadedFiles([])
        },
      },
    ])
  }

  const getTotalPrice = (): number => {
    return uploadedFiles.filter((file) => file.status === "completed").reduce((sum, file) => sum + file.price, 0)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        //@ts-ignore
        return <CheckCircle color={colors.success || "#10b981"} size={20} />
      case "error":
        //@ts-ignore
        return <AlertCircle color={colors.destructive} size={20} />
      default:
        return <Upload color={colors.primary} size={20} />
    }
  }

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
            //@ts-ignore
            color: colors.text,
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
                    //@ts-ignore
                    color: colors.text,
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
                  Choose from your device
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
                        //@ts-ignore
                      color: colors.primaryForeground,
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
                  Supports PDF files up to 10MB
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
              //@ts-ignore
              color: colors.text,
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
              //@ts-ignore
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Upload Guidelines
          </Text>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Only PDF files are accepted</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>• Maximum file size: 10MB</Text>
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
                  //@ts-ignore
                  color: colors.text,
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
                          //@ts-ignore
                          color: colors.text,
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
                    //@ts-ignore
                    color: colors.primaryForeground,
                    fontWeight: "600",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  Upload All Files (${getTotalPrice().toFixed(2)})
                </Text>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      <PaymentModal />
    </SafeAreaView>
  )
}
