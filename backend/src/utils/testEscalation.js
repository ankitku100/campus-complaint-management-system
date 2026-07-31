require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { checkAndEscalateComplaints } = require('../services/escalationService');

const runTest = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set in environment.');

    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Find or seed a user to own the complaint
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: 'Test Student',
        email: 'test@student.com',
        password: 'password123',
        role: 'USER',
        isVerified: true
      });
      console.log('Created test student.');
    }

    // Find an unresolved complaint or create a new one
    let complaint = await Complaint.findOne({ status: 'Pending', isEscalated: false });
    
    if (!complaint) {
      complaint = new Complaint({
        title: 'Leaking water pipe in Hostel Room 12',
        description: 'Water has been leaking under the sink for a while. Needs urgent plumber fix.',
        category: 'Hostel',
        priority: 'High',
        location: 'Hostel Block B, Room 12',
        status: 'Pending',
        createdBy: user._id,
        id: `CMP-${Date.now().toString().slice(-6)}`
      });
      await complaint.save();
      console.log('Created new dummy complaint:', complaint.id);
    } else {
      console.log('Found existing Pending complaint:', complaint.id);
    }

    // Modify the createdAt field of the complaint to be 4 days ago
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    const db = mongoose.connection.db;
    const complaintsCollection = db.collection('complaints');
    await complaintsCollection.updateOne({ _id: complaint._id }, { $set: { createdAt: fourDaysAgo } });
    console.log(`Updated complaint ${complaint.id} createdAt to 4 days ago via native DB driver:`, fourDaysAgo);

    // Verify update
    const updatedComplaint = await Complaint.findById(complaint._id);
    console.log('Verified updated Complaint createdAt:', updatedComplaint.createdAt);

    console.log('Running checkAndEscalateComplaints()...');
    const escalatedList = await checkAndEscalateComplaints();
    
    console.log('--- Results ---');
    console.log(`Newly escalated count: ${escalatedList.length}`);
    if (escalatedList.length > 0) {
      escalatedList.forEach(c => {
        console.log(`- Escalated: ${c.id}`);
        console.log(`  isEscalated: ${c.isEscalated}`);
        console.log(`  escalatedAt: ${c.escalatedAt}`);
        console.log(`  escalationHistory:`, JSON.stringify(c.escalationHistory, null, 2));
        console.log(`  timeline:`, JSON.stringify(c.timeline, null, 2));
      });
    } else {
      console.log('No complaints were escalated.');
    }
    console.log('---------------');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
};

runTest();
