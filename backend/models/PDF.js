// models/Pdf.js
const mongoose = require("mongoose")

const PdfSchema = new mongoose.Schema({
  title: String,
  course: String,
  level: String,
  topic: String,
  year: String,
  file: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Pdf", PdfSchema)
