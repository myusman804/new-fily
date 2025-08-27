const mongoose = require("mongoose")

const PdfSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    fileData: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: "application/pdf",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
PdfSchema.index({ userId: 1, uploadDate: -1 })
PdfSchema.index({ userId: 1, course: 1 })
PdfSchema.index({ userId: 1, level: 1 })
PdfSchema.index({ userId: 1, topic: 1 })

module.exports = mongoose.model("PDF", PdfSchema)
