require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  try {
    const passwordHash = await bcrypt.hash('Ankit@100', 12);
    
    // Update student@test.com
    const resStudent = await User.updateOne(
      { email: 'student@test.com' },
      { $set: { password: passwordHash } }
    );
    console.log('Updated student@test.com password:', resStudent);

    // Update staff@test.com
    const resStaff = await User.updateOne(
      { email: 'staff@test.com' },
      { $set: { password: passwordHash } }
    );
    console.log('Updated staff@test.com password:', resStaff);

  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

run();
