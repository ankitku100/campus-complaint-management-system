require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { autoAssignComplaint, updateStaffWorkload } = require('../services/autoAssignmentService');

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  // 1. Seed two staff members in category "Academic"
  let staffA = await User.findOne({ email: 'staff_acad_a@test.com' });
  if (!staffA) {
    staffA = await User.create({
      name: 'Staff Academic A',
      email: 'staff_acad_a@test.com',
      password: 'password123',
      role: 'STAFF',
      category: 'Academic',
      isVerified: true
    });
  }

  let staffB = await User.findOne({ email: 'staff_acad_b@test.com' });
  if (!staffB) {
    staffB = await User.create({
      name: 'Staff Academic B',
      email: 'staff_acad_b@test.com',
      password: 'password123',
      role: 'STAFF',
      category: 'Academic',
      isVerified: true
    });
  }

  console.log('Seeded academic staff members:');
  console.log(`- Staff A: ${staffA.name} (${staffA.email})`);
  console.log(`- Staff B: ${staffB.name} (${staffB.email})`);

  // Find a student to use as creator
  let student = await User.findOne({ role: 'USER' });
  if (!student) {
    student = await User.create({
      name: 'Test Student',
      email: 'test_student_assign@test.com',
      password: 'password123',
      role: 'USER',
      isVerified: true
    });
  }

  // 2. Clear old complaints for test staff
  await Complaint.deleteMany({ assignedStaff: { $in: [staffA._id, staffB._id] } });

  // 3. Setup workload:
  // Staff A: 1 High Priority Complaint (Score = 3)
  const compA1 = await Complaint.create({
    title: 'Academic Problem for A',
    description: 'Details about academic problem',
    category: 'Academic',
    priority: 'High',
    location: 'Building A',
    createdBy: student._id,
    assignedStaff: staffA._id,
    status: 'Assigned',
    assignedAt: new Date(Date.now() - 10000) // assigned 10s ago
  });

  // Staff B: 1 Low + 1 Medium Priority Complaint (Score = 1 + 2 = 3)
  const compB1 = await Complaint.create({
    title: 'Academic Problem for B 1',
    description: 'Details about academic problem',
    category: 'Academic',
    priority: 'Low',
    location: 'Building B',
    createdBy: student._id,
    assignedStaff: staffB._id,
    status: 'Assigned',
    assignedAt: new Date(Date.now() - 5000) // assigned 5s ago
  });

  const compB2 = await Complaint.create({
    title: 'Academic Problem for B 2',
    description: 'Details about academic problem',
    category: 'Academic',
    priority: 'Medium',
    location: 'Building B',
    createdBy: student._id,
    assignedStaff: staffB._id,
    status: 'In Progress',
    assignedAt: new Date(Date.now() - 2000) // assigned 2s ago (most recent)
  });

  // 4. Update workload scores in database
  const scoreA = await updateStaffWorkload(staffA._id);
  const scoreB = await updateStaffWorkload(staffB._id);

  console.log(`Initial workloads:`);
  console.log(`- Staff A Score: ${scoreA} (Last Assigned: ${compA1.assignedAt.toISOString()})`);
  console.log(`- Staff B Score: ${scoreB} (Last Assigned: ${compB2.assignedAt.toISOString()})`);

  // Workload scores are tied (both are 3).
  // Staff A has the oldest last assignment date (10s ago vs 2s ago).
  // Round-robin tie breaker should allocate the next ticket to Staff A!

  // 5. Submit new complaint
  const newComplaint = await Complaint.create({
    title: 'Academic Issue Tie Breaker',
    description: 'Details about tie breaker academic issue',
    category: 'Academic',
    priority: 'Medium', // weight = 2
    location: 'Library',
    createdBy: student._id
  });

  console.log(`Created new complaint ${newComplaint._id}. Running auto-allocation...`);
  await autoAssignComplaint(newComplaint._id);

  // 6. Verify result
  const assignedComplaint = await Complaint.findById(newComplaint._id).populate('assignedStaff', 'name email');
  console.log('Result:');
  console.log(`- Assigned Staff Name: ${assignedComplaint.assignedStaff ? assignedComplaint.assignedComplaint?.assignedStaff?.name || assignedComplaint.assignedStaff.name : 'None'}`);
  console.log(`- Status: ${assignedComplaint.status}`);
  console.log(`- Method: ${assignedComplaint.assignmentMethod}`);
  console.log(`- AutoAssigned: ${assignedComplaint.autoAssigned}`);

  if (assignedComplaint.assignedStaff && assignedComplaint.assignedStaff._id.toString() === staffA._id.toString()) {
    console.log('SUCCESS: Auto allocation correctly broke tie using Round-Robin (selected Staff A)!');
  } else {
    console.error('FAILURE: Expected Staff A to be selected due to older assignment date.');
  }

  // 7. Cleanup
  await Complaint.deleteMany({ assignedStaff: { $in: [staffA._id, staffB._id] } });
  await Complaint.deleteOne({ _id: newComplaint._id });
  
  await mongoose.disconnect();
  console.log('Disconnected!');
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
});
