const { Resend } = require("resend");

const sendResendEmail = async (config, to, subject, html) => {

  const resend = new Resend(config.apiKey);

  return await resend.emails.send({
    from: config.fromEmail,
    to,
    subject,
    html
  });

};

module.exports = {
  sendResendEmail
};