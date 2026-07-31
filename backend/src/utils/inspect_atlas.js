const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const uri = 'mongodb+srv://231fa04e29_db:Ankit%40100@ankitdatabase.zrvnxt7.mongodb.net/smart_complaint_management?retryWrites=true&w=majority';

const inspect = async () => {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected!');

  try {
    const users = await User.find({});
    console.log(`\n=== USERS (Total: ${users.length}) ===`);
    users.forEach(u => {
      console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Verified: ${u.isVerified} | Category: ${u.category || 'N/A'}`);
    });

    const complaints = await Complaint.find({});
    console.log(`\n=== COMPLAINTS (Total: ${complaints.length}) ===`);
    complaints.forEach(c => {
      console.log(`ID: ${c._id} | Title: ${c.title} | Category: ${c.category} | Priority: ${c.priority} | Status: ${c.status} | CreatedBy: ${c.createdBy} | AssignedStaff: ${c.assignedStaff || 'Unassigned'}`);
    });

    if (users.length > 0) {
      console.log('\n=== SAMPLE USER ===');
      console.log(JSON.stringify(users[0], null, 2));
    }

    if (complaints.length > 0) {
      console.log('\n=== SAMPLE COMPLAINT ===');
      console.log(JSON.stringify(complaints[0], null, 2));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  }
};

inspect();
