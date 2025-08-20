const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const User = require("../models/User")
const { createVerificationEmailHTML } = require("../templete/emailTemplete")

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      coins: 5, // New users get 5 coins
    })

    await user.save()

    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification - Your OTP Code",
      html: createVerificationEmailHTML(name, otp),
    }

    await transporter.sendMail(mailOptions)

    res.status(201).json({
      message: "User registered successfully. Please check your email for OTP verification.",
      email: email,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
}

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" })
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" })
    }

    // Mark user as verified and clear OTP
    user.isVerified = true
    user.otp = undefined
    user.otpExpiry = undefined
    await user.save()

    res.status(200).json({ message: "Email verified successfully" })
  } catch (error) {
    console.error("OTP verification error:", error)
    res.status(500).json({ message: "Server error during verification" })
  }
}

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" })
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    user.otp = otp
    user.otpExpiry = otpExpiry
    await user.save()

    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification - Your New OTP Code",
      html: createVerificationEmailHTML(user.name, otp),
    }

    await transporter.sendMail(mailOptions)

    res.status(200).json({ message: "New OTP sent successfully" })
  } catch (error) {
    console.error("Resend OTP error:", error)
    res.status(500).json({ message: "Server error during OTP resend" })
  }
}

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email first" })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" })

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
}

// Logout user
const logout = async (req, res) => {
  res.status(200).json({ message: "Logout successful" })
}

// Dashboard
const dashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -otp -otpExpiry")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      message: "Dashboard data retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({ message: "Server error retrieving dashboard data" })
  }
}

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  dashboard,
}
