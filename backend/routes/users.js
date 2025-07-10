const express = require("express");
const { PrismaClient } = require("../generated/prisma");
const router = express.Router();
const prisma = new PrismaClient();

// Get user by Supabase ID
router.get("/supabase/:supabaseId", async (req, res) => {
  try {
    const { supabaseId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        supabase_id: supabaseId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new user profile
router.post("/", async (req, res) => {
  try {
    const { supabase_id, email, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        supabase_id: supabase_id,
      },
    });

    if (existingUser) {
      return res.json(existingUser);
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        supabase_id,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
