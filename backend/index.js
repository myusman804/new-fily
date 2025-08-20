const express = require("express")
const cors = require("cors")
const connectDB = require("./config/db")
const dotenv = require("dotenv")
const fs = require("fs")
const path = require("path")

// Load environment variables
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  if (req.method === "POST" && req.url.includes("/pdf/upload")) {
    console.log("[v0] PDF upload request received")
    console.log("[v0] Headers:", req.headers)
    console.log("[v0] Content-Type:", req.get("Content-Type"))
  }
  next()
})

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
)

app.use(express.json()) // Middleware to parse JSON

app.use(express.urlencoded({ extended: true, limit: "10mb" }))

const uploadsDir = path.join(__dirname, "uploads", "temp")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Routes
const authRoutes = require("./routes/authRoute")
const pdfRoutes = require("./routes/pdfRoute")

app.use("/api/auth", authRoutes)
app.use("/api/pdf", pdfRoutes)

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
})

app.use((error, req, res, next) => {
  console.error("Server error:", error)

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Maximum size is 10MB." })
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "Unexpected file field." })
  }

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  })
})

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})
