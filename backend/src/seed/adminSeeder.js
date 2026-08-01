const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');

const seedAdmin = async () => {
  // Seed default categories first
  const defaultCategories = [
    "Hostel",
    "Academic",
    "Infrastructure",
    "IT Services",
    "Security",
    "Other"
  ];

  for (const catName of defaultCategories) {
    const exists = await Category.findOne({ name: catName });
    if (!exists) {
      await Category.create({ name: catName });
      console.log(`Seeded category: ${catName}`);
    }
  }

  // Check if any admin already exists or needs migration
  const admins = await User.find({ role: 'ADMIN' });
  
  if (admins.length > 0) {
    const newAdmin = admins.find(a => a.email === 'campuscare.service@gmail.com');
    if (newAdmin) {
      // Clean up duplicate old admin@gmail.com if it exists to prevent duplicate admin accounts
      await User.deleteMany({ role: 'ADMIN', email: 'admin@gmail.com' });
      newAdmin.isEmailVerified = true;
      await newAdmin.save();
      console.log(`Admin account exists with new email: ${newAdmin.email}. Cleaned up duplicates.`);
    } else {
      const oldAdmin = admins.find(a => a.email === 'admin@gmail.com');
      if (oldAdmin) {
        oldAdmin.email = 'campuscare.service@gmail.com';
        oldAdmin.isEmailVerified = true;
        await oldAdmin.save();
        console.log('Migrated default admin email from admin@gmail.com to campuscare.service@gmail.com');
      } else {
        admins[0].email = 'campuscare.service@gmail.com';
        admins[0].isEmailVerified = true;
        await admins[0].save();
        console.log(`Migrated first admin email to campuscare.service@gmail.com`);
      }
    }
  } else {
    const emailToSeed = 'campuscare.service@gmail.com';
    const passwordToSeed = process.env.ADMIN_PASSWORD || 'admin@123';
    await User.create({
      name: 'System Administrator',
      email: emailToSeed,
      password: await bcrypt.hash(passwordToSeed, 12),
      role: 'ADMIN',
      isVerified: true,
      isEmailVerified: true,
      mobile: '+91 98765 43210'
    });
    console.log(`Demo admin account seeded: ${emailToSeed}`);
  }

  // Demo Student Preset
  const existingStudent = await User.findOne({ email: 'student@test.com' });
  if (!existingStudent) {
    await User.create({
      name: 'Alex Johnson',
      email: 'student@test.com',
      password: await bcrypt.hash('Ankit@100', 12),
      role: 'USER',
      isVerified: true,
      isEmailVerified: true,
      mobile: '+1 (555) 019-2834'
    });
    console.log('Demo student account seeded (student@test.com / Ankit@100)');
  }

  // Demo Staff Preset
  const existingStaff = await User.findOne({ email: 'staff@test.com' });
  if (!existingStaff) {
    await User.create({
      name: 'Marcus Wilson',
      email: 'staff@test.com',
      password: await bcrypt.hash('Ankit@100', 12),
      role: 'STAFF',
      category: 'IT Services',
      isVerified: true,
      isEmailVerified: true,
      mobile: '+1 (555) 018-9876'
    });
    console.log('Demo staff account seeded (staff@test.com / Ankit@100)');
  }

  // Auto-seed user matching EMAIL_USER in .env
  if (process.env.EMAIL_USER) {
    const emailUserVal = process.env.EMAIL_USER.trim().toLowerCase();
    const existingEmailUser = await User.findOne({ email: emailUserVal });
    if (!existingEmailUser) {
      await User.create({
        name: 'Smart Solve User',
        email: emailUserVal,
        password: await bcrypt.hash('Ankit@100', 12),
        role: 'USER',
        isVerified: true,
        isEmailVerified: true,
        mobile: '+1 (555) 012-3456'
      });
      console.log(`Default email user account seeded: ${emailUserVal} / Ankit@100`);
    }
  }
};

module.exports = seedAdmin;


