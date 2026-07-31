const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, required: true, maxlength: 1000 },
  date: { type: Date, default: Date.now }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  role: { type: String, enum: ['USER', 'STAFF', 'ADMIN'], required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  timestamp: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  location: { type: String, required: true, trim: true, maxlength: 300 },
  imageUrl: { type: String, default: '' },
  resolutionImage: { type: String, default: '' },
  resolutionRemarks: { type: String, default: '', maxlength: 3000 },
  status: {
    type: String,
    enum: ['Pending', 'Waiting For Staff', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Closed', 'Escalated'],
    default: 'Pending'
  },
  workStatus: {
    type: String,
    enum: ['Pending', 'Waiting For Staff', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Closed', 'Escalated'],
    default: 'Pending'
  },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt: { type: Date, default: null },
  completionNotes: { type: String, default: '', maxlength: 5000 },
  completionImages: { type: [String], default: [] },
  resolutionProofImages: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  remarks: [{
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    createdAt: { type: Date, default: Date.now }
  }],
  timeline: { type: [timelineSchema], default: [] },
  chat: { type: [messageSchema], default: [] },
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: String, default: '', maxlength: 3000 },
  ratedAt: { type: Date, default: null },
  isEscalated: { type: Boolean, default: false },
  escalatedAt: { type: Date, default: null },
  escalationReason: { type: String, default: '' },
  escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  escalationHistory: [{
    escalatedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
    previousStatus: { type: String, default: '' }
  }],
  autoAssigned: {
    type: Boolean,
    default: true
  },
  assignmentMethod: {
    type: String,
    enum: ['AUTO', 'MANUAL'],
    default: 'AUTO'
  },
  assignedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

complaintSchema.index({ status: 1 });
complaintSchema.index({ isEscalated: 1 });
complaintSchema.index({ rating: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });

// Compound indexes
complaintSchema.index({ status: 1, category: 1, priority: 1, isEscalated: 1, createdAt: -1 });
complaintSchema.index({ assignedStaff: 1, status: 1 });
complaintSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
