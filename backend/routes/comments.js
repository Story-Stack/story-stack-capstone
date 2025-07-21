const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get all comments for a book with their full reply tree
async function getAllCommentsWithReplies(bookId) {
  // First, get all comments for this book (both top-level and replies)
  const allComments = await prisma.comment.findMany({
    where: {
      book_id: bookId,
    },
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
  });

  // Create a map for quick lookup
  const commentMap = new Map();
  allComments.forEach((comment) => {
    // Initialize replies array for each comment
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  // Build the tree structure
  const rootComments = [];
  allComments.forEach((comment) => {
    if (comment.parentId) {
      // This is a reply, add it to its parent's replies
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      // This is a top-level comment
      rootComments.push(comment);
    }
  });

  // Sort replies by creation time
  const sortReplies = (comments) => {
    comments.forEach((comment) => {
      if (comment.replies.length > 0) {
        comment.replies.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        sortReplies(comment.replies);
      }
    });
  };

  sortReplies(rootComments);

  // Sort root comments by creation time (newest first)
  rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return rootComments;
}

// GET /api/comments/book/:bookId - Get comments for a book
router.get("/book/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Get all comments with their full reply tree
    const comments = await getAllCommentsWithReplies(bookId);

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
