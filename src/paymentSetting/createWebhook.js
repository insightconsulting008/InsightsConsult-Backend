const axios = require("axios");
const crypto = require("crypto");

const WEBHOOK_URL = "https://insightsconsult-backend.onrender.com/razorpay/webhook";

async function createWebhook(keyId, keySecret, alertEmail) {
  try {
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    const events = {
        // payment_link Events
        "payment_link.paid": true,
        "payment_link.partially_paid": true,
        "payment_link.expired": true,
        "payment_link.cancelled": true,
      
        // payment Events
        "payment.authorized": true,
        "payment.failed": true,
        "payment.captured": true,
        "payment.dispute.created": true,
        "payment.dispute.won": true,
        "payment.dispute.lost": true,
        "payment.dispute.closed": true,
        "payment.dispute.under_review": true,
        "payment.dispute.action_required": true,
        "payment.downtime.started": true,
        "payment.downtime.updated": true,
        "payment.downtime.resolved": true,
      
        // settlement Events
        "settlement.processed": true,
      
        // order Events
        "order.paid": true,
        "order.notification.delivered": true,
        "order.notification.failed": true,
      
        // invoice Events
        "invoice.paid": true,
        "invoice.partially_paid": true,
        "invoice.expired": true
      };
    const response = await axios({
      method: "post",
      url: "https://api.razorpay.com/v1/webhooks",
      auth: {
        username: keyId,
        password: keySecret
      },
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({  // explicitly stringify
        url: WEBHOOK_URL,
        secret: webhookSecret,
        alert_email: alertEmail,
        events,
        active: true
      })
    });

    return {
      webhookId: response.data.id,
      webhookSecret
    };
  } catch (error) {
    console.log("Webhook Error:", error.response?.data || error.message);
    return null;
  }
}

module.exports = createWebhook;