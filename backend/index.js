const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const { PrismaClient } = require("./generated/prisma");

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

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to StoryStack API");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
