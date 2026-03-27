const prisma = require("../prisma/prisma");

const createNotification = async ({
    title,
    description,
    userId = null,
    employeeId = null,
    redirectUrl,
  }) => {
    return await prisma.notification.create({
      data: {
        title,
        description,
        userId,
        employeeId,
        redirectUrl,
      },
    });
  };

module.exports = { createNotification };