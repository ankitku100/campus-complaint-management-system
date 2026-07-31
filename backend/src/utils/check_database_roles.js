require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkDb = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  try {
    const roles = await User.distinct('role');
    console.log('Distinct roles in the User database:', roles);

    const counts = {};
    for (const r of roles) {
      counts[r] = await User.countDocuments({ role: r });
    }
    console.log('Counts per role:', counts);

    const students = await User.find({ role: 'STUDENT' });
    if (students.length > 0) {
      console.error('⚠️ WARNING: Found users with role "STUDENT" in the database!', students.map(s => s.email));
    } else {
      console.log('✅ PASS: No users with role "STUDENT" exist in the database.');
    }

    const users = await User.find({ role: 'USER' }).limit(3);
    console.log('Sample USER (Student) accounts:', users.map(u => ({ email: u.email, role: u.role })));

    const staff = await User.find({ role: 'STAFF' }).limit(3);
    console.log('Sample STAFF accounts:', staff.map(s => ({ email: s.email, role: s.role, category: s.category })));

    const admins = await User.find({ role: 'ADMIN' });
    console.log('ADMIN accounts:', admins.map(a => ({ email: a.email, role: a.role })));

  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

checkDb();
