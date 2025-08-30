const multer = require("multer")
const path = require("path")
const fs = require("fs")
const PDF = require("../models/PDF")
const User = require("../models/User")

const ensureUploadDir = () => {
  const uploadDir = "uploads/temp"
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log("[v0] Created upload directory:", uploadDir)
    }
  } catch (error) {
    console.error("[v0] Error creating upload directory:", error)
    throw error
  }
}

// Initialize upload directory
ensureUploadDir()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/temp"
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      cb(null, uploadDir)
    } catch (error) {
      console.error("[v0] Error in multer destination:", error)
      cb(error, null)
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
      const filename = file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      console.log("[v0] Generated filename:", filename)
      cb(null, filename)
    } catch (error) {
      console.error("[v0] Error generating filename:", error)
      cb(error, null)
    }
  },
})

const fileFilter = (req, file, cb) => {
  console.log("[v0] File filter - mimetype:", file.mimetype)
  if (file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
    console.log("[v0] File rejected - not PDF")
    cb(new Error("Only PDF files are allowed"), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// Calculate price based on file size
const calculatePrice = (sizeBytes) => {
  const sizeInMB = sizeBytes / (1024 * 1024)
  const basePrice = sizeInMB * 0.1
  return Math.max(basePrice, 0.5) // Minimum $0.50
}

const uploadPDF = async (req, res) => {
  let tempFilePath = null

  try {
    console.log("[v0] PDF upload request received")
    console.log("[v0] User ID:", req.user?.id)
    console.log("[v0] Request body:", req.body)
    console.log(
      "[v0] File info:",
      req.file ? { name: req.file.originalname, size: req.file.size, path: req.file.path } : "No file",
    )

    tempFilePath = req.file?.path

    const userId = req.user?.id
    if (!userId) {
      console.log("[v0] No user ID found in request")
      return res.status(401).json({ message: "Authentication required" })
    }

    const file = req.file
    const { title, course, level, topic, year } = req.body

    console.log("[v0] Checking database connection...")

    let user
    try {
      user = await User.findById(userId)
      console.log("[v0] User found:", user ? "Yes" : "No")
    } catch (dbError) {
      console.error("[v0] Database error finding user:", dbError)
      return res.status(500).json({ message: "Database connection error" })
    }

    if (!user) {
      console.log("[v0] User not found in database")
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.isVerified) {
      console.log("[v0] User not verified")
      return res.status(403).json({ message: "Please verify your email first" })
    }

    if (!user.hasPaidForUpload) {
      console.log(`[v0] User ${userId} upload access denied - hasPaidForUpload:`, user.hasPaidForUpload)
      return res.status(403).json({ message: "Upload access required. Please complete payment." })
    }

    console.log(`[v0] User ${userId} has upload access - hasPaidForUpload:`, user.hasPaidForUpload)

    if (!file) {
      console.log("[v0] No file uploaded - returning 400")
      return res.status(400).json({ message: "No file uploaded" })
    }

    if (!title || !course || !level || !topic || !year) {
      console.log("[v0] Missing required PDF details - returning 400")
      console.log("[v0] Received:", { title, course, level, topic, year })
      return res.status(400).json({ message: "All PDF details are required: title, course, level, topic, year" })
    }

    console.log("[v0] File received successfully, calculating price")
    // Calculate price
    const price = calculatePrice(file.size)
    console.log("[v0] Calculated price:", price)

    console.log("[v0] Reading file data for MongoDB storage")
    if (!fs.existsSync(file.path)) {
      console.error("[v0] Uploaded file not found at path:", file.path)
      return res.status(500).json({ message: "Uploaded file not found" })
    }

    let fileData, base64Data
    try {
      fileData = fs.readFileSync(file.path)
      base64Data = fileData.toString("base64")
      console.log("[v0] File data read successfully, size:", base64Data.length)
    } catch (fileError) {
      console.error("[v0] Error reading file:", fileError)
      return res.status(500).json({ message: "Error processing uploaded file" })
    }

    console.log("[v0] Creating PDF record in database")
    let pdfRecord
    try {
      pdfRecord = new PDF({
        userId: userId,
        title: title.trim(),
        course: course.trim(),
        level: level.trim(),
        topic: topic.trim(),
        year: year.trim(),
        fileName: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        price: price,
        fileData: base64Data,
        mimeType: file.mimetype,
        status: "completed",
      })

      await pdfRecord.save()
      console.log("[v0] PDF record created with ID:", pdfRecord._id)
    } catch (dbError) {
      console.error("[v0] Database error saving PDF:", dbError)
      return res.status(500).json({ message: "Error saving PDF to database" })
    }

    try {
      user.uploadCount = (user.uploadCount || 0) + 1
      user.coins = (user.coins || 0) + Math.floor(price * 10) // Award coins based on upload
      await user.save()
      console.log("[v0] User stats updated - uploads:", user.uploadCount, "coins:", user.coins)
    } catch (userUpdateError) {
      console.error("[v0] Error updating user stats:", userUpdateError)
      // Don't fail the request if user stats update fails
    }

    // Clean up temporary file
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
        console.log("[v0] Temporary file cleaned up")
      }
    } catch (cleanupError) {
      console.error("[v0] Error cleaning up temp file:", cleanupError)
      // Don't fail the request if cleanup fails
    }

    res.status(200).json({
      message: "PDF uploaded successfully",
      pdf: {
        id: pdfRecord._id,
        title: pdfRecord.title,
        course: pdfRecord.course,
        level: pdfRecord.level,
        topic: pdfRecord.topic,
        year: pdfRecord.year,
        fileName: pdfRecord.originalName,
        fileSize: pdfRecord.fileSize,
        price: pdfRecord.price,
        uploadDate: pdfRecord.uploadDate,
      },
      user: {
        coins: user.coins,
        uploadCount: user.uploadCount,
      },
    })
  } catch (error) {
    console.error("[v0] PDF upload error:", error)
    console.error("[v0] Error stack:", error.stack)

    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath)
          console.log("[v0] Cleaned up temp file after error")
        }
      } catch (cleanupError) {
        console.error("[v0] Error during cleanup:", cleanupError)
      }
    }

    let errorMessage = "Server error during PDF upload"
    if (error.message.includes("ENOENT")) {
      errorMessage = "File system error - upload directory not accessible"
    } else if (error.message.includes("MongoError") || error.message.includes("ValidationError")) {
      errorMessage = "Database error during upload"
    } else if (error.message.includes("ENOSPC")) {
      errorMessage = "Server storage full"
    }

    res.status(500).json({ message: errorMessage })
  }
}

// Get user's PDFs
const getUserPDFs = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const pdfs = await PDF.find({ userId }).sort({ uploadDate: -1 }).skip(skip).limit(limit).select("-fileData")

    const total = await PDF.countDocuments({ userId })

    res.status(200).json({
      message: "PDFs retrieved successfully",
      pdfs: pdfs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get PDFs error:", error)
    res.status(500).json({ message: "Server error retrieving PDFs" })
  }
}

// Search PDFs
const searchPDFs = async (req, res) => {
  try {
    const userId = req.user.id
    const { query, course, level, topic, year } = req.query
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const searchFilter = { userId }

    // Build search filter
    if (query) {
      searchFilter.$or = [
        { title: { $regex: query, $options: "i" } },
        { topic: { $regex: query, $options: "i" } },
        { course: { $regex: query, $options: "i" } },
      ]
    }

    if (course) searchFilter.course = { $regex: course, $options: "i" }
    if (level) searchFilter.level = { $regex: level, $options: "i" }
    if (topic) searchFilter.topic = { $regex: topic, $options: "i" }
    if (year) searchFilter.year = year

    const pdfs = await PDF.find(searchFilter).sort({ uploadDate: -1 }).skip(skip).limit(limit).select("-fileData")

    const total = await PDF.countDocuments(searchFilter)

    res.status(200).json({
      message: "PDFs search completed",
      pdfs: pdfs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Search PDFs error:", error)
    res.status(500).json({ message: "Server error searching PDFs" })
  }
}

// Delete PDF
const deletePDF = async (req, res) => {
  try {
    const userId = req.user.id
    const pdfId = req.params.id

    const pdf = await PDF.findOne({ _id: pdfId, userId })
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" })
    }

    await PDF.findByIdAndDelete(pdfId)

    res.status(200).json({ message: "PDF deleted successfully" })
  } catch (error) {
    console.error("Delete PDF error:", error)
    res.status(500).json({ message: "Server error deleting PDF" })
  }
}

// Get PDF Download Link
const getPDFDownloadLink = async (req, res) => {
  try {
    const pdfId = req.params.id
    const userId = req.user.id

    const pdf = await PDF.findOne({ _id: pdfId, userId })
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" })
    }

    if (pdf.status !== "completed") {
      return res.status(400).json({ message: "PDF upload not completed" })
    }

    // Convert base64 back to buffer and send file
    const fileBuffer = Buffer.from(pdf.fileData, "base64")

    res.setHeader("Content-Type", pdf.mimeType || "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.originalName}"`)
    res.setHeader("Content-Length", fileBuffer.length)

    res.send(fileBuffer)
  } catch (error) {
    console.error("Get download link error:", error)
    res.status(500).json({ message: "Server error retrieving file" })
  }
}

// Get all PDFs from all users (for overview/admin purposes)
const getAllPDFs = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const pdfs = await PDF.find({})
      .populate("userId", "name email") // Include user name and email
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .select("-fileData")

    const total = await PDF.countDocuments({})

    res.status(200).json({
      message: "All PDFs retrieved successfully",
      pdfs: pdfs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get all PDFs error:", error)
    res.status(500).json({ message: "Server error retrieving all PDFs" })
  }
}

// Search all PDFs from all users
const searchAllPDFs = async (req, res) => {
  try {
    const { query, course, level, topic, year } = req.query
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const searchFilter = {}

    // Build search filter
    if (query) {
      searchFilter.$or = [
        { title: { $regex: query, $options: "i" } },
        { topic: { $regex: query, $options: "i" } },
        { course: { $regex: query, $options: "i" } },
      ]
    }

    if (course) searchFilter.course = { $regex: course, $options: "i" }
    if (level) searchFilter.level = { $regex: level, $options: "i" }
    if (topic) searchFilter.topic = { $regex: topic, $options: "i" }
    if (year) searchFilter.year = year

    const pdfs = await PDF.find(searchFilter)
      .populate("userId", "name email")
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .select("-fileData")

    const total = await PDF.countDocuments(searchFilter)

    res.status(200).json({
      message: "All PDFs search completed",
      pdfs: pdfs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Search all PDFs error:", error)
    res.status(500).json({ message: "Server error searching all PDFs" })
  }
}

// Download PDF
const downloadPDF = async (req, res) => {
  try {
    const pdfId = req.params.id
    const userId = req.user.id

    // Find the PDF
    const pdf = await PDF.findById(pdfId)
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" })
    }

    if (pdf.status !== "completed") {
      return res.status(400).json({ message: "PDF not available for download" })
    }

    // Check if user owns the PDF (free download for own files)
    if (pdf.userId.toString() === userId) {
      console.log("[v0] User downloading own PDF - free access")
    } else {
      // Check if user has paid for download access
      const user = await User.findById(userId)
      if (!user.hasPaidForDownload) {
        return res.status(403).json({
          message: "Download access required. Please complete payment to download PDFs from other users.",
          requiresPayment: true,
          pdfPrice: pdf.price,
        })
      }

      // Update download count
      user.downloadCount = (user.downloadCount || 0) + 1
      await user.save()
      console.log("[v0] User downloaded PDF - count updated:", user.downloadCount)
    }

    // Convert base64 back to buffer and send file
    const fileBuffer = Buffer.from(pdf.fileData, "base64")

    res.setHeader("Content-Type", pdf.mimeType || "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.originalName}"`)
    res.setHeader("Content-Length", fileBuffer.length)

    res.send(fileBuffer)
  } catch (error) {
    console.error("Download PDF error:", error)
    res.status(500).json({ message: "Server error downloading file" })
  }
}

// Update download payment status
const updateDownloadPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const { paymentStatus, transactionId } = req.body

    if (paymentStatus !== "completed") {
      return res.status(400).json({ message: "Invalid payment status" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.hasPaidForDownload) {
      return res.status(400).json({ message: "Download access already activated" })
    }

    // Update user's download payment status
    user.hasPaidForDownload = true
    user.downloadPaymentDate = new Date()
    await user.save()

    console.log(`[v0] User ${userId} download payment completed - transactionId: ${transactionId}`)

    res.status(200).json({
      message: "Download access activated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasPaidForDownload: user.hasPaidForDownload,
        downloadCount: user.downloadCount || 0,
        downloadPaymentDate: user.downloadPaymentDate || null,
      },
    })
  } catch (error) {
    console.error("Update download payment status error:", error)
    res.status(500).json({ message: "Server error updating payment status" })
  }
}

// Check download payment status
const checkDownloadPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select("hasPaidForDownload downloadCount downloadPaymentDate")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      message: "Download payment status retrieved",
      hasPaidForDownload: user.hasPaidForDownload || false,
      downloadCount: user.downloadCount || 0,
      downloadPaymentDate: user.downloadPaymentDate || null,
    })
  } catch (error) {
    console.error("Check download payment status error:", error)
    res.status(500).json({
      message: "Server error checking payment status",
      error: error.message,
    })
  }
}

module.exports = {
  upload,
  uploadPDF,
  getUserPDFs,
  getAllPDFs,
  searchPDFs,
  searchAllPDFs,
  deletePDF,
  getPDFDownloadLink,
  downloadPDF,
  updateDownloadPaymentStatus,
  checkDownloadPaymentStatus,
}
