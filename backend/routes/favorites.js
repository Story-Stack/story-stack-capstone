const express = require("express");
const { PrismaClient } = require("../generated/prisma");
const router = express.Router();
const prisma = new PrismaClient();

// Get user's favorites
router.get("/:supabaseId", async (req, res) => {
  try {
    const { supabaseId } = req.params;

    // First get the user
    const user = await prisma.user.findUnique({
      where: { supabase_id: supabaseId },
      include: {
        favorites: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add book to favorites
router.post("/", async (req, res) => {
  try {
    const { supabase_id, book_id, book_title, book_data } = req.body;

    // First get the user
    const user = await prisma.user.findUnique({
      where: { supabase_id: supabase_id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        user_id_book_id: {
          user_id: user.id,
          book_id: book_id,
        },
      },
    });

    if (existingFavorite) {
      return res.json({
        message: "Already in favorites",
        favorite: existingFavorite,
      });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        user_id: user.id,
        book_id,
        book_title,
        book_data,
      },
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove book from favorites
router.delete("/", async (req, res) => {
  try {
    const { supabase_id, book_id } = req.body;

    // First get the user
    const user = await prisma.user.findUnique({
      where: { supabase_id: supabase_id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove from favorites
    await prisma.favorite.deleteMany({
      where: {
        user_id: user.id,
        book_id: book_id,
      },
    });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
