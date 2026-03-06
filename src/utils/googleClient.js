const config = require("./config")
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

module.exports = client;