// require('dotenv').config();
require("dotenv").config({ path: "./prisma/.env" });

// Store environment variables in an object
const config = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  NODE_ENV:process.env.NODE_ENV,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
  SCHEDULER_SECRET: process.env.SCHEDULER_SECRET,
  SETUP_SECRET: process.env.SETUP_SECRET

};


module.exports = config;