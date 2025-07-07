const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const { PrismaClient } = require("./generated/prisma");

// Import routes
const usersRoutes = require("./routes/users.js");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json()); // to parse JSON request bodies
app.use(morgan("dev")); // optional: logs requests for dev debugging

// Routes
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to StoryStack API");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
