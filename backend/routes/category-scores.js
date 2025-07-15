const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

const favoriteScore = 5
const shelfScore = 4
const joinchannelScore = 3
const commentScore = 2

// Update category scores for a user
router.post("/update", async (req, res) => {
  try {
    const { userId, categoryScores } = req.body;

    if (!userId || !categoryScores) {
      return res
        .status(400)
        .json({ error: "userId and categoryScores are required" });
    }

    // Convert userId to integer
    const userIdInt = parseInt(userId);

    // Delete existing scores for this user
    await prisma.userCategoryScore.deleteMany({
      where: { user_id: userIdInt },
    });

    // Insert new scores
    const scoreEntries = Object.entries(categoryScores).map(
      ([category, score]) => ({
        user_id: userIdInt,
        category: category.toLowerCase().trim(),
        score: parseFloat(score),
      })
    );

    if (scoreEntries.length > 0) {
      await prisma.userCategoryScore.createMany({
        data: scoreEntries,
      });
    }

    res.json({
      message: "Category scores updated successfully",
      updatedCategories: scoreEntries.length,
    });
  } catch (error) {
    console.error("Error updating category scores:", error);
    res.status(500).json({ error: "Failed to update category scores" });
  }
});

// Get top categories for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const userIdInt = parseInt(userId);

    const topCategories = await prisma.userCategoryScore.findMany({
      where: { user_id: userIdInt },
      orderBy: { score: "desc" },
      take: limit,
    });

    res.json(topCategories);
  } catch (error) {
    console.error("Error fetching top categories:", error);
    res.status(500).json({ error: "Failed to fetch top categories" });
  }
});

// Get all category scores for a user
router.get("/:userId/all", async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    const allScores = await prisma.userCategoryScore.findMany({
      where: { user_id: userIdInt },
      orderBy: { score: "desc" },
    });

    res.json(allScores);
  } catch (error) {
    console.error("Error fetching all category scores:", error);
    res.status(500).json({ error: "Failed to fetch category scores" });
  }
});

// Recalculate scores for a user (trigger recalculation)
router.post("/recalculate/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    // Fetch user's data
    const [favorites, shelfItems, comments, channels] = await Promise.all([
      prisma.favorite.findMany({ where: { user_id: userIdInt } }),
      prisma.shelfItem.findMany({ where: { user_id: userIdInt } }),
      prisma.comment.findMany({ where: { userId: userIdInt } }),
      prisma.userChannel.findMany({
        where: { user_id: userIdInt },
        include: { channel: true },
      }),
    ]);

    // Calculate scores
    const categoryScores = {};

    const addPoints = (categories, points) => {
      if (!categories) return;
      const categoryList = Array.isArray(categories)
        ? categories
        : [categories];

      categoryList.forEach((category) => {
        const normalizedCategory = category.trim().toLowerCase();
        categoryScores[normalizedCategory] =
          (categoryScores[normalizedCategory] || 0) + points;
      });
    };

    const getBookCategories = (book) => {
      if (book.book_data?.volumeInfo?.categories)
        return book.book_data.volumeInfo.categories;
      if (book.categories) return book.categories;
      return [];
    };

    // Add points for favorites (5 points each)
    favorites.forEach((book) => addPoints(getBookCategories(book), favoriteScore));

    // Add points for shelf items (4 points each)
    shelfItems.forEach((book) => addPoints(getBookCategories(book), shelfScore));

    // Add points for comments (2 points each)
    comments.forEach((comment) => {
      const bookData = comment.book_data || {};
      addPoints(getBookCategories(bookData), commentScore);
    });

    // Add points for channels (3 points each)
    channels.forEach((userChannel) => {
      const channel = userChannel.channel;
      if (channel.book_data?.volumeInfo?.categories) {
        addPoints(channel.book_data.volumeInfo.categories, joinchannelScore);
      }
    });

    // Update scores in database
    await prisma.userCategoryScore.deleteMany({
      where: { user_id: userIdInt },
    });

    const scoreEntries = Object.entries(categoryScores).map(
      ([category, score]) => ({
        user_id: userIdInt,
        category: category.toLowerCase().trim(),
        score: parseFloat(score),
      })
    );

    if (scoreEntries.length > 0) {
      await prisma.userCategoryScore.createMany({
        data: scoreEntries,
      });
    }

    res.json({
      message: "Scores recalculated successfully",
      categoryScores,
      updatedCategories: scoreEntries.length,
    });
  } catch (error) {
    console.error("Error recalculating scores:", error);
    res.status(500).json({ error: "Failed to recalculate scores" });
  }
});

module.exports = router;
