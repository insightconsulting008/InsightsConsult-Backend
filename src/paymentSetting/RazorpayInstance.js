const Razorpay = require("razorpay");
const prisma = require("../prisma/prisma");

async function getRazorpayInstance() {
  const settings = await prisma.paymentSetting.findFirst({
    where: { isEnabled: true },
  });

  if (!settings) {
    throw new Error("Payments disabled");
  }

  return new Razorpay({
    key_id: settings.razorpayKeyId,
    key_secret: settings.razorpaySecret,
  });
}

module.exports = getRazorpayInstance 
