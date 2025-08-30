const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate OTP
    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false,
    })

    await user.save()

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    }

    await transporter.sendMail(mailOptions)

    res.status(201).json({
      message: "User registered successfully. Please verify your email with the OTP sent.",
      userId: user._id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
}

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" })
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" })
    }

    // Verify user
    user.isVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
        hasPaidForUpload: user.hasPaidForUpload,
      },
    })
  } catch (error) {
    console.error("OTP verification error:", error)
    res.status(500).json({ message: "Server error during verification" })
  }
}

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" })
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    user.otp = otp
    user.otpExpires = otpExpires
    await user.save()

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP - Resent",
      html: `
        <h2>Email Verification</h2>
        <p>Your new OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: "OTP resent successfully" })
  } catch (error) {
    console.error("Resend OTP error:", error)
    res.status(500).json({ message: "Server error during OTP resend" })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email first" })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
        hasPaidForUpload: user.hasPaidForUpload,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
}

const logout = async (req, res) => {
  res.json({ message: "Logout successful" })
}

const dashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -otp")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
        hasPaidForUpload: user.hasPaidForUpload,
        uploadCount: user.uploadCount,
        maxUploads: user.maxUploads,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({ message: "Server error fetching dashboard" })
  }
}

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const userId = req.userId // set by auth middleware (JWT verify)

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Server error while changing password" })
  }
}

const updateUploadPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user's upload payment status
    user.hasPaidForUpload = true
    user.uploadPaymentDate = new Date()
    await user.save()

    res.json({
      success: true,
      message: "Upload payment status updated successfully",
      hasPaidForUpload: user.hasPaidForUpload,
    })
  } catch (error) {
    console.error("Error updating upload payment status:", error)
    res.status(500).json({ message: "Server error" })
  }
}

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  dashboard,
  updateUploadPaymentStatus,
  changePassword,
}
