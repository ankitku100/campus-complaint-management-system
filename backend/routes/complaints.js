import express from 'express';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload, uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Helper to generate sequential ticket ID (e.g., CMP-2026-006)
const generateTicketId = async () => {
  const count = await Complaint.countDocuments();
  const year = new Date().getFullYear();
  const index = (count + 1).toString().padStart(3, '0');
  return `CMP-${year}-${index}`;
};

// @desc    Get complaints (role-based: student=own, staff=assigned, admin=all)
// @route   GET /api/complaints
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.submittedBy = req.user.email;
    } else if (req.user.role === 'staff') {
      // Return both Assigned and In Progress tasks
      query.assignedTo = req.user.email;
    }
    // Admin gets all complaints, others filtered
    
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (error) {
    console.error('Fetch Complaints Error:', error);
    return res.status(500).json({ message: 'Server error fetching complaints' });
  }
});

// @desc    Get all complaints (admin override to monitor everything)
// @route   GET /api/complaints/all
router.get('/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Access restricted to admins.' });
    }
    const complaints = await Complaint.find({}).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (error) {
    console.error('Fetch All Complaints Error:', error);
    return res.status(500).json({ message: 'Server error fetching all complaints' });
  }
});

// @desc    Get complaint by ticket ID
// @route   GET /api/complaints/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Authorization checks
    if (req.user.role === 'student' && complaint.submittedBy !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }
    if (req.user.role === 'staff' && complaint.assignedTo !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }

    return res.json(complaint);
  } catch (error) {
    console.error('Fetch Ticket Details Error:', error);
    return res.status(500).json({ message: 'Server error fetching complaint details' });
  }
});

// @desc    Create a new complaint
// @route   POST /api/complaints
router.post('/', protect, async (req, res) => {
  const { title, description, category, priority, location, images } = req.body;

  try {
    const ticketId = await generateTicketId();

    const complaint = await Complaint.create({
      id: ticketId,
      title,
      description,
      category,
      priority,
      location,
      status: 'Pending',
      workStatus: 'Pending',
      submittedBy: req.user.email,
      submittedByName: req.body.submittedByName || req.user.email.split('@')[0],
      images: images || [],
      timeline: [
        { 
          status: 'Submitted', 
          date: new Date(), 
          message: `Complaint registered by ${req.body.submittedByName || req.user.email}` 
        }
      ]
    });

    return res.status(201).json(complaint);
  } catch (error) {
    console.error('Create Complaint Error:', error);
    return res.status(500).json({ message: 'Server error creating complaint' });
  }
});

// @desc    Assign staff member (Admin only)
// @route   PUT /api/complaints/:id/assign
router.put('/:id/assign', protect, async (req, res) => {
  const { staffEmail } = req.body;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign staff' });
    }

    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Find staff name
    const staff = await User.findOne({ email: staffEmail, role: 'staff' });
    const staffName = staff ? staff.name : staffEmail.split('@')[0];

    complaint.assignedTo = staffEmail;
    complaint.assignedToName = staffName;
    complaint.status = 'Assigned';
    complaint.workStatus = 'Assigned';
    complaint.timeline.push({
      status: 'Assigned',
      date: new Date(),
      message: `Assigned to ${staffName} (${staff?.details || 'Maintenance Staff'})`
    });

    await complaint.save();
    return res.json(complaint);
  } catch (error) {
    console.error('Assign Staff Error:', error);
    return res.status(500).json({ message: 'Server error assigning staff' });
  }
});

// @desc    Update complaint status (Assigned ➔ In Progress, etc.)
// @route   PUT /api/complaints/:id/status
router.put('/:id/status', protect, async (req, res) => {
  const { status, remarks } = req.body;

  try {
    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Authorization: Admin or the assigned staff
    if (req.user.role !== 'admin' && complaint.assignedTo !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    complaint.status = status;
    complaint.workStatus = status;

    complaint.timeline.push({
      status,
      date: new Date(),
      message: `Status updated to ${status}. ${remarks ? `Remark: "${remarks}"` : ''}`
    });

    await complaint.save();
    return res.json(complaint);
  } catch (error) {
    console.error('Update Status Error:', error);
    return res.status(500).json({ message: 'Server error updating status' });
  }
});

// @desc    Mark complaint as Completed by uploading proof (Staff only)
// @route   PUT /api/complaints/:id/complete
router.put('/:id/complete', protect, upload.array('images', 5), async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Security: Only assigned staff
    if (req.user.role !== 'admin' && complaint.assignedTo !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized. Only the assigned staff member can complete this ticket.' });
    }

    const { completionNotes } = req.body;
    if (!completionNotes) {
      return res.status(400).json({ message: 'Completion notes are required.' });
    }

    // Process uploaded images
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, file.mimetype));
      imageUrls = await Promise.all(uploadPromises);
    }

    // Update Complaint fields
    complaint.status = 'Completed';
    complaint.workStatus = 'Completed';
    complaint.completedBy = req.user.name || req.user.email;
    complaint.completedAt = new Date();
    complaint.completionNotes = completionNotes;
    complaint.completionImages = imageUrls;
    complaint.resolutionProofImages = imageUrls; // backward compatibility

    // Audit timeline event
    complaint.timeline.push({
      status: 'Completed',
      date: new Date(),
      message: `Work Completed by Staff: ${req.user.name || req.user.email}. Notes: "${completionNotes}"`
    });

    await complaint.save();
    return res.json(complaint);
  } catch (error) {
    console.error('Work Completion API Error:', error);
    return res.status(500).json({ message: error.message || 'Server error uploading completion proof.' });
  }
});

// @desc    Verify completion (Admin only)
// @route   PUT /api/complaints/:id/verify
router.put('/:id/verify', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can verify completed work.' });
    }

    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = 'Verified';
    complaint.workStatus = 'Verified';
    complaint.timeline.push({
      status: 'Verified',
      date: new Date(),
      message: `Work Verified & Approved by Admin: ${req.user.name || req.user.email}`
    });

    await complaint.save();
    return res.json(complaint);
  } catch (error) {
    console.error('Verify Ticket Error:', error);
    return res.status(500).json({ message: 'Server error verifying ticket' });
  }
});

// @desc    Reopen complaint (Admin only)
// @route   PUT /api/complaints/:id/reopen
router.put('/:id/reopen', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reopen tickets.' });
    }

    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = 'In Progress';
    complaint.workStatus = 'In Progress';
    complaint.timeline.push({
      status: 'In Progress',
      date: new Date(),
      message: `Ticket Reopened by Admin: ${req.user.name || req.user.email}. Reverted to In Progress.`
    });

    await complaint.save();
    return res.json(complaint);
  } catch (error) {
    console.error('Reopen Ticket Error:', error);
    return res.status(500).json({ message: 'Server error reopening ticket' });
  }
});

export default router;
