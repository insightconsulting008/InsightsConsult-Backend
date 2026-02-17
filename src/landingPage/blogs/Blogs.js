const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const config = require("../../utils/config")

function makeSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

/* ---------------- CREATE BLOG ---------------- */
router.post("/blogs", async (req, res) => {
    try {
      const { title, description, content, author, coverImage, meta, published } = req.body;
  
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content required" });
      }
  
      const slug = makeSlug(title) + "-" + Date.now();
  
      const blog = await prisma.blog.create({
        data: {
          title,
          description,
          content,
          author,
          coverImage,
          meta,
          slug,
          published: published ?? true
        }
      });
  
      res.json(blog);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Create blog failed" });
    }
  });


  /* ---------------- GET BLOG LIST (SEARCH + PAGINATION) ---------------- */
router.get("/blogs", async (req, res) => {
    try {
  
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const search = req.query.search || "";
  
      const where = {
        published: true,
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } }
        ]
      };
  
      const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" }
        }),
        prisma.blog.count({ where })
      ]);
  
      res.json({
        total,
        page,
        pages: Math.ceil(total / limit),
        data: blogs
      });
  
    } catch (err) {
      res.status(500).json({ error: "Fetch blogs failed" });
    }
  });


  /* ---------------- GET BLOG BY SLUG ---------------- */
router.get("/blogs/:slug", async (req, res) => {
    try {
  
      const blog = await prisma.blog.findUnique({
        where: { slug: req.params.slug }
      });
  
      if (!blog) return res.status(404).json({ message: "Blog not found" });
  
      res.json(blog);
  
    } catch (err) {
      res.status(500).json({ error: "Fetch blog failed" });
    }
  });


  /* ---------------- UPDATE BLOG ---------------- */
router.put("/blogs/:blogId", async (req, res) => {
    try {
  
      const { title, description, content, author, coverImage, meta, published } = req.body;
  
      const data = {
        title,
        description,
        content,
        author,
        coverImage,
        meta,
        published
      };
  
      // if title changed -> update slug
      if (title) {
        data.slug = makeSlug(title) + "-" + Date.now();
      }
  
      const blog = await prisma.blog.update({
        where: { blogId: req.params.blogId },
        data
      });
  
      res.json(blog);
  
    } catch (err) {
      res.status(500).json({ error: "Update failed" });
    }
  });
  
  /* ---------------- DELETE BLOG ---------------- */
  router.delete("/blogs/:blogId", async (req, res) => {
    try {
  
      await prisma.blog.delete({
        where: { blogId: req.params.blogId }
      });
  
      res.json({ message: "Deleted successfully" });
  
    } catch (err) {
      res.status(500).json({ error: "Delete failed" });
    }
  });

module.exports = router