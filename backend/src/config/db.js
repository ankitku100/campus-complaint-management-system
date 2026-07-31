const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required.');
  }

  if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
    throw new Error(
      'MONGODB_URI must be a valid MongoDB connection string (mongodb:// or mongodb+srv://).'
    );
  }

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  try {
    console.log(`Connecting to MongoDB at: ${uri.replace(/:([^@]+)@/, ':****@')}`);
    // Use 8-second timeout for primary connection to fallback faster
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`MongoDB connected successfully: ${mongoose.connection.host}`);
  } catch (error) {
    const fallbackUri = 'mongodb://127.0.0.1:27017/smart_complaint_management';
    if (uri !== fallbackUri) {
      console.warn(`MongoDB primary connection failed: ${error.message}`);
      console.log(`Falling back to local MongoDB: ${fallbackUri}`);
      try {
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000
        });
        console.log(`MongoDB connected to fallback: ${mongoose.connection.host}`);
      } catch (fallbackError) {
        console.error('MongoDB fallback connection failed:', fallbackError.message);
        process.exit(1);
      }
    } else {
      console.error('MongoDB connection failed:', error.message);
      process.exit(1);
    }
  }

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const complaintsExists = collections.some(col => col.name === 'complaints');
    if (complaintsExists) {
      const complaintsCollection = db.collection('complaints');
      const indexes = await complaintsCollection.indexes();
      console.log('Active complaints collection indexes:', indexes.map(idx => idx.name));
      
      const hasIdIndex = indexes.some(idx => idx.name === 'id_1');
      if (hasIdIndex) {
        console.log('Dropping unique index "id_1" on complaints collection...');
        await complaintsCollection.dropIndex('id_1');
        console.log('Successfully dropped "id_1" unique index.');
      }
    }
  } catch (indexError) {
    console.error('Failed to run index migrations:', indexError.message);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};