const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


  router.post("/enquiry", async (req, res) => {
    try {
      const { fullName, email, phone, serviceRequired, comments } =
        req.body;
  
      // save form
      const enquiry = await prisma.formSubmission.create({
        data: {
          formType: "enquiry",
          fullName,
          email,
          phone,
          serviceRequired,
          comments,
        },
      });
  
      // create dashboard notification
      await prisma.notification.create({
        data: {
          title: "New Enquiry Received",
          description: `${fullName} requested ${serviceRequired}`,
        },
      });
  
      res.json({ success: true, enquiry });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });


  router.post("/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, message } = req.body;
  
      const contact = await prisma.formSubmission.create({
        data: {
          formType: "contact",
          firstName,
          lastName,
          email,
          phone,
          message,
        },
      });
  
      // dashboard notification
      await prisma.notification.create({
        data: {
          title: "New Contact Message",
          description: `${firstName} ${lastName} sent a message`,
        },
      });
  
      res.json({ success: true, contact });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });



  router.get("/notifications", async (req, res) => {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
  
    res.json(notifications);
  });



  router.put("/notifications/:notificationId/read", async (req, res) => {
    const { notificationId } = req.params;
  
    const updated = await prisma.notification.update({
      where: { notificationId:notificationId },
      data: { isRead: true },
    });
  
    res.json(updated);
  });



module.exports = router