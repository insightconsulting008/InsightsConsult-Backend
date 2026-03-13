const AWS = require("aws-sdk");

const sendSesEmail = async (config, to, subject, html) => {

  const ses = new AWS.SES({
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    region: config.region
  });

  const params = {
    Source: config.fromEmail,
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: html }
      }
    }
  };

  return await ses.sendEmail(params).promise();
};

module.exports = {
  sendSesEmail
};