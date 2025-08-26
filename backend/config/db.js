const mongoose = require("mongoose")

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://mkyakoob804:8m788Gcucb0Uu6kB@cluster0.v0wtg7c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const connectDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("MongoDB Connected Successfully")
    console.log("Database URI:", MONGO_URI.replace(/\/\/.*@/, "//***:***@")) // Hide credentials in logs
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message)
    process.exit(1) // Exit the process with failure
  }
}

module.exports = connectDB
