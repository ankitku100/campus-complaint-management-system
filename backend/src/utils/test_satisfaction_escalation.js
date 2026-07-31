require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { rateComplaint } = require('../controllers/complaintController');
const { staffPerformance, verifyComplaint, reopenComplaint } = require('../controllers/adminController');

const createMockRequestResponse = (user, params = {}, body = {}) => {
  const req = {
    user,
    params,
    body,
    timeline: []
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
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Database.');

  try {
    // 1. Create or retrieve test accounts
    let student = await User.findOne({ email: 'student_test_se@test.com' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'student_test_se@test.com',
        password: 'password123',
        role: 'USER',
        isVerified: true
      });
    }

    let staff = await User.findOne({ email: 'staff_test_se@test.com' });
    if (!staff) {
      staff = await User.create({
        name: 'Test Staff',
        email: 'staff_test_se@test.com',
        password: 'password123',
        role: 'STAFF',
        category: 'IT Services',
        isVerified: true
      });
    }

    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      admin = await User.create({
        name: 'Test Admin',
        email: 'admin_test_se@test.com',
        password: 'password123',
        role: 'ADMIN',
        isVerified: true
      });
    }

    console.log('Clean up existing test complaints for these test accounts...');
    await Complaint.deleteMany({ createdBy: student._id });
    await Complaint.deleteMany({ assignedStaff: staff._id });

    // 2. Test Case 1: Student is SATISFIED
    console.log('\n--- Test Case 1: Student Satisfied ---');
    const comp1 = await Complaint.create({
      title: 'Satisfied Test Complaint',
      description: 'Need my software updated.',
      category: 'IT Services',
      priority: 'Low',
      location: 'Lab A',
      createdBy: student._id,
      assignedStaff: staff._id,
      status: 'Completed',
      workStatus: 'Completed',
      id: `CMP-${Date.now().toString().slice(-6)}1`
    });
    console.log('Created Completed Complaint 1:', comp1.id);

    const { req: req1, res: res1 } = createMockRequestResponse(
      student,
      { id: comp1._id.toString() },
      { rating: 5, feedback: 'Excellent resolution!', satisfactionStatus: 'Satisfied' }
    );

    await rateComplaint(req1, res1);
    console.log('rateComplaint Response status:', res1.statusCode);
    console.log('rateComplaint Response body:', res1.jsonPayload);

    const updatedComp1 = await Complaint.findById(comp1._id);
    console.log('Updated Complaint 1 Status:', updatedComp1.status);
    console.log('Updated Complaint 1 Rating:', updatedComp1.rating);
    console.log('Updated Complaint 1 Feedback:', updatedComp1.feedback);
    console.log('Updated Complaint 1 RatedAt:', updatedComp1.ratedAt);

    if (updatedComp1.status === 'Closed' && updatedComp1.rating === 5 && updatedComp1.feedback === 'Excellent resolution!') {
      console.log('✅ PASS: Satisfaction flow completed and ticket Closed correctly.');
    } else {
      console.log('❌ FAIL: Satisfaction flow did not update ticket fields correctly.');
      process.exitCode = 1;
    }

    // 3. Test Case 2: Student is NOT SATISFIED (Escalated)
    console.log('\n--- Test Case 2: Student Not Satisfied (Escalate) ---');
    const comp2 = await Complaint.create({
      title: 'Dissatisfied Test Complaint',
      description: 'Internet issue persists.',
      category: 'IT Services',
      priority: 'High',
      location: 'Lab B',
      createdBy: student._id,
      assignedStaff: staff._id,
      status: 'Completed',
      workStatus: 'Completed',
      id: `CMP-${Date.now().toString().slice(-6)}2`
    });
    console.log('Created Completed Complaint 2:', comp2.id);

    const { req: req2, res: res2 } = createMockRequestResponse(
      student,
      { id: comp2._id.toString() },
      { rating: 2, feedback: 'Did not fix the issue at all.', satisfactionStatus: 'Not Satisfied' }
    );

    await rateComplaint(req2, res2);
    console.log('rateComplaint Response status:', res2.statusCode);
    console.log('rateComplaint Response body:', res2.jsonPayload);

    const updatedComp2 = await Complaint.findById(comp2._id);
    console.log('Updated Complaint 2 Status:', updatedComp2.status);
    console.log('Updated Complaint 2 Rating:', updatedComp2.rating);
    console.log('Updated Complaint 2 Feedback:', updatedComp2.feedback);
    console.log('Updated Complaint 2 isEscalated:', updatedComp2.isEscalated);
    console.log('Updated Complaint 2 escalationReason:', updatedComp2.escalationReason);
    console.log('Updated Complaint 2 escalatedBy:', updatedComp2.escalatedBy);

    if (
      updatedComp2.status === 'Escalated' &&
      updatedComp2.isEscalated === true &&
      updatedComp2.escalationReason === 'Did not fix the issue at all.' &&
      updatedComp2.escalatedBy.toString() === student._id.toString()
    ) {
      console.log('✅ PASS: Dissatisfied review correctly escalated ticket.');
    } else {
      console.log('❌ FAIL: Dissatisfied review did not escalate ticket correctly.');
      process.exitCode = 1;
    }

    // 4. Test Case 3: Staff Performance Scoring with Escalated Penalty
    console.log('\n--- Test Case 3: Staff Performance Scoring ---');
    const { req: reqPerf, res: resPerf } = createMockRequestResponse(admin);
    await staffPerformance(reqPerf, resPerf);
    
    const targetStaffRanking = resPerf.jsonPayload.rankings.find(r => r.id === staff._id.toString());
    console.log('Staff Average Rating:', targetStaffRanking.averageRating);
    console.log('Staff Total Ratings:', targetStaffRanking.totalRatings);
    console.log('Staff Escalated Count:', targetStaffRanking.escalatedCount);
    console.log('Staff Performance Score:', targetStaffRanking.performanceScore);

    // Calculation verification:
    // Only Satisfied ratings: Complaint 1 (Rating 5). (Average = 5)
    // Base Score = (5 / 5) * 100 = 100
    // Penalty: escalatedCount * 10 = 1 * 10 = 10
    // Expected Performance Score = 100 - 10 = 90
    if (targetStaffRanking.averageRating === 5 && targetStaffRanking.totalRatings === 1 && targetStaffRanking.performanceScore === 90) {
      console.log('✅ PASS: Performance Score correctly calculated: only satisfied reviews included, penalty applied.');
    } else {
      console.log('❌ FAIL: Performance Score calculation error. Expected: averageRating=5, totalRatings=1, score=90. Got:', targetStaffRanking);
      process.exitCode = 1;
    }

    // 5. Test Case 4: Admin Return Escalated Ticket to Staff
    console.log('\n--- Test Case 4: Admin Return to Staff ---');
    const { req: reqReopen, res: resReopen } = createMockRequestResponse(admin, { id: comp2._id.toString() });
    await reopenComplaint(reqReopen, resReopen);
    console.log('reopenComplaint Response status:', resReopen.statusCode);

    const reopendComp2 = await Complaint.findById(comp2._id);
    console.log('Returned Complaint Status:', reopendComp2.status);
    console.log('Returned Complaint isEscalated:', reopendComp2.isEscalated);

    if (reopendComp2.status === 'In Progress' && reopendComp2.isEscalated === false) {
      console.log('✅ PASS: Ticket successfully returned to staff and escalation flag cleared.');
    } else {
      console.log('❌ FAIL: Admin reopen did not transition ticket state correctly.');
      process.exitCode = 1;
    }

    // 6. Test Case 5: Admin Mark Resolved (Close Escalated Ticket)
    console.log('\n--- Test Case 5: Admin Mark Resolved ---');
    // First, let's re-escalate it by setting status back to Escalated and isEscalated to true
    await Complaint.findByIdAndUpdate(comp2._id, { status: 'Escalated', isEscalated: true });
    
    const { req: reqVerify, res: resVerify } = createMockRequestResponse(admin, { id: comp2._id.toString() });
    await verifyComplaint(reqVerify, resVerify);
    console.log('verifyComplaint Response status:', resVerify.statusCode);

    const verifiedComp2 = await Complaint.findById(comp2._id);
    console.log('Verified Complaint Status:', verifiedComp2.status);
    console.log('Verified Complaint isEscalated:', verifiedComp2.isEscalated);

    if (verifiedComp2.status === 'Closed' && verifiedComp2.isEscalated === false) {
      console.log('✅ PASS: Ticket successfully closed by admin and escalation flag cleared.');
    } else {
      console.log('❌ FAIL: Admin verify did not transition ticket state correctly.');
      process.exitCode = 1;
    }

    // Clean up
    await Complaint.deleteMany({ createdBy: student._id });
    await Complaint.deleteMany({ assignedStaff: staff._id });
    await User.deleteOne({ _id: student._id });
    await User.deleteOne({ _id: staff._id });

  } catch (error) {
    console.error('Test execution error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runTest();
