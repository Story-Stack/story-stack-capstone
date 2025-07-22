const express = require("express");
require("dotenv").config(); // Load environment variables
const cors = require("cors");
const morgan = require("morgan");
const { PrismaClient } = require("./generated/prisma");
const fetch = require("node-fetch");

// Import routes
const usersRoutes = require("./routes/users.js");
const favoritesRoutes = require("./routes/favorites.js");
const shelfRoutes = require("./routes/shelf.js");
const channelsRoutes = require("./routes/channels.js");
const messagesRoutes = require("./routes/messages.js");
const commentsRoutes = require("./routes/comments.js");
const userChannelsRoutes = require("./routes/user-channels.js");
const categoryScoresRoutes = require("./routes/category-scores.js");
const recommendationsRoutes = require("./routes/recommendations.js");
const notificationsRoutes = require("./routes/notifications.js");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json()); // to parse JSON request bodies
app.use(morgan("dev"));
// Routes
app.use("/api/users", usersRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/shelf", shelfRoutes);
app.use("/api/channels", channelsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/user-channels", userChannelsRoutes);
app.use("/api/category-scores", categoryScoresRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Default route
app.get("/", (_req, res) => {
  res.send("Welcome to StoryStack API");
});

// Function to check for users who need recommendations
async function checkAndSendRecommendations() {
  try {
    console.log("Checking for users who need recommendations...");

    // Get all users
    const users = await prisma.user.findMany();

    for (const user of users) {
      try {
        // Check if user has received a recommendation notification in the last 7 days
        const recentNotification = await prisma.notification.findFirst({
          where: {
            user_id: user.id,
            is_recommendation: true,
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            },
          },
        });

        // If no recent recommendation, check if there are new books to recommend
        if (!recentNotification) {
          console.log(
            `Checking for new book recommendations for user ${user.id} (${user.email})`
          );

          // Get user's top categories
          const topCategories = await prisma.userCategoryScore.findMany({
            where: { user_id: user.id },
            orderBy: { score: "desc" },
            take: 1, // Just need the top category
          });

          // Only proceed if the user has at least one category
          if (topCategories.length > 0) {
            // Call the recommendations endpoint with notify=true
            await fetch(
              `http://localhost:${PORT}/api/recommendations/${user.supabase_id}?notify=true`
            );
            console.log(`Recommendation check completed for user ${user.id}`);
          } else {
            console.log(`User ${user.id} has no category preferences yet`);
          }
        } else {
          console.log(
            `User ${user.id} already received a recommendation recently`
          );
        }
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
      }
    }

    console.log("Recommendation check completed for all users");
  } catch (error) {
    console.error("Error checking for recommendations:", error);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);

  // Schedule periodic recommendation checks (every 24 hours)
  // For testing, you can reduce this interval
  const RECOMMENDATION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Initial check after 1 minute
  setTimeout(() => {
    checkAndSendRecommendations();

    // Then set up recurring checks
    setInterval(checkAndSendRecommendations, RECOMMENDATION_CHECK_INTERVAL);
  }, 60000); // 1 minute delay for initial check
});
