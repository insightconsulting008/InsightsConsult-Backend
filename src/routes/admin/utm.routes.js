const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma")
const crypto = require("crypto");
  
  
  /* =========================
     🔥 SLUG FUNCTION
  ========================= */
  const slugify = (text) => {
    return text.toLowerCase().trim().replace(/\s+/g, "-");
  };
  
  /* =========================
     🔥 UTM LINK GENERATOR
  ========================= */
  const generateUTMLink = ({
    baseUrl,
    source,
    medium,
    campaignName, // ✅ FIXED
    content,
    term,
    refCode,
  }) => {
    let url = `${baseUrl}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaignName}`;
  
    if (content) url += `&utm_content=${content}`;
    if (term) url += `&utm_term=${term}`;
    if (refCode) url += `&refCode=${refCode}`;
  
    return url;
  };
  
  /* =========================
     🚀 CREATE UTM CAMPAIGN
  ========================= */
  router.post("/create", async (req, res) => {
    try {
      const {
        baseUrl,
      source,
      medium,
      campaignName,
      content,
      term,
      refCode,
      } = req.body;
  
      // ✅ validation
      if ( !baseUrl || !source || !medium || !campaignName) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // 🔥 STEP 1: SLUG
      let baseSlug = slugify(campaignName);
      let finalSlug = baseSlug;
  
      let count = 1;
  
      // 🔥 STEP 2: UNIQUE (increment)
      while (true) {
        const exists = await prisma.utmCampaign.findUnique({
          where: { campaignName: finalSlug },
        });
  
        if (!exists) break;
  
        finalSlug = `${baseSlug}-${count}`;
        count++;
      }
  
      // 🔥 STEP 3: GENERATE LINK
      const fullUrl = generateUTMLink({
        baseUrl,
        source,
        medium,
        campaignName: finalSlug,
        content,
        term,
        refCode,
      });
  
      // 🔥 STEP 4: SAVE
      const utmCampaign = await prisma.utmCampaign.create({
        data: {
          baseUrl,
          source,
          medium,
          campaignName: finalSlug, // ✅ FIXED
          content: content || null,
          term: term || null,
          refCode: refCode || null,
          fullUrl,
        },
      });
  
      // ✅ RESPONSE
      res.json({
        success: true,
        utmCampaign,
        fullUrl,
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get("/all", async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query;
  
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
  
      // ✅ Build search filter
      const where = search
        ? {
            OR: [
              { campaignName: { contains: search, mode: "insensitive" } },
              { source: { contains: search, mode: "insensitive" } },
              { medium: { contains: search, mode: "insensitive" } },
              { baseUrl: { contains: search, mode: "insensitive" } },
              { refCode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};
  
      // ✅ Get total count (for frontend pagination)
      const total = await prisma.utmCampaign.count({ where });
  
      // ✅ Fetch paginated data
      const utmCampaigns = await prisma.utmCampaign.findMany({
        where,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: "desc", // 👈 make sure you have this field
        },
      });
  
      res.json({
        success: true,
        data: utmCampaigns,
  
        // 🔥 Pagination meta
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "Something went wrong",
      });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const utmCampaign = await prisma.utmCampaign.findUnique({
        where: {
          utmCampaignId: id,
        },
      });
  
      if (!utmCampaign) {
        return res.status(404).json({
          error: "UTM Campaign not found",
        });
      }
  
      res.json({
        success: true,
        data: utmCampaign,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Something went wrong",
      });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      // ✅ Check if exists
      const existing = await prisma.utmCampaign.findUnique({
        where: { utmCampaignId: id },
      });
  
      if (!existing) {
        return res.status(400).json({
          success: false,
          message: "UTM Campaign not found",
        });
      }
  
      // ✅ Delete
      await prisma.utmCampaign.delete({
        where: { utmCampaignId: id },
      });
  
      res.json({
        success: true,
        message: "UTM Campaign deleted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "Something went wrong",
      });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const {
        baseUrl,
        source,
        medium,
        campaignName,
        content,
        term,
        refCode,
      } = req.body;
  
      // ✅ 1. Check existing
      const existing = await prisma.utmCampaign.findUnique({
        where: { utmCampaignId: id },
      });
  
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "UTM Campaign not found",
        });
      }
  
      // ✅ 2. Handle slug change ONLY if campaignName updated
      let finalSlug = existing.campaignName;
  
      if (campaignName && campaignName !== existing.campaignName) {
        let baseSlug = slugify(campaignName);
        finalSlug = baseSlug;
  
        let count = 1;
  
        while (true) {
          const exists = await prisma.utmCampaign.findFirst({
            where: { campaignName: finalSlug },
          });
  
          if (!exists) break;
  
          finalSlug = `${baseSlug}-${count}`;
          count++;
        }
      }
  
      // ✅ 3. Regenerate URL with updated values
      const fullUrl = generateUTMLink({
        baseUrl: baseUrl || existing.baseUrl,
        source: source || existing.source,
        medium: medium || existing.medium,
        campaignName: finalSlug,
        content: content ?? existing.content,
        term: term ?? existing.term,
        refCode: refCode ?? existing.refCode,
      });
  
      // ✅ 4. Update DB
      const updated = await prisma.utmCampaign.update({
        where: { utmCampaignId: id },
        data: {
          baseUrl: baseUrl || existing.baseUrl,
          source: source || existing.source,
          medium: medium || existing.medium,
          campaignName: finalSlug,
          content: content ?? existing.content,
          term: term ?? existing.term,
          refCode: refCode ?? existing.refCode,
          fullUrl,
        },
      });
  
      // ✅ 5. Response
      res.json({
        success: true,
        data: updated,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });


/* =====================================================
 📊 ANALYTICS
===================================================== */
  
  // Campaign analytics
  router.get("/analytics/campaign", async (req, res) => {
    try {
      const data = await prisma.payment.groupBy({
        by: ["utmCampaignName"], // ✅ FIXED
        where: {
          status: "PAID", // ✅ only successful payments
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      });
  
      // 🔥 Clean response format
      const formatted = data.map((item) => ({
        campaign: item.utmCampaignName || "Direct/Unknown",
        totalRevenue: item._sum.amount || 0,
        totalConversions: item._count._all,
      }));
  
      res.json({
        success: true,
        data: formatted,
      });
  
    } catch (err) {
      console.error("CAMPAIGN ANALYTICS ERROR:", err);
  
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });
  // Influencer analytics
  router.get("/analytics/ref", async (req, res) => {
    try {
      const data = await prisma.payment.groupBy({
        by: ["refCode"],
        where: {
          status: "PAID", // ✅ important
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      });
  
      const formatted = data.map((item) => ({
        refCode: item.refCode || "No Ref Code",
        totalRevenue: item._sum.amount || 0,
        totalConversions: item._count._all,
      }));
  
      res.json({
        success: true,
        data: formatted,
      });
  
    } catch (err) {
      console.error("REF ANALYTICS ERROR:", err);
  
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  router.get("/analytics/campaign-users", async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
  
        select: {
          name: true,
          email: true,
          phoneNumber: true,
          utmCampaignName: true,
        },
      });
  
      // 🔥 Group manually
      const grouped = {};
  
      users.forEach((u) => {
        const campaign = u.utmCampaignName || "Direct";
  
        if (!grouped[campaign]) {
          grouped[campaign] = {
            campaign,
            count: 0,
            users: [],
          };
        }
  
        grouped[campaign].count++;
  
        grouped[campaign].users.push({
          name: u.name,
          email: u.email,
          phone: u.phoneNumber,
        });
      });
  
      res.json({
        success: true,
        data: Object.values(grouped),
      });
  
    } catch (err) {
      console.error("CAMPAIGN USERS ERROR:", err);
  
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });


module.exports = router