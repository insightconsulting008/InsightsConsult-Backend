async function generateReminders(myService) {
    const service = myService.service;
  
    console.log("👉 Service Loaded:", service.name);
  
    // 🚫 Skip if config missing
    if (!service?.dueDay || !service?.reminderDays) {
      console.log("⛔ Missing dueDay or reminderDays → skipping");
      return;
    }
  
    // ✅ Parse dueDays
    let dueDays = service.dueDay;
    if (typeof dueDays === "string") dueDays = JSON.parse(dueDays);
    console.log("📅 Due Days:", dueDays);
  
    // ✅ Parse reminderDays
    let reminderDays = service.reminderDays;
    if (typeof reminderDays === "string") reminderDays = JSON.parse(reminderDays);
    console.log("🔔 Reminder Days:", reminderDays);
  
    if (!Array.isArray(dueDays) || !Array.isArray(reminderDays)) {
      console.log("⛔ Invalid config → skipping");
      return;
    }
  
    const monthsToGenerate = 2;
    const remindersToCreate = [];
  
    for (let m = 0; m < monthsToGenerate; m++) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() + m);
  
      console.log(`\n📆 Processing Month Offset: ${m}`);
      console.log("➡️ Base Date:", baseDate);
  
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
  
      const lastDay = new Date(year, month + 1, 0).getDate();
      console.log("📌 Last Day of Month:", lastDay);
  
      for (let dueDay of dueDays) {
        const validDay = Math.min(dueDay, lastDay);
  
        const dueDate = new Date(year, month, validDay);
  
        console.log(`\n🎯 Due Day: ${dueDay} → Valid Day: ${validDay}`);
        console.log("📅 Due Date:", dueDate);
  
        for (let r of reminderDays) {
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(dueDate.getDate() - r);
  
          console.log(`   🔔 Reminder -${r} days →`, reminderDate);
  
          remindersToCreate.push({
            myServiceId: myService.myServiceId,
            serviceName: service.name,
            serviceDescription: service.description,
            serviceType: service.serviceType,
            frequency: service.frequency,
            dueDate,
            reminderDate,
          });
        }
      }
    }
  
    console.log("\n🚀 Total Reminders to Insert:", remindersToCreate.length);
  
    await prisma.reminder.createMany({
      data: remindersToCreate,
    });
  
    console.log("✅ Reminders inserted successfully");
  }


  //what if i  edit later only one remainder or need to add remain  means it is possibleble and iif i dont need the remainder i need to off for the certailn useer or service  adn then if they want remainder setting on and offf


  async function generateReminders(myService) {
    console.log("1️⃣ Function started");
  
    const service = myService.service;
    console.log("2️⃣ Service loaded:", service);
  
    if (!service?.dueDay || !service?.reminderDays) {
      console.log("❌ Missing config → exit");
      return;
    }
  
    let dueDays = service.dueDay;
    console.log("3️⃣ Raw dueDays:", dueDays);
  
    if (typeof dueDays === "string") {
      dueDays = JSON.parse(dueDays);
    }
    console.log("4️⃣ Parsed dueDays:", dueDays);
  
    let reminderDays = service.reminderDays;
    console.log("5️⃣ Raw reminderDays:", reminderDays);
  
    if (typeof reminderDays === "string") {
      reminderDays = JSON.parse(reminderDays);
    }
    console.log("6️⃣ Parsed reminderDays:", reminderDays);
  
    if (!Array.isArray(dueDays) || !Array.isArray(reminderDays)) {
      console.log("❌ Invalid arrays → exit");
      return;
    }
  
    const monthsToGenerate = 2;
    console.log("7️⃣ Months to generate:", monthsToGenerate);
  
    const remindersToCreate = [];
  
    for (let m = 0; m < monthsToGenerate; m++) {
      console.log(`\n8️⃣ Loop month index: ${m}`);
  
      const baseDate = new Date("2026-04-15"); // fixed for demo
      baseDate.setMonth(baseDate.getMonth() + m);
  
      console.log("9️⃣ Base date:", baseDate);
  
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
  
      console.log("🔟 Year:", year, "Month:", month);
  
      const lastDay = new Date(year, month + 1, 0).getDate();
      console.log("11️⃣ Last day of month:", lastDay);
  
      for (let dueDay of dueDays) {
        console.log("\n12️⃣ Original dueDay:", dueDay);
  
        const validDay = Math.min(dueDay, lastDay);
        console.log("13️⃣ Valid dueDay:", validDay);
  
        const dueDate = new Date(year, month, validDay);
        console.log("14️⃣ Due date:", dueDate);
  
        for (let r of reminderDays) {
          console.log("15️⃣ Reminder offset:", r);
  
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(dueDate.getDate() - r);
  
          console.log("16️⃣ Reminder date:", reminderDate);
  
          remindersToCreate.push({
            myServiceId: myService.myServiceId,
            dueDate,
            reminderDate,
          });
        }
      }
    }
  
    console.log("\n17️⃣ Total reminders:", remindersToCreate.length);
  }

  ////latest




/**
 * 🔔 GENERATE REMINDERS (DB-DRIVEN)
 */
async function generateReminders(myService) {
  const service = myService.service;

  console.log("👉 Service:", service.name);

  // 🚫 Skip if admin didn't configure
  if (!service?.dueDay || !service?.reminderDays) {
    console.log("⛔ Missing dueDay or reminderDays → skipping");
    return;
  }

  // ✅ Parse dueDays
  let dueDays = service.dueDay;
  if (typeof dueDays === "string") dueDays = JSON.parse(dueDays);

  // ✅ Parse reminderDays
  let reminderDays = service.reminderDays;
  if (typeof reminderDays === "string") reminderDays = JSON.parse(reminderDays);

  // 🚫 Validate
  if (!Array.isArray(dueDays) || !Array.isArray(reminderDays)) {
    console.log("⛔ Invalid config → skipping");
    return;
  }

  const monthsToGenerate = 2;
  const remindersToCreate = [];

  for (let m = 0; m < monthsToGenerate; m++) {
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() + m);

    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const lastDay = new Date(year, month + 1, 0).getDate();

    console.log(`\n📆 Month Offset: ${m}`);
    console.log("📌 Last Day:", lastDay);

    for (let dueDay of dueDays) {
      const validDay = Math.min(dueDay, lastDay);

      const dueDate = new Date(year, month, validDay);

      console.log(`🎯 DueDay: ${dueDay} → Final: ${validDay}`);
      console.log("📅 DueDate:", dueDate);

      for (let r of reminderDays) {
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(dueDate.getDate() - r);

        console.log(`   🔔 Reminder -${r}:`, reminderDate);

        remindersToCreate.push({
          myServiceId: myService.myServiceId,

          // 🔥 SNAPSHOT
          serviceName: service.name,
          serviceDescription: service.description,
          serviceType: service.serviceType,
          frequency: service.frequency,

          dueDate,
          reminderDate,
        });
      }
    }
  }

  console.log("\n🚀 Total reminders:", remindersToCreate.length);

  // ⚡ Bulk insert
  await prisma.reminder.createMany({
    data: remindersToCreate,
  });

  console.log("✅ Reminders inserted");
}

/**
 * 📩 SEND REMINDER (Mock)
 */
async function sendReminder(reminder) {
  console.log(
    `📢 Sending reminder: ${reminder.serviceName} | Due: ${reminder.dueDate}`
  );

  // 👉 integrate WhatsApp / Email here
}

/**
 * 🔄 PROCESS REMINDERS (CRON JOB)
 */
async function processReminders() {
  const now = new Date();

  console.log("\n⏰ Checking reminders at:", now);

  const reminders = await prisma.reminder.findMany({
    where: {
      reminderDate: { lte: now },
      status: "pending",
    },
  });

  console.log("📊 Pending reminders:", reminders.length);

  for (let r of reminders) {
    try {
      await sendReminder(r);

      await prisma.reminder.update({
        where: { reminderId: r.reminderId },
        data: {
          status: "sent",
          sentAt: new Date(),
        },
      });

      console.log("✅ Sent:", r.reminderId);
    } catch (err) {
      await prisma.reminder.update({
        where: { reminderId: r.reminderId },
        data: {
          status: "failed",
          error: err.message,
        },
      });

      console.log("❌ Failed:", r.reminderId);
    }
  }
}