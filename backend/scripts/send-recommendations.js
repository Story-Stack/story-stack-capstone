#!/usr/bin/env node

/**
 * Script to send book recommendations as notifications
 *
 * Usage:
 * node scripts/send-recommendations.js
 */

const {
  sendRecommendationNotifications,
} = require("../scheduled-tasks/recommendation-notifications");

console.log("Starting recommendation notifications script...");

sendRecommendationNotifications()
  .then(() => {
    console.log("Recommendation notifications sent successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error sending recommendation notifications:", error);
    process.exit(1);
  });
