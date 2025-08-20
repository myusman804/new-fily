const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    coins: {
      type: Number,
      default: 5,
    },
    hasPaidForUpload: {
      type: Boolean,
      default: false,
    },
    totalPDFsUploaded: {
      type: Number,
      default: 0,
    },
    totalStorageUsed: {
      type: Number,
      default: 0, // in bytes
    },
    uploadLimitMB: {
      type: Number,
      default: 100, // 100MB default limit
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
UserSchema.index({ isVerified: 1 })

const User = mongoose.model("User", UserSchema)
module.exports = User
