const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const fetch = require("node-fetch");

/**
 * Scheduled task to send book recommendations as notifications
 * This can be run on a schedule (e.g., daily or weekly) using a cron job
 */
async function sendRecommendationNotifications() {
  try {
    console.log("Starting recommendation notifications task...");

    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to process`);

    // Process each user
    for (const user of users) {
      try {
        console.log(`Processing user ${user.id} (${user.email})`);

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

        if (recentNotification) {
          console.log(
            `User ${user.id} already received a recommendation in the last 7 days, skipping`
          );
          continue;
        }

        // Trigger recommendation with notification
        await fetch(
          `http://localhost:3000/api/recommendations/${user.id}?notify=true`
        );
        console.log(`Sent recommendation notification to user ${user.id}`);
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        // Continue with next user
      }
    }

    console.log("Recommendation notifications task completed");
  } catch (error) {
    console.error("Error in recommendation notifications task:", error);
  }
}

// Export for use in other files
module.exports = {
  sendRecommendationNotifications,
};

// If this file is run directly, execute the task
if (require.main === module) {
  sendRecommendationNotifications()
    .then(() => {
      console.log("Task completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Task failed:", error);
      process.exit(1);
    });
}
