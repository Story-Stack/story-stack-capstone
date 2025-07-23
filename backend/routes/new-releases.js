const express = require("express");
const { PrismaClient } = require("../generated/prisma");
const fetch = require("node-fetch");

const router = express.Router();
const prisma = new PrismaClient();

// Get new releases from Google Books API
router.get("/", async (_req, res) => {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Google Books API key not configured" });
    }

    // Get the current date and date from 6 months ago (for truly recent books)
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    // Format dates as YYYY-MM-DD for the API query
    const startDate = sixMonthsAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    // Use a query that specifically targets new books
    const query = `subject:fiction&orderBy=newest`;

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&orderBy=newest&maxResults=40&key=${apiKey}`
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch new releases from API" });
    }

    const data = await response.json();

    // Filter to books with good data AND published within the last 6 months
    const newReleases =
      data.items?.filter((book) => {
        // Check if book has all required fields
        if (
          !(book.id && book.volumeInfo?.title && book.volumeInfo?.publishedDate)
        ) {
          return false;
        }

        // Parse the published date
        try {
          // Handle partial dates (YYYY or YYYY-MM format)
          let publishedDate;
          const dateStr = book.volumeInfo.publishedDate;

          if (dateStr.length === 4) {
            // If only year is provided (YYYY format)
            publishedDate = new Date(parseInt(dateStr), 0, 1); // January 1st of that year
          } else if (dateStr.length === 7) {
            // If year and month are provided (YYYY-MM format)
            const [year, month] = dateStr.split("-");
            publishedDate = new Date(parseInt(year), parseInt(month) - 1, 1); // 1st day of that month
          } else {
            // Full date format
            publishedDate = new Date(dateStr);
          }

          // Check if the date is valid
          if (isNaN(publishedDate.getTime())) {
            return false;
          }

          // Strict check to ensure the book is actually recent
          const isRecent =
            publishedDate >= sixMonthsAgo && publishedDate <= today;

          return isRecent;
        } catch (error) {
          return false;
        }
      }) || [];

    res.json({
      newReleases,
      count: newReleases.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch new releases" });
  }
});

// Notify users about new releases - completely rewritten for reliability
router.post("/notify", async (_req, res) => {
  try {
    // Get all users
    const users = await prisma.user.findMany();

    if (!users.length) {
      return res.json({ message: "No users to notify" });
    }

    // Get new releases using a reliable approach
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
      console.error("Google Books API key not configured");
      return res
        .status(500)
        .json({ error: "Google Books API key not configured" });
    }

    // Get the current date and date from 6 months ago (for truly recent books)
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    // Format dates as YYYY-MM-DD for the API query
    const startDate = sixMonthsAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    // Use a query that specifically targets new books with publication date filtering
    const query = `subject:fiction&orderBy=newest`;

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      query
    )}&orderBy=newest&maxResults=40&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch new releases from Google Books API",
        details: `Status: ${response.status}, ${response.statusText}`,
      });
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.json({ message: "No books found to notify about" });
    }

    // Filter to books with good data AND published within the last 2 years
    const validBooks = data.items.filter((book) => {
      // Check if book has all required fields
      if (
        !(
          book.id &&
          book.volumeInfo?.title &&
          book.volumeInfo?.authors &&
          book.volumeInfo?.imageLinks?.thumbnail &&
          book.volumeInfo?.publishedDate
        )
      ) {
        return false;
      }

      // Parse the published date
      try {
        // Handle partial dates (YYYY or YYYY-MM format)
        let publishedDate;
        const dateStr = book.volumeInfo.publishedDate;

        if (dateStr.length === 4) {
          // If only year is provided (YYYY format)
          publishedDate = new Date(parseInt(dateStr), 0, 1); // January 1st of that year
        } else if (dateStr.length === 7) {
          // If year and month are provided (YYYY-MM format)
          const [year, month] = dateStr.split("-");
          publishedDate = new Date(parseInt(year), parseInt(month) - 1, 1); // 1st day of that month
        } else {
          // Full date format
          publishedDate = new Date(dateStr);
        }

        // Check if the date is valid
        if (isNaN(publishedDate.getTime())) {
          return false;
        }

        // Strict check to ensure the book is actually recent
        const isRecent =
          publishedDate >= sixMonthsAgo && publishedDate <= today;

        return isRecent;
      } catch (error) {
        return false;
      }
    });

    if (validBooks.length === 0) {
      return res.json({ message: "No suitable books found to notify about" });
    }

    // Pick a random book to feature as a "new release"
    const bookToNotify =
      validBooks[Math.floor(Math.random() * validBooks.length)];

    // Create or find a channel for this book
    let channel;
    const existingChannel = await prisma.channel.findFirst({
      where: { book_id: bookToNotify.id },
    });

    if (existingChannel) {
      channel = existingChannel;
    } else {
      // Create a new channel for this book
      channel = await prisma.channel.create({
        data: {
          name: bookToNotify.volumeInfo.title,
          book_id: bookToNotify.id,
          book_title: bookToNotify.volumeInfo.title,
          book_data: bookToNotify,
        },
      });
    }

    // Check if users have already been notified about this book in the last 30 days
    let notificationCount = 0;

    // Create notifications only for users who haven't been notified about this book recently
    for (const user of users) {
      try {
        // Check if user already has a notification for this book in the last 30 days
        const existingNotification = await prisma.notification.findFirst({
          where: {
            user_id: user.id,
            book_id: bookToNotify.id,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            },
          },
        });

        if (existingNotification) {
          continue;
        }

        // Create a notification for this user
        const notification = await prisma.notification.create({
          data: {
            user_id: user.id,
            channel_id: channel.id,
            book_id: bookToNotify.id,
            content: `New Release: "${bookToNotify.volumeInfo.title}" by ${bookToNotify.volumeInfo.authors[0]} is now available!`,
            is_recommendation: true,
            book_data: bookToNotify,
          },
        });

        notificationCount++;
      } catch (userError) {
        // Continue with next user
      }
    }

    return res.json({
      success: true,
      message: `Notified ${notificationCount} users about new release: ${bookToNotify.volumeInfo.title}`,
      bookTitle: bookToNotify.volumeInfo.title,
      bookId: bookToNotify.id,
      notificationCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to notify users about new releases" });
  }
});

module.exports = router;
