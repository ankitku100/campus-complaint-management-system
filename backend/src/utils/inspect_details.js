const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const uri = 'mongodb+srv://231fa04e29_db:Ankit%40100@ankitdatabase.zrvnxt7.mongodb.net/smart_complaint_management?retryWrites=true&w=majority';

const run = async () => {
  console.log('Connecting to Atlas...');
  await mongoose.connect(uri);
  console.log('Connected!');

  try {
    // 1. Roles audit
    const users = await User.find({});
    console.log(`\n--- USERS AUDIT (Total: ${users.length}) ---`);
    const rolesMap = {};
    const lowerCaseOrMixedRoles = [];
    const unverifiedStaff = [];
    
    users.forEach(u => {
      rolesMap[u.role] = (rolesMap[u.role] || 0) + 1;
      if (!['USER', 'STAFF', 'ADMIN'].includes(u.role)) {
        lowerCaseOrMixedRoles.push({ email: u.email, role: u.role });
      }
      if (u.role === 'STAFF' && !u.isVerified) {
        unverifiedStaff.push(u.email);
      }
    });
    console.log('Roles distribution in DB:', rolesMap);
    if (lowerCaseOrMixedRoles.length > 0) {
      console.log('⚠️ Mixed or lowercase roles found:', lowerCaseOrMixedRoles);
    } else {
      console.log('✅ All roles are properly normalized to USER, STAFF, or ADMIN.');
    }
    console.log(`Staff accounts awaiting verification: ${unverifiedStaff.length} (${unverifiedStaff.join(', ') || 'none'})`);

    // 2. Complaints audit
    const complaints = await Complaint.find({});
    console.log(`\n--- COMPLAINTS AUDIT (Total: ${complaints.length}) ---`);
    const statusMap = {};
    const categoryMap = {};
    let brokenCreatedBy = 0;
    let brokenAssignedStaff = 0;

    const userIds = new Set(users.map(u => u._id.toString()));

    for (const c of complaints) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;

      if (!c.createdBy || !userIds.has(c.createdBy.toString())) {
        brokenCreatedBy++;
        console.log(`  Broken createdBy ref in complaint: ${c._id} (ref: ${c.createdBy})`);
      }
      if (c.assignedStaff && !userIds.has(c.assignedStaff.toString())) {
        brokenAssignedStaff++;
        console.log(`  Broken assignedStaff ref in complaint: ${c._id} (ref: ${c.assignedStaff})`);
      }
    }

    console.log('Complaints status distribution:', statusMap);
    console.log('Complaints category distribution:', categoryMap);
    console.log(`Broken createdBy refs: ${brokenCreatedBy}`);
    console.log(`Broken assignedStaff refs: ${brokenAssignedStaff}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

run().catch(console.error);
