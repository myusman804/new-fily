const User = require("../models/User")

// Check download payment status
const checkDownloadPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      message: "Download payment status retrieved",
      hasPaidForDownload: user.hasPaidForDownload,
      downloadCount: user.downloadCount || 0,
    })
  } catch (error) {
    console.error("Check download payment status error:", error)
    res.status(500).json({ message: "Server error checking payment status" })
  }
}

// Process download payment
const processDownloadPayment = async (req, res) => {
  try {
    const userId = req.user.id
    const { paymentMethod, amount } = req.body

    // Validate payment amount (should be $9.99 for download access)
    const DOWNLOAD_ACCESS_PRICE = 9.99
    if (amount !== DOWNLOAD_ACCESS_PRICE) {
      return res.status(400).json({
        message: `Invalid payment amount. Download access costs $${DOWNLOAD_ACCESS_PRICE}`,
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.hasPaidForDownload) {
      return res.status(400).json({ message: "Download access already purchased" })
    }

    console.log(`[v0] Processing download payment for user ${userId}`)
    console.log(`[v0] Payment method: ${paymentMethod}, Amount: $${amount}`)

    // TODO: Integrate with actual payment processor (Stripe, PayPal, etc.)
    // Example Stripe integration:
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: user.stripeCustomerId,
      metadata: {
        userId: userId,
        type: 'download_access'
      }
    });
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.'
      });
    }
    */

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Update user's download payment status
    user.hasPaidForDownload = true
    user.downloadPaymentDate = new Date()
    user.downloadTransactionId = transactionId
    await user.save()

    console.log(`[v0] Download payment successful for user ${userId} - Transaction: ${transactionId}`)

    res.status(200).json({
      success: true,
      message: "Download access purchased successfully",
      transactionId: transactionId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasPaidForDownload: user.hasPaidForDownload,
        downloadCount: user.downloadCount || 0,
        downloadPaymentDate: user.downloadPaymentDate,
      },
    })
  } catch (error) {
    console.error("Process download payment error:", error)
    res.status(500).json({
      success: false,
      message: "Payment processing failed. Please try again.",
    })
  }
}

// Get download payment info
const getDownloadPaymentInfo = async (req, res) => {
  try {
    const DOWNLOAD_ACCESS_PRICE = 9.99

    res.status(200).json({
      message: "Download payment information",
      downloadAccessPrice: DOWNLOAD_ACCESS_PRICE,
      currency: "USD",
      description: "One-time payment for unlimited PDF downloads from other users",
      features: [
        "Download PDFs from all users",
        "Unlimited downloads",
        "No recurring fees",
        "Instant access after payment",
      ],
    })
  } catch (error) {
    console.error("Get download payment info error:", error)
    res.status(500).json({ message: "Server error retrieving payment info" })
  }
}

const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id
    const DOWNLOAD_ACCESS_PRICE = 9.99

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.hasPaidForDownload) {
      return res.status(400).json({ message: "Download access already purchased" })
    }

    // TODO: Uncomment when Stripe is configured
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(DOWNLOAD_ACCESS_PRICE * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId,
        type: 'download_access',
        userEmail: user.email
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: DOWNLOAD_ACCESS_PRICE,
      currency: 'usd'
    });
    */

    // For now, return mock client secret
    res.status(200).json({
      clientSecret: `pi_mock_${Date.now()}_secret`,
      amount: DOWNLOAD_ACCESS_PRICE,
      currency: "usd",
      message: "Mock payment intent created. Configure Stripe for real payments.",
    })
  } catch (error) {
    console.error("Create payment intent error:", error)
    res.status(500).json({ message: "Failed to create payment intent" })
  }
}

module.exports = {
  checkDownloadPaymentStatus,
  processDownloadPayment,
  getDownloadPaymentInfo,
  createPaymentIntent,
}
