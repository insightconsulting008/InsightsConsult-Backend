 const express = require("express");
 const router = express.Router();
 const prisma = require("../../prisma/prisma");



router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    // default sorting = desc
    const order = req.query.order === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phoneNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        createdAt: order,
      },
      skip,
      take: limit,
      select: {
        userId: true,
        name: true,
        email: true,
        phoneNumber: true,
        photoUrl: true,
        provider: true,
        providerId: true,
        role: true,
        createdAt: true,
      },
    });

    const totalUsers = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ],
      },
    });

    res.json({
      success: true,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router