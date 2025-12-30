const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const config =  require('./config')

console.log("🔹 Initializing S3 Client...");

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
    console.log("🟡 deleteS3Object called");
    console.log("➡️ File URL received:", fileUrl);
  if (!fileUrl) return;
  const key = fileUrl.split(".amazonaws.com/")[1];
  console.log("📦 Extracted S3 Key:", key);

  
  console.log("🧾 Bucket Name:", config.S3_BUCKET_NAME);
  console.log("🌍 Region:", config.AWS_REGION);
  const command = new DeleteObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key
  });

  
  console.log("🧾 Bucket Name:", config.S3_BUCKET_NAME);
  console.log("🌍 Region:", config.AWS_REGION);

   const response=await s3.send(command);

  console.log("✅ S3 delete successful");
  console.log("📨 S3 Response:", response);
};

module.exports = {
  deleteS3Object
};
