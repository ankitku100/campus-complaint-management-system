require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { login } = require('../controllers/authController');

const createMockRequestResponse = (body = {}) => {
  const req = {
    body
  };
  const res = {
    statusCode: 200,
    headers: {},
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    }
  };
  return { req, res };
};

const runTest = async () => {
  await connectDB();

  try {
    // 1. Setup mock user accounts
    console.log('Setting up mock user accounts...');
    
    // Student (USER)
    let student = await User.findOne({ email: 'test_student_login@test.com' });
    if (!student) {
      student = await User.create({
        name: 'Test Student Login',
        email: 'test_student_login@test.com',
        password: await bcrypt.hash('password123', 12),
        role: 'USER',
        isVerified: true
      });
    }

    // Staff (STAFF)
    let staff = await User.findOne({ email: 'test_staff_login@test.com' });
    if (!staff) {
      staff = await User.create({
        name: 'Test Staff Login',
        email: 'test_staff_login@test.com',
        password: await bcrypt.hash('password123', 12),
        role: 'STAFF',
        category: 'IT Services',
        isVerified: true
      });
    }

    // Admin (ADMIN) - retrieve existing admin or create if none exists
    let admin = await User.findOne({ role: 'ADMIN' });
    let adminPasswordToUse = 'admin@123'; // default seeded admin password
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'campuscare.service@gmail.com',
        password: await bcrypt.hash('admin@123', 12),
        role: 'ADMIN',
        isVerified: true
      });
    } else if (admin.email === 'test_admin_login@test.com') {
      adminPasswordToUse = 'password123';
    }

    console.log('Admin account to use:', admin.email);

    // 2. Scenario 1: Correct credentials, correct portal for Student
    console.log('\n--- Scenario 1: Student Login (Student Portal) ---');
    const { req: req1, res: res1 } = createMockRequestResponse({
      email: 'test_student_login@test.com',
      password: 'password123',
      role: 'USER'
    });
    await login(req1, res1);
    console.log('Status:', res1.statusCode, 'Body:', res1.jsonPayload);
    if (res1.statusCode === 200 && res1.jsonPayload.token && res1.jsonPayload.user.role === 'STUDENT') {
      console.log('✅ PASS: Student logged in successfully from Student Portal.');
    } else {
      console.log('❌ FAIL: Student login failed.');
      process.exitCode = 1;
    }

    // 3. Scenario 2: Student trying to login from Staff Portal
    console.log('\n--- Scenario 2: Student Login (Staff Portal) ---');
    const { req: req2, res: res2 } = createMockRequestResponse({
      email: 'test_student_login@test.com',
      password: 'password123',
      role: 'STAFF'
    });
    await login(req2, res2);
    console.log('Status:', res2.statusCode, 'Body:', res2.jsonPayload);
    if (res2.statusCode === 401 && res2.jsonPayload.message === 'This account belongs to another portal.') {
      console.log('✅ PASS: Correctly blocked Student login from Staff Portal.');
    } else {
      console.log('❌ FAIL: Did not block Student login from Staff Portal correctly.');
      process.exitCode = 1;
    }

    // 4. Scenario 3: Correct credentials, correct portal for Staff
    console.log('\n--- Scenario 3: Staff Login (Staff Portal) ---');
    const { req: req3, res: res3 } = createMockRequestResponse({
      email: 'test_staff_login@test.com',
      password: 'password123',
      role: 'STAFF'
    });
    await login(req3, res3);
    console.log('Status:', res3.statusCode, 'Body:', res3.jsonPayload);
    if (res3.statusCode === 200 && res3.jsonPayload.token && res3.jsonPayload.user.role === 'STAFF') {
      console.log('✅ PASS: Staff logged in successfully from Staff Portal.');
    } else {
      console.log('❌ FAIL: Staff login failed.');
      process.exitCode = 1;
    }

    // 5. Scenario 4: Staff trying to login from Student Portal
    console.log('\n--- Scenario 4: Staff Login (Student Portal) ---');
    const { req: req4, res: res4 } = createMockRequestResponse({
      email: 'test_staff_login@test.com',
      password: 'password123',
      role: 'USER'
    });
    await login(req4, res4);
    console.log('Status:', res4.statusCode, 'Body:', res4.jsonPayload);
    if (res4.statusCode === 401 && res4.jsonPayload.message === 'This account belongs to another portal.') {
      console.log('✅ PASS: Correctly blocked Staff login from Student Portal.');
    } else {
      console.log('❌ FAIL: Did not block Staff login from Student Portal correctly.');
      process.exitCode = 1;
    }

    // 6. Scenario 5: Correct credentials, correct portal for Admin
    console.log('\n--- Scenario 5: Admin Login (Admin Portal) ---');
    const { req: req5, res: res5 } = createMockRequestResponse({
      email: admin.email,
      password: adminPasswordToUse,
      role: 'ADMIN'
    });
    await login(req5, res5);
    console.log('Status:', res5.statusCode, 'Body:', res5.jsonPayload);
    if (res5.statusCode === 200 && res5.jsonPayload.token && res5.jsonPayload.user.role === 'ADMIN') {
      console.log('✅ PASS: Admin logged in successfully from Admin Portal.');
    } else {
      console.log('❌ FAIL: Admin login failed.');
      process.exitCode = 1;
    }

    // 7. Scenario 6: Admin trying to login from Student Portal
    console.log('\n--- Scenario 6: Admin Login (Student Portal) ---');
    const { req: req6, res: res6 } = createMockRequestResponse({
      email: admin.email,
      password: adminPasswordToUse,
      role: 'USER'
    });
    await login(req6, res6);
    console.log('Status:', res6.statusCode, 'Body:', res6.jsonPayload);
    if (res6.statusCode === 401 && res6.jsonPayload.message === 'This account belongs to another portal.') {
      console.log('✅ PASS: Correctly blocked Admin login from Student Portal.');
    } else {
      console.log('❌ FAIL: Did not block Admin login from Student Portal correctly.');
      process.exitCode = 1;
    }

    // 8. Scenario 7: Wrong password
    console.log('\n--- Scenario 7: Wrong Password ---');
    const { req: req7, res: res7 } = createMockRequestResponse({
      email: 'test_student_login@test.com',
      password: 'wrong_password',
      role: 'USER'
    });
    await login(req7, res7);
    console.log('Status:', res7.statusCode, 'Body:', res7.jsonPayload);
    if (res7.statusCode === 401 && res7.jsonPayload.message === 'Incorrect password.') {
      console.log('✅ PASS: Correctly returned wrong credentials error.');
    } else {
      console.log('❌ FAIL: Did not return correct error message for wrong password.');
      process.exitCode = 1;
    }

    // 9. Scenario 8: Non-existent user
    console.log('\n--- Scenario 8: Non-existent User ---');
    const { req: req8, res: res8 } = createMockRequestResponse({
      email: 'nonexistent_user@test.com',
      password: 'some_password',
      role: 'USER'
    });
    await login(req8, res8);
    console.log('Status:', res8.statusCode, 'Body:', res8.jsonPayload);
    if (res8.statusCode === 401 && res8.jsonPayload.message === 'No account found with this email.') {
      console.log('✅ PASS: Correctly returned wrong credentials error for non-existent user.');
    } else {
      console.log('❌ FAIL: Did not return correct error message for non-existent user.');
      process.exitCode = 1;
    }

    // Cleanup mock users
    console.log('\nCleaning up mock user accounts...');
    await User.deleteMany({
      email: { $in: ['test_student_login@test.com', 'test_staff_login@test.com'] }
    });

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runTest();
