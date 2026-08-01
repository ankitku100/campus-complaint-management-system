const roleToClient = { USER: 'STUDENT', STAFF: 'STAFF', ADMIN: 'ADMIN' };

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  mobile: user.mobile || '',
  role: roleToClient[user.role] || user.role || 'STUDENT',
  apiRole: user.role,
  isVerified: user.isVerified,
  isEmailVerified: user.isEmailVerified || false,
  avatar: user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
  profilePicture: user.profilePicture || '',
  category: user.category || '',
  specialty: user.category || '',
  details: user.role === 'STAFF' ? 'Maintenance staff member' : user.role === 'ADMIN' ? 'System administrator' : 'Registered user',
  currentWorkloadScore: user.currentWorkloadScore || 0,
  isDisabled: user.isDisabled || false,
  department: user.department || '',
  year: user.year || '',
  registrationNumber: user.registrationNumber || '',
  lastLogin: user.lastLogin || null,
  createdAt: user.createdAt || null
});

const serializeComplaint = (complaint) => {
  const owner = complaint.createdBy;
  const staff = complaint.assignedStaff;
  return {
    id: complaint.id, // We map the sequential ticket ID (CMP-...) to the frontend's expected complaint.id
    dbId: complaint._id.toString(), // Mongoose ObjectId
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    location: complaint.location,
    submittedBy: owner?.email || '',
    submittedByName: owner?.name || '',
    submittedDate: complaint.createdAt,
    assignedTo: staff?.email || '',
    assignedToName: staff?.name || '',
    assignedToCategory: staff?.category || '',

    images: complaint.imageUrl ? [complaint.imageUrl] : [],
    resolutionImage: complaint.resolutionImage || '',
    resolutionRemarks: complaint.resolutionRemarks || '',
    remarks: complaint.remarks || [],
    timeline: complaint.timeline || [],
    chat: (complaint.chat || []).map((message) => ({
      id: message._id.toString(),
      sender: message.sender?.email || message.sender?.toString() || '',
      senderName: message.senderName,
      role: roleToClient[message.role],
      message: message.message,
      timestamp: message.timestamp
    })),
    
    // Work Completion fields
    completedBy: complaint.completedBy?.name || (typeof complaint.completedBy === 'string' ? complaint.completedBy : (complaint.completedBy?.toString() || '')),
    completedAt: complaint.completedAt || null,
    completionNotes: complaint.completionNotes || '',
    completionImages: complaint.completionImages || [],
    resolutionProofImages: complaint.resolutionProofImages || [],
    workStatus: complaint.workStatus || complaint.status,
    rating: complaint.rating !== undefined ? complaint.rating : null,
    feedback: complaint.feedback || '',
    ratedAt: complaint.ratedAt || null,
    isEscalated: complaint.isEscalated || false,
    escalatedAt: complaint.escalatedAt || null,
    escalationHistory: (complaint.escalationHistory || []).map(h => ({
      escalatedAt: h.escalatedAt,
      reason: h.reason,
      previousStatus: h.previousStatus
    })),
    autoAssigned: complaint.autoAssigned !== undefined ? complaint.autoAssigned : true,
    assignmentMethod: complaint.assignmentMethod || 'AUTO',
    assignedAt: complaint.assignedAt || null,
    submittedAt: complaint.submittedAt || complaint.createdAt || null,
    startedAt: complaint.startedAt || null,
    resolvedAt: complaint.resolvedAt || complaint.completedAt || null,
    closedAt: complaint.closedAt || null
  };
};

module.exports = { serializeUser, serializeComplaint };
