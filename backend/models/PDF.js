const mongoose = require("mongoose")

const PDFSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
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
    fileData: {
      type: String, // Base64 encoded file data
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["uploading", "completed", "failed"],
      default: "uploading",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

PDFSchema.index({ userId: 1, uploadDate: -1 })
PDFSchema.index({ status: 1 })
PDFSchema.index({ course: 1, level: 1 })
PDFSchema.index({ title: "text", topic: "text" })

const PDF = mongoose.model("PDF", PDFSchema)
module.exports = PDF
