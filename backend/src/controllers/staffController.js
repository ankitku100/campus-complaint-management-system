const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { serializeComplaint } = require('../utils/serializers');
const { populateComplaint } = require('./complaintController');
const { uploadImage } = require('../utils/uploadService');
const { sendWorkCompletedEmail } = require('../services/emailService');
const { updateStaffWorkload } = require('../services/autoAssignmentService');

const assignedComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { assignedStaff: req.user._id };
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }
    if (req.query.priority && req.query.priority !== 'All') {
      filter.priority = req.query.priority;
    }

    if (req.query.search) {
      const searchVal = req.query.search.trim();
      const searchRegex = new RegExp(searchVal, 'i');
      filter.$and = [
        { assignedStaff: req.user._id },
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { location: searchRegex }
          ]
        }
      ];
      if (mongoose.Types.ObjectId.isValid(searchVal)) {
        filter.$and[1].$or.push({ _id: searchVal });
      }
    }

    const total = await Complaint.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const complaints = await populateComplaint(
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    );

    res.json({
      success: true,
      complaints: complaints.map(serializeComplaint),
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve assigned complaints.' });
  }
};

const updateComplaint = async (req, res) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, assignedStaff: req.user._id });
  if (!complaint) return res.status(404).json({ message: 'Assigned complaint not found.' });
  const { status, remarks = '', resolutionImage = '' } = req.body;
  complaint.status = status;
  if (status === 'Assigned') {
    complaint.assignedAt = new Date();
  } else if (status === 'In Progress') {
    complaint.startedAt = new Date();
  } else if (['Completed', 'Verified', 'Resolved'].includes(status)) {
    complaint.resolvedAt = new Date();
  } else if (status === 'Closed') {
    complaint.closedAt = new Date();
  }
  if (remarks) {
    complaint.remarks.push({ message: remarks });
    if (status === 'Resolved') complaint.resolutionRemarks = remarks;
  }
  if (status === 'Resolved' && resolutionImage) complaint.resolutionImage = resolutionImage;
  complaint.timeline.push({
    status,
    message: `${req.user.name} updated status to ${status}${remarks ? `. Remark: ${remarks}` : ''}`
  });
  await complaint.save();
  await updateStaffWorkload(req.user._id);
  const populated = await populateComplaint(Complaint.findById(complaint._id));
  res.json(serializeComplaint(populated));
};

const addRemark = async (req, res) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, assignedStaff: req.user._id });
  if (!complaint) return res.status(404).json({ message: 'Assigned complaint not found.' });
  complaint.remarks.push({ message: req.body.message });
  complaint.timeline.push({ status: complaint.status, message: `${req.user.name}: ${req.body.message}` });
  await complaint.save();
  const populated = await populateComplaint(Complaint.findById(complaint._id));
  res.json(serializeComplaint(populated));
};

const completeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, assignedStaff: req.user._id });
    if (!complaint) {
      return res.status(404).json({ message: 'Assigned complaint not found.' });
    }

    if (!['Assigned', 'In Progress'].includes(complaint.status)) {
      return res.status(400).json({ message: 'Complaint must be in Assigned or In Progress status to be marked completed.' });
    }

    const { notes = '', remarks = '' } = req.body;
    const finalNotes = (notes || remarks || '').trim();
    if (!finalNotes) {
      return res.status(400).json({ message: 'Completion notes are required.' });
    }

    let uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer, file.mimetype));
      uploadedUrls = await Promise.all(uploadPromises);
    }

    complaint.status = 'Completed';
    complaint.workStatus = 'Completed';
    complaint.completedBy = req.user._id;
    complaint.completedAt = new Date();
    complaint.resolvedAt = new Date();
    complaint.completionNotes = finalNotes;
    complaint.completionImages = uploadedUrls;
    complaint.resolutionProofImages = uploadedUrls;
    // For compatibility with any legacy fields
    complaint.resolutionRemarks = finalNotes;
    if (uploadedUrls.length > 0) {
      complaint.resolutionImage = uploadedUrls[0];
    }

    complaint.timeline.push({
      status: 'Completed',
      message: `Work Completed by Staff: ${req.user.name}. Notes: ${finalNotes}`
    });

    await complaint.save();
    await updateStaffWorkload(req.user._id);

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    
    // Trigger work completed email notification (non-blocking)
    if (populated.createdBy && populated.createdBy.email) {
      sendWorkCompletedEmail(populated.createdBy.email, populated.createdBy.name, req.user.name, populated);
    }

    res.json(serializeComplaint(populated));
  } catch (error) {
    console.error('completeComplaint error:', error);
    res.status(500).json({ message: error.message || 'Failed to complete complaint.' });
  }
};

const getPerformance = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      assignedStaff: req.user._id,
      rating: { $exists: true, $ne: null },
      status: { $in: ['Closed', 'Verified'] }
    })
      .populate('createdBy', 'name email')
      .sort({ ratedAt: -1 });

    const escalatedCount = await Complaint.countDocuments({
      assignedStaff: req.user._id,
      status: 'Escalated'
    });

    const totalReviews = complaints.length;
    let averageRating = 0;
    let performanceScore = 0;
    
    if (totalReviews > 0) {
      const sum = complaints.reduce((acc, c) => acc + c.rating, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(2));
      performanceScore = Math.max(0, parseFloat(((averageRating / 5) * 100 - escalatedCount * 10).toFixed(1)));
    }

    const recentFeedback = complaints.map(c => ({
      complaintId: c.id,
      dbId: c._id.toString(),
      complaintTitle: c.title,
      studentName: c.createdBy?.name || 'Unknown Student',
      rating: c.rating,
      feedback: c.feedback,
      ratedAt: c.ratedAt
    }));

    res.json({
      averageRating,
      totalReviews,
      performanceScore,
      recentFeedback,
      escalatedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch performance stats.' });
  }
};

const getStaffStats = async (req, res) => {
  try {
    const staffId = req.user._id;
    const [totalTasks, pendingTasks, activeTasks, completedTasks, staffUser] = await Promise.all([
      Complaint.countDocuments({ assignedStaff: staffId }),
      Complaint.countDocuments({ assignedStaff: staffId, status: 'Assigned' }),
      Complaint.countDocuments({ assignedStaff: staffId, status: 'In Progress' }),
      Complaint.countDocuments({ assignedStaff: staffId, status: { $in: ['Completed', 'Verified', 'Closed'] } }),
      User.findById(staffId)
    ]);
    
    res.json({
      totalTasks,
      pendingTasks,
      activeTasks,
      completedTasks,
      currentWorkloadScore: staffUser ? (staffUser.currentWorkloadScore || 0) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve staff stats.' });
  }
};

const getStaffProfileStats = async (req, res) => {
  try {
    const staffId = req.user._id;
    console.log(`[Stats Debug] Logged-in User ID: ${staffId}, User Role: ${req.user.role}`);

    const [jobsAssigned, jobsInProgress, jobsCompleted] = await Promise.all([
      Complaint.countDocuments({
        assignedStaff: staffId,
        status: { $in: ['Assigned', 'In Progress', 'Resolved', 'Completed', 'Verified', 'Closed'] }
      }),
      Complaint.countDocuments({
        assignedStaff: staffId,
        status: 'In Progress'
      }),
      Complaint.countDocuments({
        assignedStaff: staffId,
        status: { $in: ['Completed', 'Verified', 'Closed'] }
      })
    ]);

    const activeComplaints = await Complaint.aggregate([
      { $match: { assignedStaff: staffId, status: { $in: ['Assigned', 'In Progress'] } } },
      {
        $group: {
          _id: null,
          workloadScore: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                  { case: { $eq: ['$priority', 'Critical'] }, then: 5 }
                ],
                default: 0
              }
            }
          }
        }
      }
    ]);
    const currentWorkloadScore = activeComplaints.length > 0 ? activeComplaints[0].workloadScore : 0;

    console.log(`[Stats Debug] Staff Stats - matched count: jobsAssigned=${jobsAssigned}, jobsInProgress=${jobsInProgress}, jobsCompleted=${jobsCompleted}, currentWorkloadScore=${currentWorkloadScore}`);

    res.json({
      jobsAssigned,
      jobsInProgress,
      jobsCompleted,
      currentWorkloadScore
    });
  } catch (error) {
    console.error('[Stats Error] getStaffProfileStats failed:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve staff profile stats.' });
  }
};

module.exports = { assignedComplaints, updateComplaint, addRemark, completeComplaint, getPerformance, getStaffStats, getStaffProfileStats };
