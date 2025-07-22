const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();
const numTopCategories = 3; // Number of top categories to return

// Get personalized recommendations for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sendNotification = req.query.notify === "true";

    // Check if userId is a supabase_id (UUID) or database user ID (integer)
    let userIdInt;
    let supabaseId = userId;

    if (userId.includes("-")) {
      // It's a supabase_id, get the database user ID
      const user = await prisma.user.findUnique({
        where: { supabase_id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      userIdInt = user.id;
    } else {
      // It's already a database user ID
      userIdInt = parseInt(userId);

      // Get the supabase_id for later use
      const user = await prisma.user.findUnique({
        where: { id: userIdInt },
      });

      if (user) {
        supabaseId = user.supabase_id;
      }
    }

    // Get user's top categories
    let topCategories = await prisma.userCategoryScore.findMany({
      where: { user_id: userIdInt },
      orderBy: { score: "desc" },
      take: numTopCategories, // Top 3 categories
    });

    // If no categories exist, try to calculate them first
    if (topCategories.length === 0) {
      try {
        const recalculateResponse = await fetch(
          `http://localhost:3000/api/category-scores/recalculate/${userIdInt}`,
          {
            method: "POST",
          }
        );

        if (recalculateResponse.ok) {
          // Try to get categories again after recalculation
          topCategories = await prisma.userCategoryScore.findMany({
            where: { user_id: userIdInt },
            orderBy: { score: "desc" },
            take: numTopCategories,
          });
        }
      } catch (error) {
        console.warn(
          "Failed to recalculate scores for recommendations:",
          error
        );
      }

      // If still no categories after recalculation, return empty
      if (topCategories.length === 0) {
        return res.json({
          recommendations: [],
          message:
            "No recommendations available. Start by adding books to favorites or shelf!",
        });
      }
    }

    // If sendNotification is true, fetch a book from Google Books API and create a notification
    if (sendNotification) {
      try {
        // Get the top category
        const topCategory = topCategories[0].category;

        // Fetch a book from Google Books API
        const searchQuery = `subject:${topCategory}`;
        const googleBooksResponse = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            searchQuery
          )}&maxResults=1&orderBy=relevance`
        );

        if (googleBooksResponse.ok) {
          const data = await googleBooksResponse.json();
          if (data.items && data.items.length > 0) {
            const book = data.items[0];

            // Find or create a channel for this book
            let channel;
            const existingChannel = await prisma.channel.findFirst({
              where: { book_id: book.id },
            });

            if (existingChannel) {
              channel = existingChannel;
            } else {
              // Create a new channel for this book
              channel = await prisma.channel.create({
                data: {
                  name: book.volumeInfo?.title || "Book Discussion",
                  book_id: book.id,
                  book_title: book.volumeInfo?.title || "Unknown Book",
                  book_data: book,
                },
              });
            }

            // Create a recommendation notification
            await fetch(
              `http://localhost:3000/api/notifications/recommendation`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: supabaseId,
                  bookData: book,
                  channelId: channel.id,
                }),
              }
            );
          }
        }
      } catch (error) {
        console.error("Error creating recommendation notification:", error);
        // Continue even if notification creation fails
      }
    }

    // Return the top categories so frontend can fetch books from Google Books API
    res.json({
      topCategories: topCategories.map((cat) => ({
        category: cat.category,
        score: cat.score,
      })),
      message: "Recommendations based on your reading preferences",
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// Trigger score recalculation and get fresh recommendations
router.post("/refresh/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Recalculate scores first
    const recalculateResponse = await fetch(
      `http://localhost:3000/api/category-scores/recalculate/${userId}`,
      {
        method: "POST",
      }
    );

    if (!recalculateResponse.ok) {
      throw new Error("Failed to recalculate scores");
    }

    // Get fresh recommendations
    const recommendationsResponse = await fetch(
      `http://localhost:3000/api/recommendations/${userId}`
    );
    const recommendations = await recommendationsResponse.json();

    res.json({
      ...recommendations,
      message: "Recommendations refreshed based on your latest activity",
    });
  } catch (error) {
    console.error("Error refreshing recommendations:", error);
    res.status(500).json({ error: "Failed to refresh recommendations" });
  }
});

module.exports = router;
