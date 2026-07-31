require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const checkUsers = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  try {
    const users = await User.find({}).select('+password');
    const lines = [`Total users found in database: ${users.length}`];

    for (const u of users) {
      const isPassword = await bcrypt.compare('password', u.password);
      const isAnkit = await bcrypt.compare('Ankit@100', u.password);
      const isAdminPass = await bcrypt.compare('admin@123', u.password);

      let foundPass = 'Unknown';
      if (isPassword) foundPass = 'password';
      else if (isAnkit) foundPass = 'Ankit@100';
      else if (isAdminPass) foundPass = 'admin@123';

      lines.push(`Email: ${u.email} | Role: ${u.role} | Verified: ${u.isVerified} | Password match: ${foundPass}`);
    }

    console.log(lines.join('\n'));

  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

checkUsers();
