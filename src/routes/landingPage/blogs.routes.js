  const express = require("express");
  const router = express.Router();
  const prisma = require("../../prisma/prisma");
  /* ==============================
     GET ALL BLOGS (Sorted by order)
  ============================== */
  router.get("/", async (req, res) => {
    try {
      const { search = "", page = 1, limit = 10,  type = "public" } = req.query;
  
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const skip = (pageNumber - 1) * pageSize;
  
      // Search condition
      const whereCondition = {
        published: type === "public",
        ...(search && {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              author: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
      };
      // Get total count (for pagination info)
      const totalBlogs = await prisma.blog.count({
        where: whereCondition,
      });
  
      const blogs = await prisma.blog.findMany({
        where: whereCondition,
        orderBy: [
          { createdAt: "desc" }, // latest fallback
        ],
        skip,
        take: pageSize,
      });
  
      res.json({
        total: totalBlogs,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalBlogs / pageSize),
        pageSize,
        data: blogs,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Fetch blogs failed" });
    }
  });

  /* ==============================
     GET SINGLE BLOG
  ============================== */
  router.get("/:slug", async (req, res) => {
    try {
      const blog = await prisma.blog.findUnique({
        where: { slug: req.params.slug },
      });
  
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
  
      // Ensure content order
      blog.content.sort((a, b) => a.order - b.order);
  
      res.json(blog);
    } catch (error) {
      res.status(500).json({ error: "Fetch blog failed" });
    }
  });


  module.exports = router;