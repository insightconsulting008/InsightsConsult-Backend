const prisma = require("../prisma/prisma");

/**
 * 📢 SEND REMINDER (Email / WhatsApp placeholder)
 */
async function sendReminder(reminder) {
  try {
    console.log("📢 Sending Reminder:");
    console.log("Service:", reminder.serviceName);
    console.log("Due Date:", reminder.dueDate);

    // 🔥 Build message
    const message = `
Reminder 🔔

Service: ${reminder.serviceName}
Due Date: ${new Date(reminder.dueDate).toDateString()}

Please complete before due date.
`;

    // 👉 TODO: Integrate Email / WhatsApp here
    // Example:
    // await sendEmail(user.email, message);
    // await sendWhatsApp(user.phone, message);

    return true;
  } catch (error) {
    console.error("❌ sendReminder error:", error);
    throw error;
  }
}

/**
 * 🔄 PROCESS REMINDERS (CRON WORKER)
 */
async function processReminders() {
  const now = new Date();

  console.log("\n⏰ Checking reminders at:", now.toLocaleString());

  try {
    // 1️⃣ Get pending reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        reminderDate: {
          lte: now,
        },
        status: "pending",
      },
      take: 50, // 🔥 batch limit (important for performance)
      orderBy: {
        reminderDate: "asc",
      },
    });

    console.log("📊 Pending reminders found:", reminders.length);

    if (reminders.length === 0) {
      console.log("✅ No reminders to process");
      return;
    }

    // 2️⃣ Process each reminder
    for (const r of reminders) {
      try {
        // 🔒 Lock (prevent duplicate processing)
        await prisma.reminder.update({
          where: { reminderId: r.reminderId },
          data: { status: "processing" },
        });

        // 📢 Send
        await sendReminder(r);

        // ✅ Mark as sent
        await prisma.reminder.update({
          where: { reminderId: r.reminderId },
          data: {
            status: "sent",
            sentAt: new Date(),
          },
        });

        console.log("✅ Sent:", r.reminderId);

      } catch (err) {
        console.error("❌ Failed:", r.reminderId, err.message);

        // ❌ Mark as failed
        await prisma.reminder.update({
          where: { reminderId: r.reminderId },
          data: {
            status: "failed",
            error: err.message,
          },
        });
      }
    }

  } catch (error) {
    console.error("❌ processReminders error:", error);
  }
}

module.exports = { processReminders };