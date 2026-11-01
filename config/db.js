const { MONGODB_URI } = require('./env');

let isConnected = false;
let mongoose = null;

try {
  mongoose = require('mongoose');
} catch (e) {
  // Mongoose package not installed yet, fallback to high-speed JSON document store
}

async function connectDB() {
  if (!mongoose) {
    console.log('[Gatherly DB] Operating with Gatherly local document store (MongoDB schemas ready).');
    return false;
  }

  // In cloud/Vercel serverless mode without a custom Atlas URI, use internal document engine immediately
  if (process.env.VERCEL && (!MONGODB_URI || MONGODB_URI.includes('localhost'))) {
    console.log('[Gatherly DB] Vercel deployment detected without remote MongoDB Atlas URI. Operating with fast JSON/in-memory store.');
    isConnected = false;
    return false;
  }

  try {
    // Attempt Mongoose connection with 3-second timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[Gatherly DB] Connected to MongoDB at ${MONGODB_URI}`);
    return true;
  } catch (err) {
    console.log(`[Gatherly DB] MongoDB server not reachable (${err.message}). Using Gatherly local document store.`);
    isConnected = false;
    return false;
  }
}

function getIsConnected() {
  return isConnected;
}

module.exports = {
  connectDB,
  getIsConnected
};
