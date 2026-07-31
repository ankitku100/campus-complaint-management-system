require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  // Check Admin
  const adminEmail = 'campuscare.service@gmail.com';
  const adminUser = await User.findOne({ email: adminEmail }).select('+password');
  if (adminUser) {
    console.log(`\nAdmin found: ${adminUser.email}`);
    console.log('Role:', adminUser.role);
    console.log('isVerified:', adminUser.isVerified);
    const match = await bcrypt.compare('admin@123', adminUser.password);
    console.log('Password "admin@123" match:', match);
  } else {
    console.log(`\nAdmin ${adminEmail} not found!`);
  }

  // Check Staff Member
  const staffEmail = 'security.staff1@gmail.com';
  const staffUser = await User.findOne({ email: staffEmail }).select('+password');
  if (staffUser) {
    console.log(`\nStaff found: ${staffUser.email}`);
    console.log('Role:', staffUser.role);
    console.log('isVerified:', staffUser.isVerified);
    console.log('Category:', staffUser.category);
    const match = await bcrypt.compare('Ankit@100', staffUser.password);
    console.log('Password "Ankit@100" match:', match);
  } else {
    console.log(`\nStaff ${staffEmail} not found!`);
  }

  await mongoose.disconnect();
  console.log('Disconnected!');
};

run().catch(console.error);
