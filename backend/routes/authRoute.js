const express = require("express")
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  dashboard,
  changePassword,
  updateUploadPaymentStatus,
} = require("../controllers/authController")
const authMiddleware = require("../middleware/authmiddleware")

const router = express.Router()

router.post("/register", register)
router.post("/verify-otp", verifyOTP)
router.post("/resend-otp", resendOTP)
router.post("/login", login)
router.post("/change-password", authMiddleware, changePassword)
router.post("/logout", logout)
router.get("/dashboard", authMiddleware, dashboard)
router.put("/update-payment-status", authMiddleware, updateUploadPaymentStatus)

module.exports = router
