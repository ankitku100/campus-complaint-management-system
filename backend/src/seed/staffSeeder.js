const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const staffData = [
  // Hostel
  { name: 'Rahul Sharma', email: 'hostel.staff1@gmail.com', category: 'Hostel' },
  { name: 'Priya Reddy', email: 'hostel.staff2@gmail.com', category: 'Hostel' },
  { name: 'Nikhil Kumar', email: 'hostel.staff3@gmail.com', category: 'Hostel' },
  { name: 'Sneha Patel', email: 'hostel.staff4@gmail.com', category: 'Hostel' },

  // Academic
  { name: 'Arjun Singh', email: 'academic.staff1@gmail.com', category: 'Academic' },
  { name: 'Kiran Verma', email: 'academic.staff2@gmail.com', category: 'Academic' },
  { name: 'Amit Patel', email: 'academic.staff3@gmail.com', category: 'Academic' },
  { name: 'Ananya Rao', email: 'academic.staff4@gmail.com', category: 'Academic' },

  // Infrastructure
  { name: 'Vikram Malhotra', email: 'infra.staff1@gmail.com', category: 'Infrastructure' },
  { name: 'Neha Gupta', email: 'infra.staff2@gmail.com', category: 'Infrastructure' },
  { name: 'Rohan Deshmukh', email: 'infra.staff3@gmail.com', category: 'Infrastructure' },
  { name: 'Pooja Nair', email: 'infra.staff4@gmail.com', category: 'Infrastructure' },

  // IT Services
  { name: 'Manish Joshi', email: 'it.staff1@gmail.com', category: 'IT Services' },
  { name: 'Shreya Sen', email: 'it.staff2@gmail.com', category: 'IT Services' },
  { name: 'Sanjay Dutt', email: 'it.staff3@gmail.com', category: 'IT Services' },
  { name: 'Kavita Krishnan', email: 'it.staff4@gmail.com', category: 'IT Services' },

  // Security
  { name: 'Aditya Hegde', email: 'security.staff1@gmail.com', category: 'Security' },
  { name: 'Divya Iyer', email: 'security.staff2@gmail.com', category: 'Security' },
  { name: 'Harish Pillai', email: 'security.staff3@gmail.com', category: 'Security' },
  { name: 'Meera Nair', email: 'security.staff4@gmail.com', category: 'Security' }
];

const seedStaff = async () => {
  let createdCount = 0;
  let skippedCount = 0;

  const passwordHash = await bcrypt.hash('Ankit@100', 12);

  for (const staff of staffData) {
    const existing = await User.findOne({ email: staff.email.toLowerCase() });
    if (!existing) {
      await User.create({
        name: staff.name,
        email: staff.email.toLowerCase(),
        password: passwordHash,
        role: 'STAFF',
        isVerified: true,
        category: staff.category,
        createdAt: new Date()
      });
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`Created: ${createdCount} staff accounts`);
  console.log(`Skipped: ${skippedCount} duplicates`);
};

if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('../config/db');

  const run = async () => {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected! Seeding staff accounts...');
    await seedStaff();
    await disconnectDB();
    console.log('Disconnected!');
  };

  run().catch(async (err) => {
    console.error('Seeding failed:', err);
    try {
      await disconnectDB();
    } catch (_) {}
    process.exit(1);
  });
}

module.exports = seedStaff;
