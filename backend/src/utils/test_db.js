require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  console.log('Querying complaints with populate...');
  const complaints = await Complaint.find({})
    .populate('createdBy', 'name email')
    .populate('assignedStaff', 'name email category')
    .populate('completedBy', 'name email');
  console.log('Complaints count:', complaints.length);
  console.log('First complaint:', complaints[0] ? complaints[0].title : 'None');

  await mongoose.disconnect();
  console.log('Disconnected!');
};

run().catch(console.error);
