const express = require("express");
const {
  isUserCelebrity,
  getAllCelebrities,
} = require("../utils/celebrityDetection");

const router = express.Router();

/**
 * GET /api/celebrities
 * Get all celebrity users in the system
 */
router.get("/", async (req, res) => {
  try {
    // Get query parameters with defaults
    const followerThreshold = parseInt(req.query.followers) || 5;
    const commentTreeThreshold = parseInt(req.query.comments) || 10;

    const celebrities = await getAllCelebrities(
      followerThreshold,
      commentTreeThreshold
    );

    res.json(celebrities);
  } catch (error) {
    console.error("Error fetching celebrities:", error);
    res.status(500).json({ error: "Failed to fetch celebrities" });
  }
});

/**
 * GET /api/celebrities/:userId
 * Check if a specific user is a celebrity
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get query parameters with defaults
    const followerThreshold = parseInt(req.query.followers) || 5;
    const commentTreeThreshold = parseInt(req.query.comments) || 10;

    const isCelebrity = await isUserCelebrity(
      userId,
      followerThreshold,
      commentTreeThreshold
    );

    res.json({ userId, isCelebrity });
  } catch (error) {
    console.error("Error checking celebrity status:", error);
    res.status(500).json({ error: "Failed to check celebrity status" });
  }
});

module.exports = router;
