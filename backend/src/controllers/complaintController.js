const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { serializeComplaint } = require('../utils/serializers');
const { sendComplaintCreatedEmail, sendComplaintClosedEmail, sendStudentEscalationAdminEmail, sendStudentEscalationStaffEmail } = require('../services/emailService');
const { autoAssignComplaint, updateStaffWorkload } = require('../services/autoAssignmentService');

const populateComplaint = (query) => query
  .populate('createdBy', 'name email')
  .populate('assignedStaff', 'name email category')
  .populate('completedBy', 'name email')
  .populate('chat.sender', 'email');


const canView = (complaint, user) => {
  if (user.role === 'ADMIN') return true;
  
  const createdById = complaint.createdBy?._id || complaint.createdBy;
  const assignedStaffId = complaint.assignedStaff?._id || complaint.assignedStaff;

  const isOwner = createdById && createdById.toString() === user._id.toString();
  const isAssigned = assignedStaffId && assignedStaffId.toString() === user._id.toString();

  return isOwner || isAssigned;
};

const createComplaint = async (req, res, next) => {
  try {
    const imageUrl = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : req.body.imageUrl || '';
    const complaint = await Complaint.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      priority: req.body.priority,
      location: req.body.location,
      imageUrl,
      createdBy: req.user._id,
      timeline: [{ status: 'Submitted', message: `Complaint registered by ${req.user.name}` }]
    });

    // Run Auto Staff Allocation routing engine
    await autoAssignComplaint(complaint._id);

    const saved = await populateComplaint(Complaint.findById(complaint._id));
    const serialized = serializeComplaint(saved);
    // Send complaint registration notification (non-blocking)
    sendComplaintCreatedEmail(req.user.email, req.user.name, saved);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      ...serialized
    });
  } catch (error) {
    // Forward to general error handler
    next(error);
  }
};

const myComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { createdBy: req.user._id };
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
        { createdBy: req.user._id },
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
    res.status(500).json({ message: error.message || 'Failed to retrieve complaints.' });
  }
};

const complaintDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
  }

  try {
    const complaint = await populateComplaint(Complaint.findById(id));
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const ownerId = complaint.createdBy?._id || complaint.createdBy;
    const staffId = complaint.assignedStaff?._id || complaint.assignedStaff;
    const permissionResult = canView(complaint, req.user);

    console.log(`[Debug] Requested Complaint ID: ${id}`);
    console.log(`[Debug] Logged In User ID: ${req.user?._id}`);
    console.log(`[Debug] Logged In User Role: ${req.user?.role}`);
    console.log(`[Debug] Complaint Owner: ${ownerId}`);
    console.log(`[Debug] Assigned Staff: ${staffId}`);
    console.log(`[Debug] Permission Result: ${permissionResult}`);

    if (!permissionResult) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this complaint.' });
    }

    res.json(serializeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve complaint.' });
  }
};

const addMessage = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
  }

  try {
    const complaint = await populateComplaint(Complaint.findById(id));
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (!canView(complaint, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this complaint.' });
    }

    complaint.chat.push({
      sender: req.user._id,
      senderName: req.user.name,
      role: req.user.role,
      message: req.body.message
    });
    await complaint.save();
    await complaint.populate('chat.sender', 'email');
    res.json(serializeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send message.' });
  }
};

const rateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Verify logged-in user is complaint owner
    if (complaint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the complaint owner can rate this complaint.' });
    }

    // Verify complaint is Completed
    if (complaint.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Complaints can only be reviewed after they are completed by staff.' });
    }

    const { rating, feedback, satisfactionStatus } = req.body;

    // Validate rating required and range
    if (rating === undefined || rating === null) {
      return res.status(400).json({ success: false, message: 'Rating is required.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    if (!satisfactionStatus || !['Satisfied', 'Not Satisfied'].includes(satisfactionStatus)) {
      return res.status(400).json({ success: false, message: 'Satisfaction status is required (Satisfied or Not Satisfied).' });
    }

    complaint.rating = numRating;
    complaint.feedback = feedback || '';
    complaint.ratedAt = new Date();

    if (satisfactionStatus === 'Satisfied') {
      complaint.status = 'Closed';
      complaint.workStatus = 'Closed';
      complaint.closedAt = new Date();
      
      complaint.timeline.push({
        status: 'Closed',
        message: `Student reviewed work and is Satisfied. Rating: ${numRating} Star(s). Feedback: ${feedback || ''}`
      });

      await complaint.save();
      if (complaint.assignedStaff) {
        await updateStaffWorkload(complaint.assignedStaff);
      }

      // Notify owner and staff
      const populated = await Complaint.findById(complaint._id)
        .populate('createdBy', 'name email')
        .populate('assignedStaff', 'name email');

      if (populated.createdBy) {
        sendComplaintClosedEmail(
          populated.createdBy.email,
          populated.createdBy.name,
          populated.assignedStaff?.email || '',
          populated.assignedStaff?.name || '',
          populated
        ).catch(err => console.error('Failed to send closed email:', err));
      }
    } else {
      // Not Satisfied -> Escalate to Admin
      complaint.status = 'Escalated';
      complaint.workStatus = 'Escalated';
      complaint.isEscalated = true;
      complaint.escalatedAt = new Date();
      complaint.escalationReason = feedback || 'Student is not satisfied with the resolution.';
      complaint.escalatedBy = req.user._id;

      complaint.escalationHistory.push({
        escalatedAt: new Date(),
        reason: feedback || 'Student is not satisfied with the resolution.',
        previousStatus: 'Completed'
      });

      complaint.timeline.push({
        status: 'Escalated',
        message: `Student reviewed work and is NOT Satisfied. Escalated to Admin. Reason: ${feedback || ''}`
      });

      await complaint.save();
      if (complaint.assignedStaff) {
        await updateStaffWorkload(complaint.assignedStaff);
      }

      // Automatically notify: Admin and Assigned Staff
      const populated = await Complaint.findById(complaint._id)
        .populate('createdBy', 'name email')
        .populate('assignedStaff', 'name email');

      const admin = await User.findOne({ role: 'ADMIN' });
      const adminEmail = admin ? admin.email : 'campuscare.service@gmail.com';

      if (adminEmail) {
        sendStudentEscalationAdminEmail(adminEmail, populated).catch(err =>
          console.error('Failed to send escalation admin email:', err)
        );
      }

      if (populated.assignedStaff && populated.assignedStaff.email) {
        sendStudentEscalationStaffEmail(
          populated.assignedStaff.email,
          populated.assignedStaff.name,
          populated
        ).catch(err => console.error('Failed to send escalation staff email:', err));
      }
    }
    
    return res.status(200).json({
      success: true,
      message: satisfactionStatus === 'Satisfied' ? 'Review submitted and complaint closed.' : 'Complaint escalated to admin.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit rating.' });
  }
};

const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const [totalCount, pendingCount, progressCount, completedCount, resolvedCount] = await Promise.all([
      Complaint.countDocuments({ createdBy: studentId }),
      Complaint.countDocuments({ createdBy: studentId, status: { $in: ['Pending', 'Waiting For Staff'] } }),
      Complaint.countDocuments({ createdBy: studentId, status: { $in: ['Assigned', 'In Progress', 'Escalated'] } }),
      Complaint.countDocuments({ createdBy: studentId, status: 'Completed' }),
      Complaint.countDocuments({ createdBy: studentId, status: { $in: ['Verified', 'Resolved', 'Closed'] } })
    ]);
    
    res.json({
      totalCount,
      pendingCount,
      progressCount,
      completedCount,
      resolvedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve student stats.' });
  }
};

const getStudentProfileStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    console.log(`[Stats Debug] Logged-in User ID: ${studentId}, User Role: ${req.user.role}`);

    const [totalRaised, inProgress, resolved, closed] = await Promise.all([
      Complaint.countDocuments({ createdBy: studentId }),
      Complaint.countDocuments({ createdBy: studentId, status: 'In Progress' }),
      Complaint.countDocuments({ createdBy: studentId, status: { $in: ['Completed', 'Verified', 'Resolved'] } }),
      Complaint.countDocuments({ createdBy: studentId, status: 'Closed' })
    ]);

    const ratingResult = await Complaint.aggregate([
      { $match: { createdBy: studentId, rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingResult.length > 0 ? parseFloat(ratingResult[0].avgRating.toFixed(2)) : 0;

    console.log(`[Stats Debug] Student Stats - matched count: totalRaised=${totalRaised}, inProgress=${inProgress}, resolved=${resolved}, closed=${closed}, averageRating=${averageRating}`);

    res.json({
      totalRaised,
      inProgress,
      resolved,
      closed,
      averageRating
    });
  } catch (error) {
    console.error('[Stats Error] getStudentProfileStats failed:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve student profile stats.' });
  }
};

const getStudentComplaintDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
  }

  try {
    const complaint = await populateComplaint(Complaint.findById(id));
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const createdBy = complaint.createdBy?._id || complaint.createdBy;
    if (createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You do not have permission to access another student's complaint." });
    }

    res.json(serializeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve student complaint details.' });
  }
};

const deleteComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Verify ownership
    if (complaint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this complaint.' });
    }

    // Verify time limit (30 minutes = 1800000 ms)
    const elapsed = Date.now() - new Date(complaint.createdAt).getTime();
    if (elapsed > 30 * 60 * 1000) {
      return res.status(400).json({ message: 'Complaints can only be deleted within 30 minutes of creation.' });
    }

    // If staff is assigned, decrement workload
    if (complaint.assignedStaff) {
      await User.findByIdAndUpdate(complaint.assignedStaff, {
        $inc: { currentWorkloadScore: -1 }
      });
    }

    await Complaint.findByIdAndDelete(id);
    res.json({ message: 'Complaint deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete complaint.' });
  }
};

module.exports = { 
  createComplaint, 
  myComplaints, 
  complaintDetails, 
  addMessage, 
  populateComplaint, 
  rateComplaint, 
  getStudentStats, 
  getStudentProfileStats, 
  getStudentComplaintDetails,
  deleteComplaint
};
