const prisma = require("../prisma/prisma.js");
const { sendResendEmail } = require("./providers/resendProvider.js");
const { sendSesEmail } = require("./providers/sesProvider.js");

const sendEmail = async ({ eventName, to, subject, html }) => {

    const event = await prisma.emailEvent.findUnique({
      where: { name: eventName }
    });
  
    if (!event || !event.enabled) {
        console.log(`Email event ${eventName} disabled`);
        return null;
    }
  
    const config = await prisma.emailConfig.findFirst();
  console.log(config)
    if (!config) {
      throw new Error("Email provider not configured");
    }
  
    if (config.provider === "resend") {
      return await sendResendEmail(config, to, subject, html);
    }
  
    if (config.provider === "ses") {
      return await sendSesEmail(config, to, subject, html);
    }
  
  };
  
module.exports = { sendEmail };
