const prisma = require("../prisma/prisma");

const createNotification = async ({
  title,
  description,
  userId,
  employeeId
}) => {

  await prisma.notification.create({
    data: {
      title,
      description,
      userId,
      employeeId
    }
  });

};

module.exports = { createNotification };