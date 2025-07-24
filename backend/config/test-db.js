const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Connect to the in-memory database
const connectTestDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
    console.log('Connected to test MongoDB');
  } catch (err) {
    console.error('Error connecting to test MongoDB:', err);
    process.exit(1);
  }
};

// Disconnect and close connection
const disconnectTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log('Disconnected from test MongoDB');
  } catch (err) {
    console.error('Error disconnecting from test MongoDB:', err);
    process.exit(1);
  }
};

// Clear all collections
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearDatabase
}; 