const prisma = require("../prisma/prisma");

const logHistory = async ({
  applicationId,
  action,
  oldValue,
  newValue,
  doneByRole,
  doneById,
  message,
  applicationTrackStepId,
  servicePeriodId,
  periodStepId,
  documentId
}) => {
  try {
    await prisma.applicationHistory.create({
      data: {
        applicationId,
        action,
        oldValue,
        newValue,
        doneByRole,
        doneById,
        message,
        applicationTrackStepId,
        servicePeriodId,
        periodStepId,
        documentId
      }
    });
  } catch (error) {
    console.error("History log failed:", error);
  }
};

module.exports = { logHistory };


// await logHistory({
//     applicationId,
//     action: "STATUS_CHANGED",
//     oldValue: oldApp.status,
//     newValue: updatedApp.status,
//     doneByRole: "STAFF",
//     doneById: staffId,
//     message: `Status changed to ${status}`
//   });