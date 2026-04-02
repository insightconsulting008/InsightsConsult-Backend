const prisma = require("../prisma/prisma");

const generateReminders = async (myService) => {
    console.log("my service details:",myService)
  try {
    if (!myService || !myService.service) {
      console.log("⛔ Invalid myService input");
      return;
    }

    const service = myService.service;

    console.log("👉 Generating FULL reminders for:", service.name);

    // 🚫 Validate config
    if (!service?.dueDay || !service?.reminderDays) {
      console.log("⛔ Missing dueDay or reminderDays");
      return;
    }

    // ✅ Parse values
    let dueDays =
      typeof service.dueDay === "string"
        ? JSON.parse(service.dueDay)
        : service.dueDay;

    let reminderDays =
      typeof service.reminderDays === "string"
        ? JSON.parse(service.reminderDays)
        : service.reminderDays;

    if (!Array.isArray(dueDays) || !Array.isArray(reminderDays)) {
      console.log("⛔ Invalid dueDay/reminderDays");
      return;
    }

    // 🔥 OPTION 1 → FULL GENERATION
    const duration = parseInt(service.duration) 
    //|| 12; // default 12 months

    const remindersToCreate = [];

    for (let m = 0; m < duration; m++) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() + m);

      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();

      const lastDay = new Date(year, month + 1, 0).getDate();

      for (let dueDay of dueDays) {
        const validDay = Math.min(dueDay, lastDay);
        const dueDate = new Date(year, month, validDay);

        for (let r of reminderDays) {
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(dueDate.getDate() - r);

          // 🚫 skip past
          if (reminderDate < new Date()) continue;

          remindersToCreate.push({
            myServiceId: myService.myServiceId,

            // 🔥 SNAPSHOT
            serviceName: service.name,
            serviceDescription: service.description,
            serviceType: service.serviceType,
            frequency: service.frequency,
            duration: service.duration,
            durationUnit: service.durationUnit,

            dueDate,
            reminderDate,
            status: "pending"
          });
        }
      }
    }

    console.log("📊 Total reminders:", remindersToCreate.length);

    if (remindersToCreate.length === 0) {
      console.log("⚠️ No reminders to insert");
      return;
    }

    // 🚀 Insert (DB handles duplicates)
    await prisma.reminder.createMany({
      data: remindersToCreate,
      skipDuplicates: true
    });

    console.log("✅ All reminders generated successfully");

  } catch (error) {
    console.error("❌ generateReminders error:", error);
  }
};

module.exports = { generateReminders };