const express = require("express");
const { PrismaClient } = require("../generated/prisma");
const fetch = require("node-fetch");

const router = express.Router();
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

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
    console.log(`Fetching new releases with query: ${query}`);
    console.log(
      `Filtering for books published between ${startDate} and ${endDate}`
    );

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&orderBy=newest&maxResults=40&key=${apiKey}`
    );

    if (!response.ok) {
      console.error(
        `Google Books API error: ${response.status} ${response.statusText}`
      );
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
 f         } else if (dateStr.length === 7) {
            // If year and month are provided (YYYY-MM format)
            const [year, month] = dateStr.split("-");
            publishedDate = new Date(parseInt(year), parseInt(month) - 1, 1); // 1st day of that month
          } else {
            // Full date format
            publishedDate = new Date(dateStr);
          }

          // Check if the date is valid
          if (isNaN(publishedDate.getTime())) {
            console.log(
              `Invalid publication date for book: ${book.volumeInfo.title} - ${dateStr}`
            );
            return false;
          }

          // Strict check to ensure the book is actually recent
          const isRecent =
            publishedDate >= sixMonthsAgo && publishedDate <= today;

          if (!isRecent) {
            console.log(
              `Book not recent enough: ${book.volumeInfo.title} - Published: ${dateStr}`
            );
          }

          return isRecent;
        } catch (error) {
          console.log(
            `Error parsing date for book: ${book.volumeInfo.title} - ${error.message}`
          );
          return false;
        }
      }) || [];

    console.log(`Found ${newReleases.length} new releases`);

    res.json({
      newReleases,
      count: newReleases.length,
    });
  } catch (error) {
    console.error("Error fetching new releases:", error);
    res.status(500).json({ error: "Failed to fetch new releases" });
  }
});

// Notify users about new releases - completely rewritten for reliability
router.post("/notify", async (_req, res) => {
  try {
    console.log("Starting new release notification process");

    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to potentially notify`);

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
    console.log(`Using query: ${query} for new releases`);
    console.log(
      `Filtering for books published between ${startDate} and ${endDate}`
    );

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      query
    )}&orderBy=newest&maxResults=40&key=${apiKey}`;
    console.log(`Making API request to: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Google Books API error: ${response.status} ${response.statusText}`
      );
      return res.status(response.status).json({
        error: "Failed to fetch new releases from Google Books API",
        details: `Status: ${response.status}, ${response.statusText}`,
      });
    }

    const data = await response.json();
    console.log(`API returned ${data.items?.length || 0} books`);

    if (!data.items || data.items.length === 0) {
      console.log("No books returned from API");
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
          console.log(
            `Invalid publication date for book: ${book.volumeInfo.title} - ${dateStr}`
          );
          return false;
        }

        // Strict check to ensure the book is actually recent
        const isRecent =
          publishedDate >= sixMonthsAgo && publishedDate <= today;

        if (!isRecent) {
          console.log(
            `Book not recent enough: ${
              book.volumeInfo.title
            } - Published: ${dateStr} (${
              publishedDate.toISOString().split("T")[0]
            })`
          );
        }

        return isRecent;
      } catch (error) {
        console.log(
          `Error parsing date for book: ${book.volumeInfo.title} - ${error.message}`
        );
        return false;
      }
    });

    console.log(
      `Found ${validBooks.length} valid recent books published in the last 6 months`
    );

    // Log the titles and publication dates of the valid books
    validBooks.forEach((book) => {
      console.log(
        `- ${book.volumeInfo.title} (${book.volumeInfo.publishedDate}) by ${book.volumeInfo.authors[0]}`
      );
    });

    if (validBooks.length === 0) {
      return res.json({ message: "No suitable books found to notify about" });
    }

    // Pick a random book to feature as a "new release"
    const bookToNotify =
      validBooks[Math.floor(Math.random() * validBooks.length)];
    console.log(
      `Selected book: "${bookToNotify.volumeInfo.title}" by ${bookToNotify.volumeInfo.authors[0]}`
    );
    console.log(`Publication date: ${bookToNotify.volumeInfo.publishedDate}`);

    // Create or find a channel for this book
    let channel;
    const existingChannel = await prisma.channel.findFirst({
      where: { book_id: bookToNotify.id },
    });

    if (existingChannel) {
      console.log(`Using existing channel for book: ${existingChannel.id}`);
      channel = existingChannel;
    } else {
      console.log(
        `Creating new channel for book: ${bookToNotify.volumeInfo.title}`
      );
      // Create a new channel for this book
      channel = await prisma.channel.create({
        data: {
          name: bookToNotify.volumeInfo.title,
          book_id: bookToNotify.id,
          book_title: bookToNotify.volumeInfo.title,
          book_data: bookToNotify,
        },
      });
      console.log(`Created channel with ID: ${channel.id}`);
    }

    // Create a notification for a test user first to verify it works
    let notificationCount = 0;

    // Create notifications for all users
    for (const user of users) {
      try {
        console.log(`Processing user ${user.id} (${user.email || "no email"})`);

        // Create a notification for this user regardless of previous notifications
        // This ensures we always create at least one notification for testing
        const notification = await prisma.notification.create({
          data: {
            user_id: user.id,
            channel_id: channel.id,
            book_id: bookToNotify.id,
            content: `New release: "${bookToNotify.volumeInfo.title}" by ${bookToNotify.volumeInfo.authors[0]} is now available!`,
            is_recommendation: true,
            book_data: bookToNotify,
          },
        });

        console.log(
          `Created notification ${notification.id} for user ${user.id}`
        );
        notificationCount++;
      } catch (userError) {
        console.error(
          `Error creating notification for user ${user.id}:`,
          userError
        );
      }
    }

    console.log(`Successfully created ${notificationCount} notifications`);

    return res.json({
      success: true,
      message: `Notified ${notificationCount} users about new release: ${bookToNotify.volumeInfo.title}`,
      bookTitle: bookToNotify.volumeInfo.title,
      bookId: bookToNotify.id,
      notificationCount,
    });
  } catch (error) {
    console.error("Error notifying users about new releases:", error);
    res
      .status(500)
      .json({ error: "Failed to notify users about new releases" });
  }
});

module.exports = router;
