const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  getEmployeeNotifications,
  markAsRead,
  createTestNotification,
  clearEmployeeNotifications,
  deleteNotification,
  clearUserNotifications
} = require("./notificationController");

router.get("/user/:userId", getUserNotifications);
router.get("/employee/:employeeId", getEmployeeNotifications);
router.put("/read/:notificationId", markAsRead);
router.post("/test", createTestNotification);
router.delete("/notification/:notificationId", deleteNotification);
router.delete("/user/:userId", clearUserNotifications);
router.delete("/employee/:employeeId", clearEmployeeNotifications);


module.exports = router;