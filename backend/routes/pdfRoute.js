const express = require("express")
const { upload, uploadPDF, getUserPDFs, deletePDF, getPDFDownloadLink } = require("../controllers/pdfController")
const authMiddleware = require("../middleware/authmiddleware")

const router = express.Router()

// All PDF routes require authentication
router.use(authMiddleware)

// Upload PDF
router.post("/upload", upload.single("pdf"), uploadPDF)

// Get user's PDFs
router.get("/my-pdfs", getUserPDFs)

// Get PDF download link
router.get("/download/:id", getPDFDownloadLink)

// Delete PDF
router.delete("/:id", deletePDF)

module.exports = router
