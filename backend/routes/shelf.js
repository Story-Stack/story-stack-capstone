const express = require("express");
const { PrismaClient } = require("../generated/prisma");
const router = express.Router();
const prisma = new PrismaClient();

// Get user's shelf items
router.get("/:supabaseId", async (req, res) => {
  try {
    const { supabaseId } = req.params;

    // First get the user
    const user = await prisma.user.findUnique({
      where: { supabase_id: supabaseId },
      include: {
        shelf_items: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.shelf_items);
  } catch (error) {
    console.error("Error fetching shelf items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add book to shelf
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

    // Check if already on shelf
    const existingShelfItem = await prisma.shelfItem.findUnique({
      where: {
        user_id_book_id: {
          user_id: user.id,
          book_id: book_id,
        },
      },
    });

    if (existingShelfItem) {
      return res.json({
        message: "Already on shelf",
        shelfItem: existingShelfItem,
      });
    }

    // Add to shelf
    const shelfItem = await prisma.shelfItem.create({
      data: {
        user_id: user.id,
        book_id,
        book_title,
        book_data,
      },
    });

    res.status(201).json(shelfItem);
  } catch (error) {
    console.error("Error adding to shelf:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove book from shelf
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

    // Remove from shelf
    await prisma.shelfItem.deleteMany({
      where: {
        user_id: user.id,
        book_id: book_id,
      },
    });

    res.json({ message: "Removed from shelf" });
  } catch (error) {
    console.error("Error removing from shelf:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
