const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {blogImgUpload} = require("../../utils/multer")
const {deleteS3Object} = require("../../utils/deleteS3Object")

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
    "/",
    blogImgUpload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "contentImages", maxCount: 20 }
    ]),
    async (req, res) => {
      try {
        const { title, description, author, content, published,  } = req.body;
  
        if (!title) {
          return res.status(400).json({ message: "Title is required" });
        }
  
        const slug = makeSlug(title) + "-" + Date.now();
  
        let parsedContent = JSON.parse(content || "[]");
  
        // ✅ Get uploaded S3 URLs
        const uploadedImages = req.files?.contentImages
          ? req.files.contentImages.map(file => file.location)
          : [];
  
        // ✅ Replace fileIndex with actual S3 URL
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
  
        // ✅ Sort by order
        parsedContent.sort((a, b) => a.order - b.order);
  
        const thumbnailUrl = req.files?.thumbnail
          ? req.files.thumbnail[0].location
          : null;
  
        const blog = await prisma.blog.create({
          data: {
            title,
            description,
            content: parsedContent,
            author,
            thumbnail: thumbnailUrl,
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
     UPDATE BLOG
  ============================== */
  // router.put("/blogs/:id",blogImgUpload.fields([
  //     { name: "thumbnail", maxCount: 1 },
  //     { name: "contentImages", maxCount: 20 }
  //   ]),
  //   async (req, res) => {
  //     try {
  //       const { id } = req.params;
  //       const { title, description, content, published } = req.body;
  
  //       const existingBlog = await prisma.blog.findUnique({
  //         where: { blogId: id },
  //       });
  
  //       if (!existingBlog) {
  //         return res.status(404).json({ message: "Blog not found" });
  //       }
  
  //       let parsedContent = JSON.parse(content || "[]");
  
  //       const uploadedImages = req.files?.contentImages
  //         ? req.files.contentImages.map(file => file.location)
  //         : [];
  
  //       parsedContent = parsedContent.map(block => {
  //         if (block.type === "image" && block.fileIndex !== undefined) {
  //           return {
  //             type: "image",
  //             url: uploadedImages[block.fileIndex] || null,
  //             order: block.order
  //           };
  //         }
  //         return block;
  //       });
  
  //       parsedContent.sort((a, b) => a.order - b.order);
  
  //       const thumbnailUrl = req.files?.thumbnail
  //         ? req.files.thumbnail[0].location
  //         : existingBlog.thumbnail;
  
  //       const updatedBlog = await prisma.blog.update({
  //         where: { blogId: id },
  //         data: {
  //           title,
  //           description,
  //           content: parsedContent,
  //           thumbnail: thumbnailUrl,
  //           published: published === "true",
  //         },
  //       });
  
  //       res.json(updatedBlog);
  //     } catch (error) {
  //       console.log(error);
  //       res.status(500).json({ error: "Update blog failed" });
  //     }
  //   }
  // );
  

  router.put(
    "/:id",
    blogImgUpload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "contentImages", maxCount: 20 }
    ]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { title, description, content, published ,author } = req.body;
  
        // ✅ 1. Check blog exists
        const existingBlog = await prisma.blog.findUnique({
          where: { blogId: id },
        });
  
        if (!existingBlog) {
          return res.status(404).json({
            success: false,
            message: "Blog not found",
          });
        }
  
        // ✅ 2. Parse content safely
        let parsedContent = [];
        try {
          parsedContent = JSON.parse(content || "[]");
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: "Invalid content JSON",
          });
        }
  
        // ✅ 3. Get uploaded images (S3 → location)
        const uploadedImages = req.files?.contentImages
          ? req.files.contentImages.map(file => file.location)
          : [];
  
        // ✅ 4. Map content blocks
        parsedContent = parsedContent.map((block) => {
          if (block.type === "image") {
            return {
              type: "image",
              url:
                block.fileIndex !== undefined
                  ? uploadedImages[block.fileIndex] || block.url || null
                  : block.url || null,
              order: block.order,
            };
          }
          return block;
        });
  
        // ✅ 5. Sort content
        parsedContent.sort((a, b) => a.order - b.order);
  
        // 🔥 6. DELETE UNUSED OLD CONTENT IMAGES
  
        // OLD images
        const oldImages = (existingBlog.content || [])
          .filter(block => block.type === "image")
          .map(block => block.url)
          .filter(Boolean);
  
        // NEW images
        const newImages = parsedContent
          .filter(block => block.type === "image")
          .map(block => block.url)
          .filter(Boolean);
  
        // Find removed images
        const imagesToDelete = oldImages.filter(
          (url) => !newImages.includes(url)
        );
  
        // Delete from S3
        await Promise.all(
          imagesToDelete.map(url => deleteS3Object(url))
        );
  
        // 🔥 7. HANDLE THUMBNAIL DELETE
        if (req.files?.thumbnail && existingBlog.thumbnail) {
          await deleteS3Object(existingBlog.thumbnail);
        }
  
        // ✅ 8. New thumbnail
        const thumbnailUrl = req.files?.thumbnail
          ? req.files.thumbnail[0].location
          : existingBlog.thumbnail;
  
        // ✅ 9. Update blog
        const updatedBlog = await prisma.blog.update({
          where: { blogId: id },
          data: {
            title: title ?? existingBlog.title,
            description: description ?? existingBlog.description,
            content: parsedContent,
            thumbnail: thumbnailUrl,
            author: author ?? existingBlog.author, // ✅ FIXED
            published:
              published !== undefined
                ? published === "true" || published === true
                : existingBlog.published,
          },
        });
  
        // ✅ 10. Response
        res.json({
          success: true,
          message: "Blog updated successfully",
          data: updatedBlog,
        });
  
      } catch (error) {
        console.error("UPDATE BLOG ERROR:", error);
        res.status(500).json({
          success: false,
          message: "Update blog failed",
        });
      }
    }
  );
  /* ==============================
     DELETE BLOG
  ============================== */
  router.delete("/:id", async (req, res) => {
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