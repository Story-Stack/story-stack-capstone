const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// Get all unread notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by supabase_id (since frontend sends supabase user ID)
    const user = await prisma.user.findUnique({
      where: {
        supabase_id: userId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: user.id,
        is_read: false
      },
      include: {
        channel: true,
        message: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      content: notification.content,
      channelId: notification.channel_id,
      messageId: notification.message_id,
      bookId: notification.channel.book_id,
      bookTitle: notification.channel.book_title,
      createdAt: notification.created_at,
      isRead: notification.is_read
    }));

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId
      },
      data: {
        is_read: true
      }
    });

    res.json({
      id: updatedNotification.id,
      isRead: updatedNotification.is_read
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by supabase_id
    const user = await prisma.user.findUnique({
      where: {
        supabase_id: userId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.notification.updateMany({
      where: {
        user_id: user.id,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

module.exports = router;
