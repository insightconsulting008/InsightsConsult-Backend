const axios = require("axios");

async function deleteWebhook(webhookId, keyId, keySecret) {
  try {
    const response = await axios({
      method: "delete",
      url: `https://api.razorpay.com/v1/webhooks/${webhookId}`,
      auth: {
        username: keyId,
        password: keySecret
      }
    });

    console.log("✅ Webhook deleted:", response.data);

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.log("❌ Delete Webhook Error:");

    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log("DATA:", error.response.data);
    } else {
      console.log(error.message);
    }

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}



module.exports = deleteWebhook;