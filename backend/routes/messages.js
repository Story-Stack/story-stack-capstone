const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// Get messages for a channel
router.get("/channel/:channelId", async (req, res) => {
  try {
    const { channelId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        channelId: channelId,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            supabase_id: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format messages for frontend
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender:
        msg.user.first_name || msg.user.email.split("@")[0] || "Anonymous",
      created_at: msg.createdAt,
      userId: msg.userId,

      supabase_id: msg.user.supabase_id, // Include Supabase ID for frontend comparison
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create a new message
router.post("/", async (req, res) => {
  try {
    const { content, channelId, userId } = req.body;

    console.log("Message creation request:", { content, channelId, userId });

    // Find the user by supabase_id (since frontend sends supabase user ID)
    // Make sure userId is treated as a string
    const user = await prisma.user.findUnique({
      where: {
        supabase_id: String(userId),
      },
    });

    if (!user) {
      console.error("User not found with supabase_id:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Found user:", { id: user.id, email: user.email });

    // Verify channelId exists
    const channelExists = await prisma.channel.findUnique({
      where: {
        id: channelId,
      },
    });

    if (!channelExists) {
      console.error("Channel not found with ID:", channelId);
      return res.status(404).json({ error: "Channel not found" });
    }

    console.log("Creating message with data:", {
      content: content,
      channelId: channelId,
      userId: user.id,
    });

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content,
        channelId: channelId,
        userId: user.id, // Use the internal user ID
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            supabase_id: true,
          },
        },
      },
    });

    console.log("Message created successfully:", message);

    // Get channel information
    const channel = await prisma.channel.findUnique({
      where: {
        id: channelId,
      },
    });

    // Get all users in the channel except the message sender
    const channelMembers = await prisma.userChannel.findMany({
      where: {
        channel_id: channelId,
        user_id: {
          not: user.id, // Exclude the message sender
        },
      },
      select: {
        user_id: true,
      },
    });

    // Create notifications for all channel members
    const senderName =
      user.first_name || user.email.split("@")[0] || "Anonymous";
    const notificationContent = `${senderName} posted in ${
      channel.book_title
    }: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`;

    // Create notifications using createMany now that the Prisma client has been regenerated
    try {
      console.log(
        "Creating notifications for channel members:",
        channelMembers.length
      );

      if (channelMembers.length > 0) {
        await prisma.notification.createMany({
          data: channelMembers.map((member) => ({
            user_id: member.user_id,
            channel_id: channelId,
            message_id: message.id,
            content: notificationContent,
            is_read: false,
          })),
        });
      }

      console.log("Successfully created notifications");
    } catch (notificationError) {
      // Log the error but don't fail the message creation
      console.error("Error creating notifications:", notificationError);
      console.error("Notification error details:", {
        name: notificationError.name,
        message: notificationError.message,
        code: notificationError.code,
      });
    }

    // Format message for frontend
    const formattedMessage = {
      id: message.id,
      content: message.content,
      sender: senderName,
      created_at: message.createdAt,
      userId: message.userId,
      supabase_id: message.user.supabase_id, // Include Supabase ID for frontend comparison
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    // Check for specific Prisma errors
    if (error.code === "P2003") {
      return res.status(400).json({
        error: "Failed to create message: Foreign key constraint failed",
        details: error.meta,
      });
    }

    res.status(500).json({
      error: "Failed to create message",
      message: error.message,
    });
  }
});

module.exports = router;
