/* =====================================================
   TOKEN HELPER (helpers/tokenHelper.js)
===================================================== */

const jwt = require("jsonwebtoken");
const config = require("./config");

/**
 * Generate Access & Refresh Tokens
 */
const generateTokens = (payload) => {
  return {
    accessToken: jwt.sign(payload, config.ACCESS_SECRET, {
      expiresIn: "1d",
    }),
    refreshToken: jwt.sign(payload, config.REFRESH_SECRET, {
      expiresIn: "7d",
    }),
  };
};

module.exports = generateTokens;