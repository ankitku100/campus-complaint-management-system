const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const seedComplaints = async () => {
  try {
    const count = await Complaint.countDocuments();
    if (count > 0) {
      console.log('Complaints already exist. Skipping seeding.');
      return;
    }

    console.log('Seeding demo complaints...');
    
    // Find a student/user
    const student = await User.findOne({ role: 'USER' });
    if (!student) {
      console.log('No student/USER account found to seed complaints for.');
      return;
    }

    // Find some staff members
    const hostelStaff = await User.findOne({ role: 'STAFF', category: 'Hostel' });
    const securityStaff = await User.findOne({ role: 'STAFF', category: 'Security' });
    const itStaff = await User.findOne({ role: 'STAFF', category: 'IT Services' });

    const complaintsData = [
      {
        title: 'Broken WiFi Router in Hostel Block B',
        description: 'The WiFi router on the 2nd floor of Block B has been offline since yesterday. We are unable to access the internet for our assignments.',
        category: 'IT Services',
        priority: 'High',
        location: 'Hostel Block B, 2nd Floor Corridor',
        createdBy: student._id,
        assignedStaff: itStaff ? itStaff._id : null,
        status: itStaff ? 'Assigned' : 'Pending',
        workStatus: itStaff ? 'Assigned' : 'Pending',
        timeline: [
          { status: 'Submitted', message: `Complaint registered by ${student.name}` },
          itStaff ? { status: 'Assigned', message: `Assigned to IT Staff: ${itStaff.name}` } : null
        ].filter(Boolean)
      },
      {
        title: 'Water Leakage in Bathroom',
        description: 'There is a continuous water leakage from the flush tank in Room 104 bathroom. It is wasting a lot of water.',
        category: 'Hostel',
        priority: 'Medium',
        location: 'Hostel Block A, Room 104 Bathroom',
        createdBy: student._id,
        assignedStaff: hostelStaff ? hostelStaff._id : null,
        status: hostelStaff ? 'Assigned' : 'Pending',
        workStatus: hostelStaff ? 'Assigned' : 'Pending',
        timeline: [
          { status: 'Submitted', message: `Complaint registered by ${student.name}` },
          hostelStaff ? { status: 'Assigned', message: `Assigned to Hostel Staff: ${hostelStaff.name}` } : null
        ].filter(Boolean)
      },
      {
        title: 'Lost ID Card Near Gate 2',
        description: 'I lost my student ID card near Gate 2 yesterday evening around 6 PM. If found, please return to the security desk.',
        category: 'Security',
        priority: 'Low',
        location: 'Near Gate 2 / Security Post',
        createdBy: student._id,
        assignedStaff: securityStaff ? securityStaff._id : null,
        status: securityStaff ? 'Assigned' : 'Pending',
        workStatus: securityStaff ? 'Assigned' : 'Pending',
        timeline: [
          { status: 'Submitted', message: `Complaint registered by ${student.name}` },
          securityStaff ? { status: 'Assigned', message: `Assigned to Security Staff: ${securityStaff.name}` } : null
        ].filter(Boolean)
      }
    ];

    await Complaint.insertMany(complaintsData);
    console.log('Successfully seeded 3 demo complaints.');
  } catch (err) {
    console.error('Failed to seed complaints:', err.message);
  }
};

module.exports = seedComplaints;
