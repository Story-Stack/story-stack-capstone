import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";

// Import routes (commented out - route files don't exist yet)
// import authRoutes from './routes/auth.routes.js';
// import booksRoutes from './routes/books.routes.js';
// import reviewsRoutes from './routes/reviews.routes.js';
// import shelfRoutes from './routes/shelf.routes.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json()); // to parse JSON request bodies
app.use(morgan("dev")); // optional: logs requests for dev debugging

// Routes (commented out - route files don't exist yet)
// app.use('/api/auth', authRoutes);
// app.use('/api/books', booksRoutes);
// app.use('/api/reviews', reviewsRoutes);
// app.use('/api/shelf', shelfRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to StoryStack API");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
