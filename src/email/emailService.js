const prisma = require("../prisma/prisma.js");
const { sendResendEmail } = require("./providers/resendProvider.js");
const { sendSesEmail } = require("./providers/sesProvider.js");

const sendEmail = async ({ to, subject, html }) => {

  const config = await prisma.emailConfig.findFirst();

  if (!config) {
    throw new Error("Email provider not configured");
  }

  let response;

  if (config.provider === "resend") {
    response = await sendResendEmail(config, to, subject, html);
  }

  if (config.provider === "ses") {
    response = await sendSesEmail(config, to, subject, html);
  }

  // Optional email logging
  /*
  await prisma.emailLog.create({
    data: {
      to,
      subject,
      provider: config.provider,
      status: "sent"
    }
  });
  */

  return response;
};

module.exports = {
  sendEmail
};