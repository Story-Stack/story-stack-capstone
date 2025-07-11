const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// Get messages for a channel
router.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        channelId: channelId
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            supabase_id: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.user.first_name || msg.user.email.split('@')[0] || 'Anonymous',
      created_at: msg.createdAt,
      userId: msg.userId,
      
      supabase_id: msg.user.supabase_id // Include Supabase ID for frontend comparison
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new message
router.post('/', async (req, res) => {
  try {
    const { content, channelId, userId } = req.body;

    // Find the user by supabase_id (since frontend sends supabase user ID)
    const user = await prisma.user.findUnique({
      where: {
        supabase_id: userId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content,
        channelId: channelId,
        userId: user.id // Use the internal user ID
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            supabase_id: true
          }
        }
      }
    });

    // Format message for frontend
    const formattedMessage = {
      id: message.id,
      content: message.content,
      sender: message.user.first_name || message.user.email.split('@')[0] || 'Anonymous',
      created_at: message.createdAt,
      userId: message.userId,
      supabase_id: message.user.supabase_id // Include Supabase ID for frontend comparison
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

module.exports = router;
