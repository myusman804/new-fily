const generateTransactionId = () => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substr(2, 9)
  return `txn_${timestamp}_${randomString}`
}

const validatePaymentAmount = (amount, expectedAmount) => {
  return typeof amount === "number" && amount === expectedAmount
}

const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

// Payment configuration
const PAYMENT_CONFIG = {
  DOWNLOAD_ACCESS_PRICE: 9.99,
  UPLOAD_ACCESS_PRICE: 9.99,
  CURRENCY: "USD",
  SUPPORTED_PAYMENT_METHODS: ["card", "paypal", "bank_transfer"],
}

module.exports = {
  generateTransactionId,
  validatePaymentAmount,
  formatCurrency,
  PAYMENT_CONFIG,
}
