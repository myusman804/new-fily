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
  Linking,
  RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/components/theme-context"
import { getPdfApiUrl, getAuthToken } from "../../lib/api"

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
  uploadedAt: string
  status: string
}

export default function OverviewPage() {
  const [pdfs, setPdfs] = useState<PDF[]>([])
  const [filteredPdfs, setFilteredPdfs] = useState<PDF[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const { colors } = useTheme()

  const fetchPdfs = async () => {
    try {
      const token = await getAuthToken()
      console.log("[v0] Token retrieved:", token)
      if (!token) {
        Alert.alert("Authentication Error", "Please log in to view your PDFs")
        return
      }

      console.log("[v0] Fetching PDFs from:", `${getPdfApiUrl()}/my-pdfs`)
      const response = await fetch(`${getPdfApiUrl()}/my-pdfs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] PDFs fetched:", data)
        setPdfs(data.pdfs || [])
        setFilteredPdfs(data.pdfs || [])
      } else {
        const errorText = await response.text()
        console.log("[v0] Error response:", errorText)
        throw new Error("Failed to fetch PDFs")
      }
    } catch (error) {
      console.error("Error fetching PDFs:", error)
      Alert.alert("Error", "Failed to load your PDFs")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterPdfs(query, selectedFilter)
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
          pdf.topic.toLowerCase().includes(query.toLowerCase()),
      )
    }

    if (filter !== "all") {
      filtered = filtered.filter((pdf) => pdf.level.toLowerCase() === filter.toLowerCase())
    }

    setFilteredPdfs(filtered)
  }

  const handleDownload = async (pdfId: string, fileName: string) => {
    try {
      const token = await getAuthToken()
      const downloadUrl = `${getPdfApiUrl()}/download/${pdfId}?token=${token}`

      Alert.alert("Download PDF", `Download ${fileName}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: () => {
            Linking.openURL(downloadUrl).catch(() => {
              Alert.alert("Error", "Unable to open download link")
            })
          },
        },
      ])
    } catch (error) {
      Alert.alert("Download Failed", "Unable to download the PDF")
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
            const token = await getAuthToken()
            const response = await fetch(`${getPdfApiUrl()}/delete/${pdfId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.ok) {
              setPdfs((prev) => prev.filter((pdf) => pdf._id !== pdfId))
              setFilteredPdfs((prev) => prev.filter((pdf) => pdf._id !== pdfId))
              Alert.alert("Success", `${title} has been deleted`)
            } else {
              const errorData = await response.json()
              throw new Error(errorData.message || "Delete failed")
            }
          } catch (error) {
            console.error("Delete error:", error)
            Alert.alert("Delete Failed", "Unable to delete the PDF")
          }
        },
      },
    ])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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
  }

  useEffect(() => {
    fetchPdfs()
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
      {/* Header */}
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
          📚 PDF Library
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
          }}
        >
          {filteredPdfs.length} of {pdfs.length} documents
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Search and Filter Section */}
        <View
          style={{
            backgroundColor: colors.cardBackground,
            padding: 16,
          }}
        >
          {/* Search Bar */}
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
              placeholder="Search PDFs by title, course, or topic..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* Filter Chips */}
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

        {/* PDF List */}
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
                  : "Upload your first PDF to get started"}
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
                  {/* Card Header */}
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

                  {/* Card Content */}
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
                        {formatDate(pdf.uploadedAt)}
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

                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleDownload(pdf._id, pdf.fileName)}
                      style={{
                        flex: 1,
                        backgroundColor: `${colors.primary}20`,
                        borderWidth: 1,
                        borderColor: `${colors.primary}40`,
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Text>⬇️</Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: colors.primary,
                        }}
                      >
                        Download
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(pdf._id, pdf.title)}
                      style={{
                        backgroundColor: "#ef444420",
                        borderWidth: 1,
                        borderColor: "#ef444440",
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text>🗑️</Text>
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
