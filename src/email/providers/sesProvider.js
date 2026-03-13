const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const sendSesEmail = async (config, to, subject, html) => {

  const client = new SESClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey
    }
  });

  const params = {
    Source: config.fromEmail,
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Subject: {
        Data: subject
      },
      Body: {
        Html: {
          Data: html
        }
      }
    }
  };

  const command = new SendEmailCommand(params);

  return await client.send(command);
};

module.exports = {
  sendSesEmail
};