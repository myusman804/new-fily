import mongoose from "mongoose"

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileData: { type: Buffer, required: true },
  uploadDate: { type: Date, default: Date.now },
  downloads: { type: Number, default: 0 },
})

export default mongoose.models.PDF || mongoose.model("PDF", pdfSchema)
