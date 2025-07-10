const express = require("express");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// Placeholder routes for messages
// TODO: Implement message functionality

module.exports = router;
