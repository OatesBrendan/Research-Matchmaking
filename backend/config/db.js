const mongoose = require('mongoose');
const processScrapingJobs = require('../utils/scraperQueue');
require('dotenv').config();

const connectionString = process.env.ATLAS_URI || "";

async function connectToDatabase() {
  try {
    await mongoose.connect(connectionString, {
      dbName: 'ResearchDB',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    processScrapingJobs();
  } catch (error) {
    console.error("Failed to connect to MongoDB with Mongoose:", error);
    process.exit(1);
  }
}

module.exports = connectToDatabase;