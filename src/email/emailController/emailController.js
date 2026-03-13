const prisma = require("../../prisma/prisma");
const { sendEmail } = require("../../email/emailService");

const saveEmailConfig = async (req, res) => {
  try {

    const { provider, apiKey, accessKey, secretKey, region, fromEmail } = req.body;

    // Basic validation
    if (!provider || !fromEmail) {
      return res.status(400).json({
        success: false,
        message: "Provider and fromEmail are required"
      });
    }

    // Validate provider
    if (!["resend", "ses"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider"
      });
    }

    const existingConfig = await prisma.emailConfig.findFirst();

    let config;

    if (existingConfig) {
      config = await prisma.emailConfig.update({
        where: { EmailConfig: existingConfig.EmailConfig },
        data: {
          provider,
          apiKey,
          accessKey,
          secretKey,
          region,
          fromEmail
        }
      });
    } else {
      config = await prisma.emailConfig.create({
        data: {
          provider,
          apiKey,
          accessKey,
          secretKey,
          region,
          fromEmail
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email configuration saved successfully",
      data: config
    });

  } catch (error) {

    console.error("Email Config Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};


const sendTestEmail = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    await sendEmail({
      to: email,
      subject: "Test Email",
      html: "<h2>Email configuration successful</h2>"
    });

    return res.status(200).json({
      success: true,
      message: "Test email sent successfully"
    });

  } catch (error) {

    console.error("Test Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send test email"
    });

  }
};


const sendCustomEmail = async (req, res) => {
  try {

    const { to, subject, html } = req.body;

    await sendEmail({ to, subject, html });

    res.json({
      success: true,
      message: "Email sent"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Email sending failed"
    });

  }
};


module.exports = {
  saveEmailConfig,
  sendTestEmail,
  sendCustomEmail
};