const multer = require("multer")
const path = require("path")
const fs = require("fs")
const PDF = require("../models/PDF")
const User = require("../models/User")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/temp"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
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
  try {
    console.log("[v0] PDF upload request received")
    console.log("[v0] User ID:", req.user.id)
    console.log("[v0] Request body:", req.body)
    console.log("[v0] File info:", req.file ? { name: req.file.originalname, size: req.file.size } : "No file")

    const userId = req.user.id
    const file = req.file
    const { title, course, level, topic, year } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.isVerified) {
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
      return res.status(400).json({ message: "All PDF details are required: title, course, level, topic, year" })
    }

    console.log("[v0] File received successfully, calculating price")
    // Calculate price
    const price = calculatePrice(file.size)
    console.log("[v0] Calculated price:", price)

    console.log("[v0] Reading file data for MongoDB storage")
    // Read file data as base64 for MongoDB storage
    const fileData = fs.readFileSync(file.path)
    const base64Data = fileData.toString("base64")

    console.log("[v0] Creating PDF record in database")
    const pdfRecord = new PDF({
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

    user.uploadCount = (user.uploadCount || 0) + 1
    user.coins = (user.coins || 0) + Math.floor(price * 10) // Award coins based on upload
    await user.save()

    // Clean up temporary file
    fs.unlinkSync(file.path)
    console.log("[v0] Temporary file cleaned up")

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
    console.log("[v0] PDF upload error:", error)

    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    console.error("PDF upload error:", error)
    res.status(500).json({ message: "Server error during PDF upload" })
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

module.exports = {
  upload,
  uploadPDF,
  getUserPDFs,
  searchPDFs,
  deletePDF,
  getPDFDownloadLink,
}
