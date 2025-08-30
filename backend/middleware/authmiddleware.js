const jwt = require("jsonwebtoken")
const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      console.log("[v0] No token provided in request")
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    console.log("[v0] Token received:", token.substring(0, 20) + "...")

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const userId = decoded.userId || decoded.id // Support both formats for backward compatibility
    console.log("[v0] Token decoded successfully, user ID:", userId)
    console.log("[v0] Decoded token payload:", decoded)
    console.log(
      "[v0] JWT_SECRET being used:",
      process.env.JWT_SECRET ? "Environment variable set" : "Using default fallback",
    )

    const user = await User.findById(userId)
    console.log("[v0] User lookup result:", user ? `Found user: ${user.email}` : `Not found for ID: ${userId}`)

    if (!user) {
      console.log("[v0] Checking if database connection is working...")
      const userCount = await User.countDocuments()
      console.log("[v0] Total users in database:", userCount)
      console.log("[v0] User not found in database for ID:", userId)
      return res.status(401).json({ message: "Invalid token. User not found." })
    }

    req.user = { id: user._id, email: user.email, name: user.name }
    console.log("[v0] Auth successful for user:", user.email)
    next()
  } catch (error) {
    console.error("[v0] Auth middleware error:", error.message)
    console.error("[v0] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n")[0],
    })

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." })
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token format." })
    }
    res.status(401).json({ message: "Invalid token." })
  }
}

module.exports = authMiddleware
