const express = require("express")
const authMiddleware = require("../middleware/authmiddleware")
const {
  upload,
  uploadPDF,
  getUserPDFs,
  getAllPDFs, // Added getAllPDFs import
  searchPDFs,
  searchAllPDFs, // Added searchAllPDFs import
  deletePDF,
  getPDFDownloadLink,
} = require("../controllers/pdfController")
const authController = require("../controllers/authController")

const router = express.Router()

router.post("/upload", authMiddleware, upload.single("file"), uploadPDF)
router.get("/my-pdfs", authMiddleware, getUserPDFs)
router.get("/all-pdfs", authMiddleware, getAllPDFs) // Added route to get all PDFs from all users
router.get("/search", authMiddleware, searchPDFs)
router.get("/search-all", authMiddleware, searchAllPDFs) // Added route to search all PDFs
router.delete("/:id", authMiddleware, deletePDF)
router.get("/download/:id", authMiddleware, getPDFDownloadLink)

router.post("/update-payment-status", authMiddleware, authController.updateUploadPaymentStatus)

// Health check route for PDF service
router.get("/health", (req, res) => {
  res.status(200).json({
    message: "PDF service is running",
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
