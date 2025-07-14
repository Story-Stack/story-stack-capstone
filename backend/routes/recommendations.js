const express = require('express');
const { PrismaClient } = require('../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();
const numTopCategories = 3; // Number of top categories to return
const recommendationsLimit = 20; // Number of recommendations to return

// Get personalized recommendations for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || recommendationsLimit;

    // Check if userId is a supabase_id (UUID) or database user ID (integer)
    let userIdInt;
    if (userId.includes('-')) {
      // It's a supabase_id, get the database user ID
      const user = await prisma.user.findUnique({
        where: { supabase_id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      userIdInt = user.id;
    } else {
      // It's already a database user ID
      userIdInt = parseInt(userId);
    }

    // Get user's top categories
    const topCategories = await prisma.userCategoryScore.findMany({
      where: { user_id: userIdInt },
      orderBy: { score: 'desc' },
      take: numTopCategories // Top 3 categories
    });

    if (topCategories.length === 0) {
      return res.json({
        recommendations: [],
        message: 'No recommendations available. Start by adding books to favorites or shelf!'
      });
    }

    // Return the top categories so frontend can fetch books from Google Books API
    res.json({
      topCategories: topCategories.map(cat => ({
        category: cat.category,
        score: cat.score
      })),
      message: 'Recommendations based on your reading preferences'
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Trigger score recalculation and get fresh recommendations
router.post('/refresh/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    // Recalculate scores first
    const recalculateResponse = await fetch(`http://localhost:3000/api/category-scores/recalculate/${userId}`, {
      method: 'POST'
    });

    if (!recalculateResponse.ok) {
      throw new Error('Failed to recalculate scores');
    }

    // Get fresh recommendations
    const recommendationsResponse = await fetch(`http://localhost:3000/api/recommendations/${userId}`);
    const recommendations = await recommendationsResponse.json();

    res.json({
      ...recommendations,
      message: 'Recommendations refreshed based on your latest activity'
    });

  } catch (error) {
    console.error('Error refreshing recommendations:', error);
    res.status(500).json({ error: 'Failed to refresh recommendations' });
  }
});

module.exports = router;
