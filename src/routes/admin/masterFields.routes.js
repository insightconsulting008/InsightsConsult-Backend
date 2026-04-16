const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


router.post("/", async (req, res) => {
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
              options: f.options,
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

// GET all master input fields
router.get("/", async (req, res) => {
    try {
      const masterFields = await prisma.masterInputField.findMany();
  
      res.json({ success: true, masterFields });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });  

module.exports = router
  