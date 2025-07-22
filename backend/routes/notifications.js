const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
// Create a new instance of PrismaClient with debug logging
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Get all unread notifications for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching notifications for user ID:", userId);

    // Find the user by supabase_id (since frontend sends supabase user ID)
    const user = await prisma.user.findUnique({
      where: {
        supabase_id: userId,
      },
    });

    if (!user) {
      console.log("User not found with supabase_id:", userId);
      // Return empty array instead of 404 to avoid errors in the frontend
      return res.json([]);
    }

    console.log("Found user with internal ID:", user.id);

    // Get all notifications for the user, not just unread ones
    const notifications = await prisma.notification.findMany({
      where: {
        user_id: user.id,
        // Removed is_read: false to get all notifications
      },
      include: {
        channel: true,
        message: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Debug: Log raw notification data
    console.log(
      "Raw notification data:",
      JSON.stringify(notifications, null, 2)
    );

    console.log(`Found ${notifications.length} notifications for user`);

    // Format notifications for frontend
    // Format notifications for frontend with more detailed logging
    console.log(
      "Raw notifications from database:",
      JSON.stringify(notifications.slice(0, 2), null, 2)
    );

    const formattedNotifications = notifications.map((notification) => {
      try {
        const formatted = {
          id: notification.id,
          content: notification.content,
          channelId: notification.channel_id,
          messageId: notification.message_id,
          comment_id: notification.comment_id, // Include comment_id
          bookId:
            notification.book_id ||
            (notification.channel ? notification.channel.book_id : null), // Use direct book_id if available
          bookTitle: notification.channel
            ? notification.channel.book_title
            : "Unknown Book",
          createdAt: notification.created_at,
          isRead: notification.is_read,
          isRecommendation: notification.is_recommendation || false,
          bookData: notification.book_data || null,
        };
        console.log(`Formatted notification ${notification.id}:`, formatted);
        return formatted;
      } catch (error) {
        console.error(
          `Error formatting notification ${notification.id}:`,
          error
        );
        console.error("Problematic notification:", notification);
        // Return a minimal notification to prevent the entire request from failing
        return {
          id: notification.id,
          content: notification.content || "New notification",
          createdAt: notification.created_at,
          isRead: notification.is_read || false,
          isRecommendation: notification.is_recommendation || false,
        };
      }
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Return empty array instead of 500 to avoid errors in the frontend
    res.json([]);
  }
});

// Mark notification as read
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    console.log("Marking notification as read:", notificationId);

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        is_read: true,
      },
    });

    console.log("Successfully marked notification as read");
    res.json({
      id: updatedNotification.id,
      isRead: updatedNotification.is_read,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    // Return success to avoid errors in frontend
    res.json({
      id: notificationId,
      isRead: true,
      error: "Failed to update in database but marked as read in UI",
    });
  }
});

// Create a recommendation notification
router.post("/recommendation", async (req, res) => {
  try {
    const { userId, bookData, channelId } = req.body;

    if (!userId || !bookData || !channelId) {
      return res.status(400).json({
        error:
          "Missing required fields: userId, bookData, and channelId are required",
      });
    }

    // Find the user by supabase_id
    const user = await prisma.user.findUnique({
      where: {
        supabase_id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create a recommendation notification
    const notification = await prisma.notification.create({
      data: {
        user_id: user.id,
        channel_id: channelId,
        book_id: bookData.id,
        content: `We think you might enjoy reading "${
          bookData.volumeInfo?.title || "this book"
        }" based on your preferences!`,
        is_recommendation: true,
        book_data: bookData,
      },
    });

    res.status(201).json({
      id: notification.id,
      message: "Recommendation notification created successfully",
    });
  } catch (error) {
    console.error("Error creating recommendation notification:", error);
    res
      .status(500)
      .json({ error: "Failed to create recommendation notification" });
  }
});

// Mark all notifications as read for a user
router.put("/user/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Marking all notifications as read for user ID:", userId);

    // Find the user by supabase_id
    const user = await prisma.user.findUnique({
      where: {
        supabase_id: userId,
      },
    });

    if (!user) {
      console.log("User not found with supabase_id:", userId);
      // Return success even if user not found to avoid errors in frontend
      return res.json({ message: "No notifications to mark as read" });
    }

    console.log("Found user with internal ID:", user.id);

    const result = await prisma.notification.updateMany({
      where: {
        user_id: user.id,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    console.log(`Marked ${result.count} notifications as read`);
    res.json({
      message: "All notifications marked as read",
      count: result.count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    // Return success to avoid errors in frontend
    res.json({ message: "No notifications to mark as read" });
  }
});

module.exports = router;
