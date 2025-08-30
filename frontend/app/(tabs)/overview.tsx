"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/components/theme-context"
import {
  getAllPdfs,
  searchAllPdfs,
  deletePdf,
  checkDownloadPaymentStatus,
  processDownloadPayment,
  downloadPaidPdf,
} from "@/lib/api"

interface PDF {
  _id: string
  title: string
  course: string
  level: string
  topic: string
  year: string
  fileName: string
  originalName: string
  fileSize: number
  uploadDate: string
  status: string
  uploader?: {
    name: string
    email: string
  }
}

export default function OverviewPage() {
  const [pdfs, setPdfs] = useState<PDF[]>([])
  const [filteredPdfs, setFilteredPdfs] = useState<PDF[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [hasDownloadAccess, setHasDownloadAccess] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const { colors } = useTheme()

  const checkPaymentStatus = async () => {
    try {
      console.log("[v0] Checking payment status...")
      const response = await checkDownloadPaymentStatus()
      console.log("[v0] Payment status response:", response)

      if (!response.error) {
        setHasDownloadAccess(response.hasPaid || response.hasPaidForDownload || false)
        console.log("[v0] Download access status:", response.hasPaid || response.hasPaidForDownload)
      } else {
        console.log("[v0] Payment status check failed:", response.message)
      }
    } catch (error) {
      console.error("[v0] Error checking payment status:", error)
    }
  }

  const fetchPdfs = async () => {
    try {
      console.log("[v0] Fetching all PDFs...")
      const response = await getAllPdfs()

      if (response.error) {
        throw new Error(response.message)
      }

      console.log("[v0] PDFs fetched:", response)
      setPdfs(response.pdfs || [])
      setFilteredPdfs(response.pdfs || [])
    } catch (error) {
      console.error("Error fetching PDFs:", error)
      Alert.alert("Error", "Failed to load PDFs")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.trim()) {
      try {
        const response = await searchAllPdfs(query)
        if (response.error) {
          throw new Error(response.message)
        }
        setFilteredPdfs(response.pdfs || [])
      } catch (error) {
        console.error("Search error:", error)
        filterPdfs(query, selectedFilter)
      }
    } else {
      filterPdfs(query, selectedFilter)
    }
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter)
    filterPdfs(searchQuery, filter)
  }

  const filterPdfs = (query: string, filter: string) => {
    let filtered = pdfs

    if (query.trim()) {
      filtered = filtered.filter(
        (pdf) =>
          pdf.title.toLowerCase().includes(query.toLowerCase()) ||
          pdf.course.toLowerCase().includes(query.toLowerCase()) ||
          pdf.topic.toLowerCase().includes(query.toLowerCase()) ||
          (pdf.uploader && pdf.uploader.name.toLowerCase().includes(query.toLowerCase())),
      )
    }

    if (filter !== "all") {
      filtered = filtered.filter((pdf) => pdf.level.toLowerCase() === filter.toLowerCase())
    }

    setFilteredPdfs(filtered)
  }

  const handleDownload = async (pdfId: string, fileName: string) => {
    if (!hasDownloadAccess) {
      Alert.alert(
        "Download Access Required",
        "You need to purchase download access to download PDFs from other users. This is a one-time payment of $9.99.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Purchase Access",
            onPress: () => handlePurchaseDownloadAccess(),
          },
        ],
      )
      return
    }

    try {
      setCheckingPayment(true)
      console.log("[v0] Starting download for PDF:", pdfId)

      const downloadResult = await downloadPaidPdf(pdfId)

      if (Platform.OS === "web") {
        // Web platform - use blob URL
        const url = URL.createObjectURL(downloadResult.blob)
        const link = document.createElement("a")
        link.href = url
        link.download = downloadResult.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else {
        // React Native - show success message and handle file appropriately
        Alert.alert(
          "Download Started",
          `${downloadResult.filename} (${formatFileSize(downloadResult.size)}) download initiated.`,
          [{ text: "OK" }],
        )

        // For React Native, you would typically use react-native-fs or similar
        // to save the file to the device's download folder
        console.log("[v0] File downloaded successfully:", downloadResult.filename)
      }
    } catch (error) {
      console.error("[v0] Download error:", error)

      if (error instanceof Error) {
        if (error.message.includes("Download access required")) {
          Alert.alert("Payment Required", "You need to purchase download access first.", [
            { text: "Cancel", style: "cancel" },
            { text: "Purchase", onPress: () => handlePurchaseDownloadAccess() },
          ])
        } else {
          Alert.alert("Download Failed", error.message)
        }
      } else {
        Alert.alert("Download Failed", "Unable to download the PDF")
      }
    } finally {
      setCheckingPayment(false)
    }
  }

  const handlePurchaseDownloadAccess = async () => {
    try {
      setCheckingPayment(true)

      Alert.alert(
        "Confirm Purchase",
        "Purchase download access for $9.99? This will allow you to download all PDFs from other users.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Purchase",
            onPress: async () => {
              try {
                const response = await processDownloadPayment({
                  amount: 9.99,
                  currency: "USD",
                })

                if (response.error) {
                  throw new Error(response.message)
                }

                setHasDownloadAccess(true)
                Alert.alert(
                  "Success!",
                  "Download access purchased successfully! You can now download PDFs from other users.",
                  [{ text: "OK" }],
                )
              } catch (error) {
                console.error("Payment error:", error)
                Alert.alert("Payment Failed", "Unable to process payment. Please try again.")
              }
            },
          },
        ],
      )
    } catch (error) {
      console.error("Purchase error:", error)
      Alert.alert("Error", "Unable to process purchase")
    } finally {
      setCheckingPayment(false)
    }
  }

  const handleDelete = async (pdfId: string, title: string) => {
    Alert.alert("Delete PDF", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deletePdf(pdfId)

            if (response.error) {
              throw new Error(response.message)
            }

            setPdfs((prev) => prev.filter((pdf) => pdf._id !== pdfId))
            setFilteredPdfs((prev) => prev.filter((pdf) => pdf._id !== pdfId))
            Alert.alert("Success", `${title} has been deleted`)
          } catch (error) {
            console.error("Delete error:", error)
            Alert.alert("Delete Failed", "Unable to delete the PDF")
          }
        },
      },
    ])
  }

  const formatDate = (dateString: string) => {
    console.log("[v0] Formatting date:", dateString)

    if (!dateString) {
      return "No date"
    }

    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      console.log("[v0] Invalid date string:", dateString)
      return "Invalid date"
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFilterOptions = () => {
    const levels = [...new Set(pdfs.map((pdf) => pdf.level))]
    return [
      { label: "All Levels", value: "all" },
      ...levels.map((level) => ({ label: level, value: level.toLowerCase() })),
    ]
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchPdfs()
    checkPaymentStatus()
  }

  useEffect(() => {
    fetchPdfs()
    checkPaymentStatus()
  }, [])

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 18,
            color: colors.textPrimary,
            textAlign: "center",
          }}
        >
          Loading your PDF library...
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          padding: 16,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: colors.textPrimary,
            marginBottom: 8,
          }}
        >
          📚 All PDFs Library
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
          }}
        >
          {filteredPdfs.length} of {pdfs.length} documents from all users
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View
          style={{
            backgroundColor: colors.cardBackground,
            padding: 16,
          }}
        >
          <View
            style={{
              position: "relative",
              marginBottom: 16,
            }}
          >
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.textPrimary,
              }}
              placeholder="Search PDFs by title, course, topic, or uploader..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {getFilterOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleFilterChange(option.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    backgroundColor: selectedFilter === option.value ? colors.primary : colors.background,
                    borderColor: selectedFilter === option.value ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "500",
                      color: selectedFilter === option.value ? colors.white : colors.textPrimary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={{ padding: 16 }}>
          {filteredPdfs.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 80,
              }}
            >
              <Text style={{ fontSize: 60, marginBottom: 16 }}>📄</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {searchQuery || selectedFilter !== "all" ? "No PDFs found" : "No PDFs uploaded yet"}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                {searchQuery || selectedFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No PDFs have been uploaded to the system yet"}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {filteredPdfs.map((pdf) => (
                <View
                  key={pdf._id}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 16,
                    shadowColor: colors.cardShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: colors.textPrimary,
                          marginBottom: 8,
                        }}
                      >
                        {pdf.title}
                      </Text>
                      {pdf.uploader && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              marginRight: 4,
                            }}
                          >
                            👤
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              color: colors.textSecondary,
                            }}
                          >
                            Uploaded by {pdf.uploader.name}
                          </Text>
                        </View>
                      )}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            marginRight: 4,
                          }}
                        >
                          📖
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                          }}
                        >
                          {pdf.course}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#8b5cf6", marginRight: 4 }}>🎓</Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                          }}
                        >
                          {pdf.level}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: `${colors.primary}20`,
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 24,
                          color: colors.primary,
                        }}
                      >
                        📄
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontWeight: "500" }}>Topic:</Text> {pdf.topic}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontWeight: "500" }}>Year:</Text> {pdf.year}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ marginRight: 4 }}>📅</Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                        }}
                      >
                        {formatDate(pdf.uploadDate)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                    >
                      {formatFileSize(pdf.fileSize)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleDownload(pdf._id, pdf.fileName)}
                      disabled={checkingPayment}
                      style={{
                        flex: 1,
                        backgroundColor: hasDownloadAccess ? `${colors.primary}20` : `#f59e0b20`,
                        borderWidth: 1,
                        borderColor: hasDownloadAccess ? `${colors.primary}40` : `#f59e0b40`,
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        opacity: checkingPayment ? 0.6 : 1,
                      }}
                    >
                      {checkingPayment ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Text>{hasDownloadAccess ? "⬇️" : "💳"}</Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "500",
                              color: hasDownloadAccess ? colors.primary : "#f59e0b",
                            }}
                          >
                            {hasDownloadAccess ? "Download" : "Pay to Download"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
