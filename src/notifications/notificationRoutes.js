const express = require("express");
const router = express.Router();

const {
  getUserNotifications,
  getEmployeeNotifications,
  markAsRead,
  createTestNotification
} = require("./notificationController");

router.get("/user/:userId", getUserNotifications);
router.get("/employee/:employeeId", getEmployeeNotifications);
router.put("/read/:notificationId", markAsRead);
router.post("/test", createTestNotification);

module.exports = router;