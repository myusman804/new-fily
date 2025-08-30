const express = require("express")
const authMiddleware = require("../middleware/authmiddleware")
const {
  checkDownloadPaymentStatus,
  processDownloadPayment,
  getDownloadPaymentInfo,
  createPaymentIntent,
} = require("../controllers/paymentController")

const router = express.Router()

// Check if user has paid for download access
router.get("/download-status", authMiddleware, checkDownloadPaymentStatus)

// Process download payment
router.post("/download", authMiddleware, processDownloadPayment)

// Get download payment information
router.get("/download-info", authMiddleware, getDownloadPaymentInfo)

router.post("/create-payment-intent", authMiddleware, createPaymentIntent)

// Legacy route - kept for backward compatibility
router.post("/", async (req, res) => {
  try {
    // Simulate payment success
    res.json({ success: true, message: "Payment processed" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Payment failed" })
  }
})

module.exports = router
