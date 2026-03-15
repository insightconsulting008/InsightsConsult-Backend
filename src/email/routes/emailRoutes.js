const express = require("express");
const router = express.Router();

const {toggleEvent,getEvent} = require("../emailController/emailEventController.js")

const {
  saveEmailConfig,
  sendTestEmail,
  sendCustomEmail
} = require("../emailController/emailController.js");

router.post("/config", saveEmailConfig);
router.post("/test", sendTestEmail);
router.post("/send", sendCustomEmail);
router.get("/event", getEvent);
router.post("/event/toggle", toggleEvent);

module.exports = router;