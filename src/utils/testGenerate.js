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