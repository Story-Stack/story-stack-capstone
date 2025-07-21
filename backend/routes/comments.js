const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/comments/book/:bookId - Get comments for a book
router.get("/book/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Get only top-level comments (not replies)
    const comments = await prisma.comment.findMany({
      where: {
        book_id: bookId,
        parentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        // Include replies
        replies: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/comments - Create a new comment or reply
router.post("/", async (req, res) => {
  try {
    const { content, book_id, book_title, book_data, userId, parentId } =
      req.body;

    if (!content || !book_id || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare comment data
    const commentData = {
      content,
      book_id,
      book_title: book_title || "Unknown",
      book_data,
      userId: parseInt(userId),
    };

    // If parentId is provided, add it to the comment data
    if (parentId) {
      // Verify the parent comment exists
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }

      commentData.parentId = parentId;
      console.log("Creating reply to comment:", parentId);
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        parent: true,
      },
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
      where: { id: parseInt(commentId) },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== parseInt(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
