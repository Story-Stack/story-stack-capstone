const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const { PrismaClient } = require("./generated/prisma");

// Import routes
const usersRoutes = require("./routes/users.js");
const favoritesRoutes = require("./routes/favorites.js");
const shelfRoutes = require("./routes/shelf.js");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json()); // to parse JSON request bodies
app.use(morgan("dev")); // optional: logs requests for dev debugging

// Routes
app.use("/api/users", usersRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/shelf", shelfRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to StoryStack API");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
