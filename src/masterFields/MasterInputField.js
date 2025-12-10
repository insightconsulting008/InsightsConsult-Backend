const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");


router.post("/master-fields", async (req, res) => {
    try {
      const { fields } = req.body;
  
      if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ success: false, error: "fields array is required" });
      }
  
      const createdFields = await prisma.$transaction(
        fields.map(f =>
          prisma.masterInputField.create({
            data: {
              label: f.label,
              type: f.type,
              placeholder: f.placeholder || "",
              required: f.required ?? false,
            },
          })
        )
      );
  
      res.json({ success: true, masterFields: createdFields });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  module.exports = router
  