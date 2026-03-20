 const  {
    EventBridgeClient,
    CreateConnectionCommand,
    CreateApiDestinationCommand,
    PutRuleCommand,
    PutTargetsCommand,
  } =require("@aws-sdk/client-eventbridge");
  const config = require('./config')
  
 

  const client = new EventBridgeClient({
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  });



  
  const createScheduler = async ({ url, method, interval }) => {
    try {
      const unique = Date.now();
  
      // 1️⃣ Create Connection
      const connection = await client.send(
        new CreateConnectionCommand({
          Name: `conn-${unique}`,
          AuthorizationType: "API_KEY",
          AuthParameters: {
            ApiKeyAuthParameters: {
              ApiKeyName: "x-cron-secret",
              ApiKeyValue: config.CRON_SECRET,
            },
          },
        })
      );
  
      // 2️⃣ Create API Destination
      const api = await client.send(
        new CreateApiDestinationCommand({
          Name: `api-${unique}`,
          ConnectionArn: connection.ConnectionArn,
          InvocationEndpoint: url,
          HttpMethod: method,
          InvocationRateLimitPerSecond: 1,
        })
      );
  
      // 3️⃣ Create Rule
      const ruleName = `rule-${unique}`;
  
      await client.send(
        new PutRuleCommand({
          Name: ruleName,
          ScheduleExpression: `rate(${interval} minutes)`,
          State: "ENABLED",
        })
      );
  
      // 4️⃣ Attach Target
      await client.send(
        new PutTargetsCommand({
          Rule: ruleName,
          Targets: [
            {
              Id: `target-${unique}`,
              Arn: api.ApiDestinationArn,
              RoleArn: `arn:aws:iam::${config.AWS_ACCOUNT_ID}:role/EventBridgeInvokeRole`,
            },
          ],
        })
      );
  
      return {
        success: true,
        ruleName,
      };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };


  module.exports = createScheduler;