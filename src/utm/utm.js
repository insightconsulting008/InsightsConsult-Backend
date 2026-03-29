
const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma")
const crypto = require("crypto");

/* =====================================================
   🔥 UTM + REF LINK GENERATOR
// ===================================================== */
// const generateUTMLink = ({
//   baseUrl,
//   source,
//   medium,
//   campaign,
//   content,
//   term,
//   refCode,
// }) => {
//   const url = new URL(baseUrl);

//   url.searchParams.append("utm_source", source);
//   url.searchParams.append("utm_medium", medium);
//   url.searchParams.append("utm_campaign", campaign);

//   if (content) url.searchParams.append("utm_content", content);
//   if (term) url.searchParams.append("utm_term", term);
//   if (refCode) url.searchParams.append("ref", refCode); // 🔥

//   return url.toString();
// };

// /* =====================================================
//    🚀 CREATE UTM CAMPAIGN (ADMIN)
// ===================================================== */
// app.post("/admin/utm/create", async (req, res) => {
//   try {
//     const {
//       name,
//       baseUrl,
//       source,
//       medium,
//       campaign,
//       content,
//       term,
//       refCode,
//     } = req.body;

//     // Validation
//     if (!baseUrl || !source || !medium || !campaign) {
//       return res.status(400).json({
//         message: "baseUrl, source, medium, campaign required",
//       });
//     }

//     // Generate URL
//     const fullUrl = generateUTMLink({
//       baseUrl,
//       source,
//       medium,
//       campaign,
//       content,
//       term,
//       refCode,
//     });

//     // Save in DB
//     const data = await prisma.utmCampaign.create({
//       data: {
//         name,
//         baseUrl,
//         source,
//         medium,
//         campaign,
//         content,
//         term,
//         refCode,
//         fullUrl,
//       },
//     });

//     res.json({
//       success: true,
//       message: "UTM Campaign Created Successfully",
//       data,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* =====================================================
//    📊 GET ALL CAMPAIGNS
// ===================================================== */
// app.get("/admin/utm/all", async (req, res) => {
//   try {
//     const campaigns = await prisma.utmCampaign.findMany({
//       orderBy: { createdAt: "desc" },
//     });

//     res.json({
//       success: true,
//       data: campaigns,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* =====================================================
//    🔍 GET SINGLE CAMPAIGN
// ===================================================== */
// app.get("/admin/utm/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const campaign = await prisma.utmCampaign.findUnique({
//       where: { id },
//     });

//     if (!campaign) {
//       return res.status(404).json({ message: "Campaign not found" });
//     }

//     res.json({
//       success: true,
//       data: campaign,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



/* =====================================================
   🔥 UTM LINK GENERATOR
===================================================== */
// const generateUTMLink = ({
//   baseUrl,
//   source,
//   medium,
//   campaign,
//   content,
//   term,
//   refCode,
// }) => {
//   const url = new URL(baseUrl);

//   url.searchParams.append("utm_source", source);
//   url.searchParams.append("utm_medium", medium);
//   url.searchParams.append("utm_campaign", campaign);

//   if (content) url.searchParams.append("utm_content", content);
//   if (term) url.searchParams.append("utm_term", term);
//   if (refCode) url.searchParams.append("ref", refCode);

//   return url.toString();
// };

// /* =====================================================
//    🔥 SHORT CODE GENERATOR
// ===================================================== */
// const generateCode = () => {
//   return Math.random().toString(36).substring(2, 8);
// };

// /* =====================================================
//    🔥 TRACKING MIDDLEWARE
// ===================================================== */
// const extractTracking = (req, res, next) => {
//   const utmData = {};
//   let refCode = null;

//   Object.keys(req.body).forEach((key) => {
//     if (key.startsWith("utm_")) utmData[key] = req.body[key];
//     if (key === "ref") refCode = req.body[key];
//   });

//   req.tracking = { utmData, refCode };
//   next();
// };

// /* =====================================================
//    🚀 CREATE UTM CAMPAIGN
// ===================================================== */
// app.post("/admin/utm/create", async (req, res) => {
//   try {
//     const data = req.body;

//     const fullUrl = generateUTMLink(data);

//     const campaign = await prisma.utmCampaign.create({
//       data: {
//         ...data,
//         fullUrl,
//       },
//     });

//     res.json({ success: true, campaign });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* =====================================================
//    🔗 CREATE SHORT LINK
// ===================================================== */
// app.post("/short-link", async (req, res) => {
//   try {
//     const { fullUrl } = req.body;

//     let code;
//     let exists = true;

//     while (exists) {
//       code = generateCode();
//       const found = await prisma.shortLink.findUnique({ where: { code } });
//       if (!found) exists = false;
//     }

//     const link = await prisma.shortLink.create({
//       data: { code, fullUrl },
//     });

//     res.json({
//       shortUrl: `http://localhost:5000/u/${code}`,
//       link,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* =====================================================
//    🔥 REDIRECT + CLICK TRACK
// ===================================================== */
// app.get("/u/:code", async (req, res) => {
//   try {
//     const link = await prisma.shortLink.findUnique({
//       where: { code: req.params.code },
//     });

//     if (!link) return res.status(404).send("Not found");

//     await prisma.clickLog.create({
//       data: {
//         shortLinkId: link.id,
//         ip: req.ip,
//         userAgent: req.headers["user-agent"],
//       },
//     });

//     await prisma.shortLink.update({
//       where: { id: link.id },
//       data: { clicks: { increment: 1 } },
//     });

//     res.redirect(link.fullUrl);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });


// /* =====================================================
//    📊 ANALYTICS
// ===================================================== */

// // Revenue by influencer
// app.get("/analytics/ref", async (req, res) => {
//     const data = await prisma.payment.groupBy({
//       by: ["refCode"],
//       _sum: { amount: true },
//       _count: true,
//     });
//     res.json(data);
//   });
  
//   // Revenue by campaign
//   app.get("/analytics/campaign", async (req, res) => {
//     const payments = await prisma.payment.findMany();
  
//     const result = {};
  
//     payments.forEach((p) => {
//       const camp = p.utmData?.utm_campaign || "unknown";
  
//       if (!result[camp]) {
//         result[camp] = { revenue: 0, count: 0 };
//       }
  
//       result[camp].revenue += p.amount;
//       result[camp].count++;
//     });
  
//     res.json(result);
//   });

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//


/* =====================================================
   🔥 UTM LINK GENERATOR
===================================================== */
const generateUTMLink = ({
    baseUrl,
    source,
    medium,
    campaign,
    content,
    term,
    refCode,
  }) => {
    const url = new URL(baseUrl);
  
    url.searchParams.append("utm_source", source);
    url.searchParams.append("utm_medium", medium);
    url.searchParams.append("utm_campaign", campaign);
  
    if (content) url.searchParams.append("utm_content", content);
    if (term) url.searchParams.append("utm_term", term);
    if (refCode) url.searchParams.append("ref", refCode);
  
    return url.toString();
  };
  
  /* =====================================================
     🔥 SECURE SHORT CODE GENERATOR
  ===================================================== */
  const generateCode = () => {
    return crypto.randomBytes(3).toString("hex"); // 6 chars
  };
  
  /* =====================================================
     🔥 ENSURE UNIQUE CODE
  ===================================================== */
  const generateUniqueCode = async () => {
    let code;
    let exists = true;
  
    while (exists) {
      code = generateCode();
  
      const found = await prisma.shortLink.findUnique({
        where: { code },
      });
  
      if (!found) exists = false;
    }
  
    return code;
  };
  
  /* =====================================================
     🔥 TRACKING MIDDLEWARE (FIXED)
  ===================================================== */
  const extractTracking = (req, res, next) => {
    const utmData = {};
    let refCode = null;
  
    Object.keys(req.query).forEach((key) => {
      if (key.startsWith("utm_")) utmData[key] = req.query[key];
      if (key === "ref") refCode = req.query[key];
    });
  
    req.tracking = { utmData, refCode };
    next();
  };
  
  /* =====================================================
     🚀 CREATE UTM + SHORT LINK
  ===================================================== */
  router.post("/admin/utm/create", async (req, res) => {
    try {
      const {
        name,
        baseUrl,
        source,
        medium,
        campaign,
        content,
        term,
        refCode,
      } = req.body;
  
      if (!name || !baseUrl || !source || !medium || !campaign) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      const fullUrl = generateUTMLink({
        baseUrl,
        source,
        medium,
        campaign,
        content,
        term,
        refCode,
      });
  
      const utmCampaign = await prisma.utmCampaign.create({
        data: {
          name,
          baseUrl,
          source,
          medium,
          campaign,
          content,
          term,
          refCode,
          fullUrl,
        },
      });
  
      const code = await generateUniqueCode();
  
      await prisma.shortLink.create({
        data: {
          code,
          fullUrl,
        },
      });
  
      res.json({
        success: true,
        utmCampaign,
        shortUrl: `https://insightsconsult-backend.onrender.com/u/${code}`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  /* =====================================================
     🔗 CREATE SHORT LINK (OPTIONAL)
  ===================================================== */
  router.post("/short-link", async (req, res) => {
    try {
      const { fullUrl } = req.body;
  
      if (!fullUrl) {
        return res.status(400).json({ error: "fullUrl is required" });
      }
  
      const code = await generateUniqueCode();
  
      const link = await prisma.shortLink.create({
        data: { code, fullUrl },
      });
  
      res.json({
        shortUrl: `http://localhost:5000/u/${code}`,
        link,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  /* =====================================================
     🔥 REDIRECT + CLICK TRACK
  ===================================================== */
  router.get("/u/:code", async (req, res) => {
    try {
      const link = await prisma.shortLink.findUnique({
        where: { code: req.params.code },
      });
  
      if (!link) return res.status(404).send("Not found");
  
      await prisma.clickLog.create({
        data: {
          shortLinkId: link.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
      });
  
      await prisma.shortLink.update({
        where: { id: link.id },
        data: {
          clicks: { increment: 1 },
        },
      });
  
      res.redirect(link.fullUrl);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  

  /* =====================================================
     📊 ANALYTICS
  ===================================================== */
  
  // Campaign analytics
  router.get("/analytics/campaign", async (req, res) => {
    const data = await prisma.payment.groupBy({
      by: ["utmCampaign"],
      _sum: { amount: true },
      _count: true,
    });
  
    res.json(data);
  });
  
  // Influencer analytics
  router.get("/analytics/ref", async (req, res) => {
    const data = await prisma.payment.groupBy({
      by: ["refCode"],
      _sum: { amount: true },
      _count: true,
    });
  
    res.json(data);
  });

module.exports = router
  