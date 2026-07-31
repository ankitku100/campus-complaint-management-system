import mongoose from 'mongoose';

const TimelineEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  message: { type: String, required: true }
});

const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true },
  senderName: { type: String, required: true },
  role: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ComplaintSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  priority: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Waiting For Staff', 'Assigned', 'In Progress', 'Completed', 'Verified'], 
    default: 'Pending' 
  },
  location: { 
    type: String, 
    required: true 
  },
  submittedBy: { 
    type: String, 
    required: true 
  },
  submittedByName: { 
    type: String, 
    required: true 
  },
  submittedDate: { 
    type: Date, 
    default: Date.now 
  },
  assignedTo: { 
    type: String, 
    default: '' 
  },
  assignedToName: { 
    type: String, 
    default: '' 
  },
  images: [{ 
    type: String 
  }],
  
  // Work Completion Fields
  completedBy: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date
  },
  completionNotes: {
    type: String,
    default: ''
  },
  completionImages: [{
    type: String
  }],
  resolutionProofImages: [{
    type: String
  }],
  workStatus: {
    type: String,
    enum: ['Pending', 'Waiting For Staff', 'Assigned', 'In Progress', 'Completed', 'Verified'],
    default: 'Pending'
  },
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
  
  // Backward compatibility
  resolutionRemarks: { 
    type: String, 
    default: '' 
  },
  resolutionImage: { 
    type: String, 
    default: '' 
  },

  timeline: [TimelineEventSchema],
  chat: [ChatMessageSchema]
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', ComplaintSchema);
export default Complaint;
