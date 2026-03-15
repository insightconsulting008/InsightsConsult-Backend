const prisma = require("../prisma/prisma");


const createTestNotification = async (req, res) => {
    try {
  
      const { title, description, userId, employeeId } = req.body;
  
      const notification = await prisma.notification.create({
        data: {
          title,
          description,
          userId: userId || null,
          employeeId: employeeId || null
        }
      });
  
      res.json({
        success: true,
        message: "Test notification created",
        data: notification
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server Error"
      });
    }
  };

const getUserNotifications = async (req, res) => {

  const { userId } = req.params;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    data: notifications
  });

};

const getEmployeeNotifications = async (req, res) => {

  const { employeeId } = req.params;

  const notifications = await prisma.notification.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    data: notifications
  });

};

const markAsRead = async (req, res) => {

  const { notificationId } = req.params;

  await prisma.notification.update({
    where: { notificationId },
    data: { isRead: true }
  });

  res.json({
    success: true,
    message: "Notification marked as read"
  });

};

module.exports = {
  getUserNotifications,
  getEmployeeNotifications,
  markAsRead,
  createTestNotification
};