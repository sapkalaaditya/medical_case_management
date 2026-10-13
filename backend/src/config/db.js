const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connect to MongoDB database
 * @param {string} [uri] Optional URI override (used in tests or scripts)
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (uri) => {
  const connectionUri = uri || env.MONGO_URI;
  try {
    const conn = await mongoose.connect(connectionUri, {
      autoIndex: true
    });
    if (env.NODE_ENV !== 'test') {
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect: ${error.message}`);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error(`[Database Error] Failed to disconnect: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
