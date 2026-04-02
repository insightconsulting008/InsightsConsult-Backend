async function generateReminders(myService) {
    const service = myService.service;
  
    const dueDays = [10, 20];        // 🔥 multiple filings
    const reminderDays = [3, 1, 0];  // 🔔 reminders
  
    const monthsToGenerate = 2;
  
    for (let m = 0; m < monthsToGenerate; m++) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() + m);
  
      for (let dueDay of dueDays) {
  
        const lastDay = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth() + 1,
          0
        ).getDate();
  
        const validDay = Math.min(dueDay, lastDay);
  
        const dueDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          validDay
        );
  
        for (let r of reminderDays) {
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(dueDate.getDate() - r);
  
          await prisma.reminder.create({
            data: {
              myServiceId: myService.myServiceId,
  
              // 🔥 SNAPSHOT
              serviceName: service.name,
              serviceDescription: service.description,
              serviceType: service.serviceType,
              frequency: service.frequency,
  
              dueDate,
              reminderDate
            }
          });
        }
      }
    }
  }


  async function processReminders() {
    const now = new Date();
  
    const reminders = await prisma.reminder.findMany({
      where: {
        reminderDate: { lte: now },
        status: "pending"
      }
    });
  
    for (let r of reminders) {
      await sendReminder(r);
  
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "sent" }
      });
    }
  }


