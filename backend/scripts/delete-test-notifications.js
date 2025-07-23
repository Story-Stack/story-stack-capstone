#!/usr/bin/env node

/**
 * Script to delete test notifications from the database
 *
 * Usage:
 * node scripts/delete-test-notifications.js
 */

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function deleteTestNotifications() {
  try {
    console.log("Starting deletion of test notifications...");

    // Delete notifications with the test book title
    const result = await prisma.notification.deleteMany({
      where: {
        content: {
          contains: "Test Recent Book - 2025-07-22"
        }
      }
    });

    console.log(`Deleted ${result.count} test notifications`);

    return result.count;
  } catch (error) {
    console.error("Error deleting test notifications:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  deleteTestNotifications()
    .then((count) => {
      console.log(`Successfully deleted ${count} test notifications`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { deleteTestNotifications };
