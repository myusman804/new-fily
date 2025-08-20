const createVerificationEmailHTML = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Verification</h1>
            </div>
            <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Thank you for registering with our PDF Upload App. To complete your registration, please use the following OTP code:</p>
                <div class="otp-code">${otp}</div>
                <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
                <p>Best regards,<br>PDF Upload App Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

module.exports = { createVerificationEmailHTML }
