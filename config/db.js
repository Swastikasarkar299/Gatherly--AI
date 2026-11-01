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
