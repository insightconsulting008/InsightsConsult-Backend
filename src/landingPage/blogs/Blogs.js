const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {blogImgUpload} = require("../../utils/multer")


/* ==============================
   SLUG FUNCTION
============================== */
function makeSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }
  
  /* ==============================
     CREATE BLOG
  ============================== */
  router.post(
    "/blogs",
    blogImgUpload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "contentImages", maxCount: 20 }
    ]),
    async (req, res) => {
      try {
        const { title, description, author, content, published, order } = req.body;
  
        if (!title) {
          return res.status(400).json({ message: "Title is required" });
        }
  
        const slug = makeSlug(title) + "-" + Date.now();
  
        let parsedContent = JSON.parse(content || "[]");
  
        const uploadedImages = req.files?.contentImages
          ? req.files.contentImages.map(file => file.path)
          : [];
  
        // Replace fileIndex with actual URL
        parsedContent = parsedContent.map(block => {
          if (block.type === "image" && block.fileIndex !== undefined) {
            return {
              type: "image",
              url: uploadedImages[block.fileIndex] || null,
              order: block.order
            };
          }
          return block;
        });
  
        // Sort blocks
        parsedContent.sort((a, b) => a.order - b.order);
  
        const thumbnailUrl = req.files?.thumbnail
          ? req.files.thumbnail[0].path
          : null;
  
        const blog = await prisma.blog.create({
          data: {
            title,
            description,
            content: parsedContent,
            author,
            thumbnail: thumbnailUrl,
            order: order ? parseInt(order) : 0,
            slug,
            published: published === "true",
          },
        });
  
        res.status(201).json(blog);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Create blog failed" });
      }
    }
  );
  
  /* ==============================
     GET ALL BLOGS (Sorted by order)
  ============================== */
  router.get("/blogs", async (req, res) => {
    try {
      const blogs = await prisma.blog.findMany({
        orderBy: [
          { order: "asc" },
          { createdAt: "desc" }
        ],
      });
  
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: "Fetch blogs failed" });
    }
  });
  
  /* ==============================
     GET SINGLE BLOG
  ============================== */
  router.get("/blogs/:slug", async (req, res) => {
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
  
  /* ==============================
     UPDATE BLOG
  ============================== */
  router.put(
    "/blogs/:id",
    blogImgUpload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "contentImages", maxCount: 20 }
    ]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { title, description, content, published, order } = req.body;
  
        const existingBlog = await prisma.blog.findUnique({
          where: { blogId: id },
        });
  
        if (!existingBlog) {
          return res.status(404).json({ message: "Blog not found" });
        }
  
        let parsedContent = JSON.parse(content || "[]");
  
        const uploadedImages = req.files?.contentImages
          ? req.files.contentImages.map(file => file.path)
          : [];
  
        parsedContent = parsedContent.map(block => {
          if (block.type === "image" && block.fileIndex !== undefined) {
            return {
              type: "image",
              url: uploadedImages[block.fileIndex] || null,
              order: block.order
            };
          }
          return block;
        });
  
        parsedContent.sort((a, b) => a.order - b.order);
  
        const thumbnailUrl = req.files?.thumbnail
          ? req.files.thumbnail[0].path
          : existingBlog.thumbnail;
  
        const updatedBlog = await prisma.blog.update({
          where: { blogId: id },
          data: {
            title,
            description,
            content: parsedContent,
            thumbnail: thumbnailUrl,
            order: order ? parseInt(order) : existingBlog.order,
            published: published === "true",
          },
        });
  
        res.json(updatedBlog);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Update blog failed" });
      }
    }
  );
  
  /* ==============================
     DELETE BLOG
  ============================== */
  router.delete("/blogs/:id", async (req, res) => {
    try {
      await prisma.blog.delete({
        where: { blogId: req.params.id },
      });
  
      res.json({ message: "Blog deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Delete blog failed" });
    }
  });


module.exports = router