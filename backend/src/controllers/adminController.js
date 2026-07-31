const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { serializeUser, serializeComplaint } = require('../utils/serializers');
const { 
  sendStaffApprovalEmail, 
  sendStaffRejectionEmail, 
  sendStaffAssignedEmail, 
  sendComplaintClosedEmail 
} = require('../services/emailService');
const { checkAndEscalateComplaints } = require('../services/escalationService');
const { updateStaffWorkload } = require('../services/autoAssignmentService');

// In-memory stats cache configuration
let adminStatsCache = null;
let adminStatsCacheTime = 0;
const CACHE_DURATION_MS = 30 * 1000; // 30 seconds

const pendingStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'STAFF', isVerified: false }).sort({ createdAt: -1 });
    const staffIds = staff.map((s) => s._id);
    const complaintCounts = await Complaint.aggregate([
      { $match: { assignedStaff: { $in: staffIds } } },
      { $group: { _id: '$assignedStaff', count: { $sum: 1 } } }
    ]);
    const countsMap = {};
    complaintCounts.forEach((c) => {
      if (c._id) countsMap[c._id.toString()] = c.count;
    });

    const staffWithCounts = staff.map((s) => {
      const serialized = serializeUser(s);
      serialized.assignedComplaintsCount = countsMap[s._id.toString()] || 0;
      return serialized;
    });
    res.json(staffWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve pending staff.' });
  }
};

const verifiedStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'STAFF', isVerified: true }).sort({ name: 1 });
    const staffIds = staff.map((s) => s._id);
    const complaintCounts = await Complaint.aggregate([
      { $match: { assignedStaff: { $in: staffIds } } },
      { $group: { _id: '$assignedStaff', count: { $sum: 1 } } }
    ]);
    const countsMap = {};
    complaintCounts.forEach((c) => {
      if (c._id) countsMap[c._id.toString()] = c.count;
    });

    const staffWithCounts = staff.map((s) => {
      const serialized = serializeUser(s);
      serialized.assignedComplaintsCount = countsMap[s._id.toString()] || 0;
      return serialized;
    });
    res.json(staffWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve verified staff.' });
  }
};

const approveStaff = async (req, res) => {
  const staff = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'STAFF' },
    { isVerified: true },
    { new: true }
  );
  if (!staff) return res.status(404).json({ message: 'Staff account not found.' });

  // Trigger email notification (non-blocking)
  sendStaffApprovalEmail(staff.email, staff.name);

  res.json({ message: 'Staff account approved.', user: serializeUser(staff) });
};

const deleteStaff = async (req, res) => {
  const staff = await User.findOneAndDelete({ _id: req.params.id, role: 'STAFF' });
  if (!staff) return res.status(404).json({ message: 'Staff account not found.' });

  // Trigger email notification (non-blocking)
  sendStaffRejectionEmail(staff.email, staff.name);

  await Complaint.updateMany(
    { assignedStaff: staff._id },
    { 
      $set: { 
        assignedStaff: null, 
        status: 'Waiting For Staff',
        workStatus: 'Waiting For Staff',
        autoAssigned: true,
        assignmentMethod: 'AUTO'
      } 
    }
  );
  res.json({ message: 'Staff account deleted.' });
};

const stats = async (req, res) => {
  try {
    const now = Date.now();
    if (adminStatsCache && (now - adminStatsCacheTime < CACHE_DURATION_MS)) {
      return res.json(adminStatsCache);
    }

    const [totalUsers, totalStaff, pendingStaffCount, totalComplaints, verifiedCount, completedCount, escalatedCount, categoryCounts] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'STAFF' }),
      User.countDocuments({ role: 'STAFF', isVerified: false }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['Verified', 'Closed'] } }),
      Complaint.countDocuments({ status: 'Completed' }),
      Complaint.countDocuments({ $or: [{ status: 'Escalated' }, { isEscalated: true }] }),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    const categoriesMap = {};
    categoryCounts.forEach((c) => {
      if (c._id) categoriesMap[c._id] = c.count;
    });

    // Query verified staff current workloads
    const verifiedStaffList = await User.find({ role: 'STAFF', isVerified: true }).select('name email category currentWorkloadScore');
    
    // Sort staff list to find most/least loaded
    const staffSortedByWorkload = [...verifiedStaffList].sort((a, b) => b.currentWorkloadScore - a.currentWorkloadScore);
    
    const mostLoadedStaff = staffSortedByWorkload.length > 0 ? {
      id: staffSortedByWorkload[0]._id.toString(),
      name: staffSortedByWorkload[0].name,
      category: staffSortedByWorkload[0].category,
      workloadScore: staffSortedByWorkload[0].currentWorkloadScore
    } : null;
    
    const leastLoadedStaff = staffSortedByWorkload.length > 0 ? {
      id: staffSortedByWorkload[staffSortedByWorkload.length - 1]._id.toString(),
      name: staffSortedByWorkload[staffSortedByWorkload.length - 1].name,
      category: staffSortedByWorkload[staffSortedByWorkload.length - 1].category,
      workloadScore: staffSortedByWorkload[staffSortedByWorkload.length - 1].currentWorkloadScore
    } : null;

    // Calculate category distribution (workload score sum per category)
    const categoryWorkload = {};
    verifiedStaffList.forEach(s => {
      if (s.category) {
        categoryWorkload[s.category] = (categoryWorkload[s.category] || 0) + s.currentWorkloadScore;
      }
    });

    // Calculate Assignment Balance rating
    let balanceRating = 'Optimal';
    if (staffSortedByWorkload.length > 1) {
      const scores = staffSortedByWorkload.map(s => s.currentWorkloadScore);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const diff = maxScore - minScore;
      
      if (diff === 0) {
        balanceRating = 'Perfect';
      } else if (diff <= 2) {
        balanceRating = 'Optimal';
      } else if (diff <= 5) {
        balanceRating = 'Balanced';
      } else {
        balanceRating = 'Imbalanced';
      }
    } else if (staffSortedByWorkload.length === 1) {
      balanceRating = 'Perfect';
    } else {
      balanceRating = 'No Staff';
    }

    const result = {
      totalUsers,
      totalStaff,
      pendingStaff: pendingStaffCount,
      totalComplaints,
      resolvedComplaints: verifiedCount,
      verifiedComplaints: verifiedCount,
      completedComplaints: completedCount,
      escalatedComplaints: escalatedCount,
      categories: categoriesMap,
      autoAssignmentAnalytics: {
        staffWorkloadScores: verifiedStaffList.map(s => ({
          id: s._id.toString(),
          name: s.name,
          email: s.email,
          category: s.category,
          workloadScore: s.currentWorkloadScore
        })),
        categoryDistribution: categoryWorkload,
        assignmentBalance: balanceRating,
        mostLoadedStaff,
        leastLoadedStaff
      }
    };

    adminStatsCache = result;
    adminStatsCacheTime = now;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve stats.' });
  }
};

const allComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }
    if (req.query.priority && req.query.priority !== 'All') {
      filter.priority = req.query.priority;
    }
    if (req.query.isEscalated) {
      filter.isEscalated = req.query.isEscalated === 'true';
    }

    if (req.query.search) {
      const searchVal = req.query.search.trim();
      const searchRegex = new RegExp(searchVal, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
      if (mongoose.Types.ObjectId.isValid(searchVal)) {
        filter.$or.push({ _id: searchVal });
      }
    }

    console.time('[perf] allComplaints countDocuments');
    const total = await Complaint.countDocuments(filter);
    console.timeEnd('[perf] allComplaints countDocuments');

    console.time('[perf] allComplaints findQuery');
    const complaints = await Complaint.find(filter)
      .select('-chat -remarks') // Optimize by avoiding heavy chat/remarks arrays in lists
      .populate('createdBy', 'name email')
      .populate('assignedStaff', 'name email category')
      .populate('completedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    console.timeEnd('[perf] allComplaints findQuery');

    console.time('[perf] allComplaints serialization');
    const serialized = complaints.map(serializeComplaint);
    console.timeEnd('[perf] allComplaints serialization');

    res.json({
      success: true,
      complaints: serialized,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve complaints.' });
  }
};

const assignStaff = async (req, res) => {
  const staff = await User.findOne({ _id: req.body.staffId, role: 'STAFF', isVerified: true });
  if (!staff) return res.status(404).json({ message: 'Verified staff member not found.' });
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (complaint.category !== staff.category) {
    return res.status(400).json({ message: 'Staff specialization does not match complaint category.' });
  }

  const oldStaffId = complaint.assignedStaff;

  complaint.assignedStaff = staff._id;
  complaint.status = 'Assigned';
  complaint.workStatus = 'Assigned';
  complaint.isEscalated = false;
  complaint.autoAssigned = false;
  complaint.assignmentMethod = 'MANUAL';
  complaint.assignedAt = new Date();
  complaint.timeline.push({ status: 'Assigned', message: `Assigned (Override) to ${staff.name}. Escalation cleared.` });
  await complaint.save();
  await complaint.populate([{ path: 'createdBy', select: 'name email' }, { path: 'assignedStaff', select: 'name email category' }, { path: 'completedBy', select: 'name email' }, { path: 'chat.sender', select: 'email' }]);

  // Update workloads
  await updateStaffWorkload(staff._id);
  if (oldStaffId && oldStaffId.toString() !== staff._id.toString()) {
    await updateStaffWorkload(oldStaffId);
  }

  // Trigger email notification (non-blocking)
  if (complaint.assignedStaff && complaint.createdBy) {
    sendStaffAssignedEmail(
      complaint.assignedStaff.email,
      complaint.assignedStaff.name,
      complaint.createdBy.email,
      complaint.createdBy.name,
      complaint
    );
  }

  res.json(serializeComplaint(complaint));
};

const updateComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  if (req.body.status) {
    complaint.status = req.body.status;
    complaint.workStatus = req.body.status;
    if (req.body.status === 'Assigned') {
      complaint.assignedAt = new Date();
    } else if (req.body.status === 'In Progress') {
      complaint.startedAt = new Date();
    } else if (['Completed', 'Verified', 'Resolved'].includes(req.body.status)) {
      complaint.resolvedAt = new Date();
    } else if (req.body.status === 'Closed') {
      complaint.closedAt = new Date();
    }
  }
  if (req.body.remarks) {
    complaint.remarks.push({ message: req.body.remarks });
    if (req.body.status === 'Resolved' || req.body.status === 'Completed' || req.body.status === 'Verified') {
      complaint.resolutionRemarks = req.body.remarks;
    }
  }
  complaint.timeline.push({
    status: complaint.status,
    message: `Admin updated complaint${req.body.remarks ? `. Remark: ${req.body.remarks}` : ''}`
  });
  await complaint.save();
  if (complaint.assignedStaff) {
    await updateStaffWorkload(complaint.assignedStaff);
  }
  await complaint.populate([{ path: 'createdBy', select: 'name email' }, { path: 'assignedStaff', select: 'name email category' }, { path: 'completedBy', select: 'name email' }, { path: 'chat.sender', select: 'email' }]);
  res.json(serializeComplaint(complaint));
};

const verifyComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (complaint.status !== 'Completed' && complaint.status !== 'Escalated') {
      return res.status(400).json({ message: 'Only completed or escalated complaints can be resolved.' });
    }

    complaint.status = 'Closed';
    complaint.workStatus = 'Closed';
    complaint.closedAt = new Date();
    complaint.isEscalated = false;
    
    complaint.timeline.push({
      status: 'Closed',
      message: `Resolution Marked Resolved by Admin: ${req.user.name}. Escalation cleared.`
    });

    await complaint.save();
    if (complaint.assignedStaff) {
      await updateStaffWorkload(complaint.assignedStaff);
    }
    await complaint.populate([{ path: 'createdBy', select: 'name email' }, { path: 'assignedStaff', select: 'name email category' }, { path: 'completedBy', select: 'name email' }, { path: 'chat.sender', select: 'email' }]);
    
    // Trigger email notification (non-blocking)
    if (complaint.createdBy) {
      sendComplaintClosedEmail(
        complaint.createdBy.email,
        complaint.createdBy.name,
        complaint.assignedStaff?.email || '',
        complaint.assignedStaff?.name || '',
        complaint
      );
    }

    res.json(serializeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to verify complaint.' });
  }
};

const reopenComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (complaint.status !== 'Completed' && complaint.status !== 'Escalated') {
      return res.status(400).json({ message: 'Only completed or escalated complaints can be reopened/returned to staff.' });
    }

    complaint.status = 'In Progress';
    complaint.workStatus = 'In Progress';
    complaint.startedAt = new Date();
    complaint.resolvedAt = null;
    complaint.closedAt = null;
    complaint.isEscalated = false;
    
    complaint.timeline.push({
      status: 'In Progress',
      message: `Complaint Reopened and Returned to Staff by Admin: ${req.user.name}. Escalation cleared.`
    });

    await complaint.save();
    if (complaint.assignedStaff) {
      await updateStaffWorkload(complaint.assignedStaff);
    }
    await complaint.populate([{ path: 'createdBy', select: 'name email' }, { path: 'assignedStaff', select: 'name email category' }, { path: 'completedBy', select: 'name email' }, { path: 'chat.sender', select: 'email' }]);
    
    res.json(serializeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to reopen complaint.' });
  }
};

const staffPerformance = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'STAFF', isVerified: true }).sort({ name: 1 });

    const ratingStats = await Complaint.aggregate([
      { 
        $match: { 
          rating: { $exists: true, $ne: null },
          status: { $in: ['Closed', 'Verified'] }
        } 
      },
      {
        $group: {
          _id: '$assignedStaff',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const escalationStats = await Complaint.aggregate([
      { $match: { status: 'Escalated' } },
      {
        $group: {
          _id: '$assignedStaff',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    const escalationMap = {};

    ratingStats.forEach(stat => {
      if (stat._id) {
        statsMap[stat._id.toString()] = {
          averageRating: parseFloat(stat.averageRating.toFixed(2)),
          totalRatings: stat.totalRatings
        };
      }
    });

    escalationStats.forEach(stat => {
      if (stat._id) {
        escalationMap[stat._id.toString()] = stat.count;
      }
    });

    const rankings = staffMembers.map(staff => {
      const staffIdStr = staff._id.toString();
      const stats = statsMap[staffIdStr] || { averageRating: 0, totalRatings: 0 };
      const escalatedCount = escalationMap[staffIdStr] || 0;
      
      let performanceScore = 0;
      if (stats.totalRatings > 0) {
        const baseScore = (stats.averageRating / 5) * 100;
        performanceScore = Math.max(0, parseFloat((baseScore - escalatedCount * 10).toFixed(1)));
      }

      return {
        id: staffIdStr,
        name: staff.name,
        email: staff.email,
        category: staff.category,
        avatar: staff.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staff.name)}`,
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
        performanceScore: performanceScore,
        escalatedCount
      };
    });

    rankings.sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      if (b.totalRatings !== a.totalRatings) return b.totalRatings - a.totalRatings;
      return a.name.localeCompare(b.name);
    });

    const recentReviews = await Complaint.find({
      rating: { $exists: true, $ne: null }
    })
      .populate('createdBy', 'name email')
      .populate('assignedStaff', 'name email category')
      .sort({ ratedAt: -1 })
      .limit(100);

    const reviews = recentReviews.map(c => ({
      complaintId: c.id,
      dbId: c._id.toString(),
      complaintTitle: c.title,
      studentName: c.createdBy?.name || 'Unknown Student',
      staffName: c.assignedStaff?.name || 'Unassigned',
      staffCategory: c.assignedStaff?.category || '',
      rating: c.rating,
      feedback: c.feedback,
      ratedAt: c.ratedAt
    }));

    res.json({
      rankings,
      reviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch performance stats.' });
  }
};

const checkEscalations = async (req, res) => {
  try {
    const escalated = await checkAndEscalateComplaints();
    res.json({
      success: true,
      count: escalated.length,
      message: 'Escalation check completed successfully',
      escalated: escalated.map(serializeComplaint)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to check escalations.' });
  }
};

const allStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'USER' }).sort({ name: 1 });
    
    const studentList = await Promise.all(students.map(async (student) => {
      const [total, active, closed] = await Promise.all([
        Complaint.countDocuments({ createdBy: student._id }),
        Complaint.countDocuments({ createdBy: student._id, status: { $in: ['Pending', 'Waiting For Staff', 'Assigned', 'In Progress', 'Completed', 'Escalated'] } }),
        Complaint.countDocuments({ createdBy: student._id, status: { $in: ['Verified', 'Closed'] } })
      ]);

      const serialized = serializeUser(student);
      return {
        ...serialized,
        totalComplaints: total,
        activeComplaints: active,
        closedComplaints: closed
      };
    }));

    res.json(studentList);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve students.' });
  }
};

const getAdminProfileStats = async (req, res) => {
  try {
    const adminId = req.user._id;
    console.log(`[Stats Debug] Logged-in User ID: ${adminId}, User Role: ${req.user.role}`);

    const [totalStudents, totalStaff, totalComplaints, pendingComplaints, activeComplaints, closedComplaints] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'STAFF' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['Pending', 'Waiting For Staff'] } }),
      Complaint.countDocuments({ status: { $in: ['Assigned', 'In Progress', 'Completed', 'Escalated'] } }),
      Complaint.countDocuments({ status: { $in: ['Verified', 'Closed'] } })
    ]);

    console.log(`[Stats Debug] Admin Stats - matched count: totalStudents=${totalStudents}, totalStaff=${totalStaff}, totalComplaints=${totalComplaints}, pendingComplaints=${pendingComplaints}, activeComplaints=${activeComplaints}, closedComplaints=${closedComplaints}`);

    res.json({
      totalStudents,
      totalStaff,
      totalComplaints,
      pendingComplaints,
      activeComplaints,
      closedComplaints
    });
  } catch (error) {
    console.error('[Stats Error] getAdminProfileStats failed:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve admin profile stats.' });
  }
};

const adminAddUser = async (req, res) => {
  const { name, email, mobile, password, role, category, department, year, registrationNumber } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role.toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return res.status(403).json({ message: 'Admin account cannot be created.' });
  }

  try {
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      mobile: mobile ? mobile.replace(/\D/g, '') : '',
      password: await bcrypt.hash(password, 12),
      role: normalizedRole,
      category: normalizedRole === 'STAFF' ? category : undefined,
      department: normalizedRole === 'USER' ? department : undefined,
      year: normalizedRole === 'USER' ? year : undefined,
      registrationNumber: normalizedRole === 'USER' ? registrationNumber : undefined,
      isVerified: true
    });

    res.status(201).json(serializeUser(newUser));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create user.' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, category, department, year, registrationNumber } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'ADMIN') {
      return res.status(403).json({ message: 'Admin profile cannot be updated.' });
    }

    if (name) user.name = name;
    if (email) user.email = email.trim().toLowerCase();
    if (mobile !== undefined) user.mobile = mobile ? mobile.replace(/\D/g, '') : '';
    if (user.role === 'STAFF' && category) user.category = category;
    if (user.role === 'USER') {
      if (department !== undefined) user.department = department;
      if (year !== undefined) user.year = year;
      if (registrationNumber !== undefined) user.registrationNumber = registrationNumber;
    }

    await user.save();
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update user.' });
  }
};

const toggleUserVerify = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isVerified = !user.isVerified;
    await user.save();
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to toggle verification.' });
  }
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot deactivate admin account.' });
    }

    user.isDisabled = !user.isDisabled;
    await user.save();
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to toggle status.' });
  }
};

const resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to reset password.' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot delete admin account.' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user.' });
  }
};

const getUserDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const serialized = serializeUser(user);
    let complaints = [];
    let stats = {};

    if (user.role === 'STAFF') {
      complaints = await Complaint.find({ assignedStaff: id }).populate('createdBy assignedStaff').sort({ createdAt: -1 });
      const completed = complaints.filter(c => ['Completed', 'Verified', 'Closed'].includes(c.status));
      const inProgress = complaints.filter(c => c.status === 'In Progress');
      const ratings = completed.filter(c => c.rating !== undefined && c.rating !== null).map(c => c.rating);
      const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0;
      const resolutionTimes = completed.filter(c => c.completedAt).map(c => (c.completedAt - c.createdAt) / (1000 * 60 * 60));
      const avgResolutionTime = resolutionTimes.length > 0 ? parseFloat((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)) : 0;

      stats = {
        jobsAssigned: complaints.length,
        jobsInProgress: inProgress.length,
        jobsCompleted: completed.length,
        averageRating: avgRating,
        averageResolutionTime: avgResolutionTime
      };
    } else if (user.role === 'USER') {
      complaints = await Complaint.find({ createdBy: id }).populate('createdBy assignedStaff').sort({ createdAt: -1 });
      const active = complaints.filter(c => !['Verified', 'Closed'].includes(c.status));
      const resolved = complaints.filter(c => ['Completed', 'Verified'].includes(c.status));
      const closed = complaints.filter(c => c.status === 'Closed');
      const escalated = complaints.filter(c => c.isEscalated);
      const ratings = closed.filter(c => c.rating !== undefined && c.rating !== null).map(c => c.rating);
      const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0;

      stats = {
        totalRaised: complaints.length,
        activeComplaints: active.length,
        resolvedComplaints: resolved.length,
        closedComplaints: closed.length,
        escalatedComplaints: escalated.length,
        averageRatingGiven: avgRating
      };
    }

    res.json({
      user: serialized,
      stats,
      complaints: complaints.map(serializeComplaint)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve user details.' });
  }
};

module.exports = {
  pendingStaff,
  verifiedStaff,
  approveStaff,
  deleteStaff,
  stats,
  allComplaints,
  assignStaff,
  updateComplaint,
  verifyComplaint,
  reopenComplaint,
  staffPerformance,
  checkEscalations,
  allStudents,
  getAdminProfileStats,
  adminAddUser,
  updateUser,
  toggleUserVerify,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
  getUserDetails
};
