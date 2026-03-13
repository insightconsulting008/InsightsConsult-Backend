const express = require("express");
const router = express.Router();

const {
  saveEmailConfig,
  sendTestEmail,
  sendCustomEmail
} = require("../controllers/emailController");

router.post("/config", saveEmailConfig);
router.post("/test", sendTestEmail);
router.post("/send", sendCustomEmail);

module.exports = router;