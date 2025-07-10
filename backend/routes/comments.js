const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/comments/book/:bookId - Get comments for a book
router.get("/book/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        book_id: bookId
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/comments - Create a new comment
router.post("/", async (req, res) => {
  try {
    const { content, book_id, book_title, book_data, userId } = req.body;

    if (!content || !book_id || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        book_id,
        book_title: book_title || "Unknown",
        book_data,
        userId: parseInt(userId)
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// DELETE /api/comments/:commentId - Delete a comment
router.delete("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    // Verify comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== parseInt(userId)) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
