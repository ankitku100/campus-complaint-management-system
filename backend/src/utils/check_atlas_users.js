const mongoose = require('mongoose');
const User = require('../models/User');

const atlasUri = 'mongodb+srv://231fa04e29_db:AnkitE29@ankitdatabase.zrvnxt7.mongodb.net/smart_complaint_management?retryWrites=true&w=majority';

const checkAtlas = async () => {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(atlasUri);
    console.log('Connected!');

    const users = await User.find({});
    console.log(`Total users found in Atlas database: ${users.length}`);
    for (const u of users) {
      console.log(`Email: ${u.email} | Role: ${u.role} | Verified: ${u.isVerified}`);
    }

  } catch (err) {
    console.error('Error checking Atlas:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

checkAtlas();
