const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Ensure compound unique indexes (like Vote { userId: 1, pollId: 1 }) are registered
    const Vote = require('../models/Vote');
    const Poll = require('../models/Poll');
    Promise.all([
      Vote.syncIndexes().catch(() => {}),
      Poll.syncIndexes().catch(() => {}),
    ]);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
