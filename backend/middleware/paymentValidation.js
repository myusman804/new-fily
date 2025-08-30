const validateDownloadPayment = (req, res, next) => {
  const { paymentMethod, amount } = req.body

  // Validate required fields
  if (!paymentMethod) {
    return res.status(400).json({ message: "Payment method is required" })
  }

  if (!amount || typeof amount !== "number") {
    return res.status(400).json({ message: "Valid payment amount is required" })
  }

  // Validate payment method
  const validPaymentMethods = ["card", "paypal", "bank_transfer"]
  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      message: "Invalid payment method. Supported methods: " + validPaymentMethods.join(", "),
    })
  }

  // Validate amount (download access should be $9.99)
  const DOWNLOAD_ACCESS_PRICE = 9.99
  if (amount !== DOWNLOAD_ACCESS_PRICE) {
    return res.status(400).json({
      message: `Invalid payment amount. Download access costs $${DOWNLOAD_ACCESS_PRICE}`,
    })
  }

  next()
}

module.exports = {
  validateDownloadPayment,
}
