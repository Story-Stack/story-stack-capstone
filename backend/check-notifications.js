// const { PrismaClient } = require('./generated/prisma');

// async function checkNotifications() {
//   const prisma = new PrismaClient();

//   try {
//     console.log('Checking notifications in the database...');

//     // Get all users
//     const users = await prisma.user.findMany();
//     console.log(`Found ${users.length} users in the database`);

//     // Print each user
//     users.forEach(user => {
//       console.log(`User ID: ${user.id}, Supabase ID: ${user.supabase_id}, Email: ${user.email}`);
//     });

//     // Get all notifications
//     const notifications = await prisma.notification.findMany();
//     console.log(`Found ${notifications.length} notifications in the database`);

//     // Print each notification
//     notifications.forEach(notification => {
//       console.log(`Notification ID: ${notification.id}, User ID: ${notification.user_id}, Content: ${notification.content}`);
//     });

//     // Check if the API endpoint works for each user
//     console.log('\nTesting API endpoint for each user...');
//     const fetch = require('node-fetch');

//     for (const user of users) {
//       try {
//         const response = await fetch(`http://localhost:3000/api/notifications/user/${user.supabase_id}`);
//         const apiNotifications = await response.json();
//         console.log(`API returned ${apiNotifications.length} notifications for user ${user.id} (${user.email})`);
//       } catch (error) {
//         console.error(`Error testing API for user ${user.id}:`, error);
//       }
//     }

//   } catch (error) {
//     console.error('Error checking notifications:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// checkNotifications();
