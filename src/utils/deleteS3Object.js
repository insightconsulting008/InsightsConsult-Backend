const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const config =  require('./config')

const s3 = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Delete file from AWS S3 using full file URL
 */
const deleteS3Object = async (fileUrl) => {
  if (!fileUrl) return;
  const key = fileUrl.split(".amazonaws.com/")[1];
  const command = new DeleteObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key
  });

  await s3.send(command);
};

module.exports = {
  deleteS3Object
};
