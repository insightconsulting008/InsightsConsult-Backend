const axios = require("axios");

async function toggleWebhook(webhookId, keyId, keySecret, isActive) {
  try {
    const response = await axios({
      method: "patch",
      url: `https://api.razorpay.com/v1/webhooks/${webhookId}`,
      auth: {
        username: keyId,
        password: keySecret
      },
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        active: isActive
      }
    });

    console.log(`✅ Webhook ${isActive ? "ENABLED" : "DISABLED"}`);
    return response.data;

  } catch (error) {
    console.log("❌ Toggle Webhook Error:", error.response?.data || error.message);
    return null;
  }
}

module.exports = toggleWebhook;