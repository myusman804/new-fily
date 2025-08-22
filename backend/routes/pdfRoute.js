// routes/pdf.js
const express = require("express")
const upload = require("../middleware/upload")
const Pdf = require("../models/PDF")

const router = express.Router()

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const newPdf = new Pdf({
      title: req.body.title,
      course: req.body.course,
      level: req.body.level,
      topic: req.body.topic,
      year: req.body.year,
      file: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      },
    })

    await newPdf.save()
    res.status(201).json({ message: "File uploaded successfully", id: newPdf._id })
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).json({ message: "File upload failed" })
  }
})

router.get("/download/:id", async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id)
    if (!pdf) return res.status(404).send("File not found")

    res.set("Content-Type", pdf.file.contentType)
    res.set("Content-Disposition", `attachment; filename="${pdf.file.filename}"`)
    res.send(pdf.file.data)
  } catch (err) {
    console.error("Download error:", err)
    res.status(500).send("Error retrieving file")
  }
})

module.exports = router
