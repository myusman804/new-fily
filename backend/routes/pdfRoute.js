const express = require("express")
const authMiddleware = require("../middleware/authmiddleware")
const {
  upload,
  uploadPDF,
  getUserPDFs,
  searchPDFs,
  deletePDF,
  getPDFDownloadLink,
} = require("../controllers/pdfController")

const router = express.Router()

router.post("/upload", authMiddleware, upload.single("file"), uploadPDF)
router.get("/my-pdfs", authMiddleware, getUserPDFs)
router.get("/search", authMiddleware, searchPDFs)
router.delete("/:id", authMiddleware, deletePDF)
router.get("/download/:id", authMiddleware, getPDFDownloadLink)

// Health check route for PDF service
router.get("/health", (req, res) => {
  res.status(200).json({
    message: "PDF service is running",
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
