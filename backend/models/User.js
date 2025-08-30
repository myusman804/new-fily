const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    hasPaidForUpload: {
      type: Boolean,
      default: false,
    },
    hasPaidForDownload: {
      type: Boolean,
      default: false,
    },
    uploadCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 0,
    },
    downloadPaymentDate: {
      type: Date,
    },
    downloadTransactionId: {
      type: String,
    },
    stripeCustomerId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("User", userSchema)
