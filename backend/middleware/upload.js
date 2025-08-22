// middleware/upload.js
const multer = require("multer")

const storage = multer.memoryStorage() // or diskStorage if you used that
const upload = multer({ storage })

module.exports = upload
