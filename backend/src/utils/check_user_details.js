require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkUser = async () => {
  const emailToFind = '231fa04e29@gmail.com';
  console.log(`Searching for ${emailToFind}...`);

  // Check local database
  console.log('\n--- Checking Local Database ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Local DB.');
    const userLocal = await User.findOne({ email: emailToFind }).select('+password');
    if (userLocal) {
      console.log('FOUND in Local DB:');
      console.log('ID:', userLocal._id);
      console.log('Role:', userLocal.role);
      console.log('Verified:', userLocal.isVerified);
      console.log('Password Hash:', userLocal.password);
    } else {
      console.log('NOT FOUND in Local DB.');
    }
  } catch (err) {
    console.error('Local DB Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }

  // Check Atlas database
  console.log('\n--- Checking Atlas Database ---');
  const atlasUri = 'mongodb+srv://231fa04e29_db:AnkitE29@ankitdatabase.zrvnxt7.mongodb.net/smart_complaint_management?retryWrites=true&w=majority';
  try {
    await mongoose.connect(atlasUri);
    console.log('Connected to Atlas DB.');
    const userAtlas = await User.findOne({ email: emailToFind }).select('+password');
    if (userAtlas) {
      console.log('FOUND in Atlas DB:');
      console.log('ID:', userAtlas._id);
      console.log('Role:', userAtlas.role);
      console.log('Verified:', userAtlas.isVerified);
      console.log('Password Hash:', userAtlas.password);
    } else {
      console.log('NOT FOUND in Atlas DB.');
    }
  } catch (err) {
    console.error('Atlas DB Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

checkUser();
