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
    // Additional fields can be added here
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
UserSchema.index({ isVerified: 1 })

// Additional methods or hooks can be added here
UserSchema.methods.verifyUser = function () {
  this.isVerified = true
  this.save()
}

const User = mongoose.model("User", UserSchema)
module.exports = User
