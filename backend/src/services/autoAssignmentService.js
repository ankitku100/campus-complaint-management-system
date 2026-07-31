const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { 
  sendAutoAssignmentStudentEmail, 
  sendAutoAssignmentStaffEmail, 
  sendNoStaffAvailableAdminEmail 
} = require('./emailService');

/**
 * Recalculates and updates the workload score for a single staff member in the database.
 * Priority Weights: Low = 1, Medium = 2, High = 3, Critical = 5.
 * Active statuses: Assigned, In Progress.
 * @param {string|mongoose.Types.ObjectId} staffId 
 * @returns {Promise<number>} The new workload score
 */
const updateStaffWorkload = async (staffId) => {
  if (!staffId) return 0;
  try {
    const workloadAgg = await Complaint.aggregate([
      {
        $match: {
          assignedStaff: new mongoose.Types.ObjectId(staffId),
          status: { $in: ['Assigned', 'In Progress'] }
        }
      },
      {
        $group: {
          _id: null,
          score: {
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
    const score = workloadAgg.length > 0 ? workloadAgg[0].score : 0;
    await User.findByIdAndUpdate(staffId, { currentWorkloadScore: score });
    console.log(`[Workload Monitor] Updated workload for Staff ${staffId}. Score: ${score}`);
    return score;
  } catch (err) {
    console.error(`[Workload Monitor] Failed to update workload for Staff ${staffId}:`, err);
    return 0;
  }
};

/**
 * Runs the auto-allocation engine to find the most suitable staff member for a complaint.
 * If no verified staff is found in that category, sets status to 'Waiting For Staff' and notifies Admin.
 * @param {string|mongoose.Types.ObjectId} complaintId 
 */
const autoAssignComplaint = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      console.error(`[Auto Assign] Complaint ${complaintId} not found.`);
      return;
    }

    const category = complaint.category;
    console.log(`[Auto Assign] Commencing auto-assignment for Complaint ${complaint.id} (${complaint._id}), Category: ${category}`);

    // Query all verified staff in the category who are not disabled
    const staffList = await User.aggregate([
      {
        $match: {
          role: 'STAFF',
          isVerified: true,
          category: category,
          isDisabled: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'complaints',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedStaff', '$$staffId'] },
                status: { $in: ['Assigned', 'In Progress'] }
              }
            }
          ],
          as: 'activeComplaints'
        }
      },
      {
        $lookup: {
          from: 'complaints',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedStaff', '$$staffId'] }
              }
            },
            { $sort: { assignedAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastComplaint'
        }
      },
      {
        $addFields: {
          workloadScore: {
            $sum: {
              $map: {
                input: '$activeComplaints',
                as: 'c',
                in: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$$c.priority', 'Low'] }, then: 1 },
                      { case: { $eq: ['$$c.priority', 'Medium'] }, then: 2 },
                      { case: { $eq: ['$$c.priority', 'High'] }, then: 3 },
                      { case: { $eq: ['$$c.priority', 'Critical'] }, then: 5 }
                    ],
                    default: 0
                  }
                }
              }
            }
          },
          lastAssignedAt: {
            $ifNull: [
              { $arrayElemAt: ['$lastComplaint.assignedAt', 0] },
              new Date(0)
            ]
          }
        }
      },
      {
        $sort: {
          workloadScore: 1,
          lastAssignedAt: 1
        }
      }
    ]);

    if (staffList.length === 0) {
      console.log(`[Auto Assign] No verified active staff found for category "${category}". Status -> Waiting For Staff.`);
      complaint.status = 'Waiting For Staff';
      complaint.workStatus = 'Waiting For Staff';
      complaint.autoAssigned = true;
      complaint.assignmentMethod = 'AUTO';
      complaint.timeline.push({
        status: 'Waiting For Staff',
        message: `No verified staff available in category "${category}". Awaiting administrator assignment.`
      });
      await complaint.save();

      // Notify Admin
      const admin = await User.findOne({ role: 'ADMIN' });
      const adminEmail = admin ? admin.email : 'campuscare.service@gmail.com';
      sendNoStaffAvailableAdminEmail(adminEmail, complaint).catch(err => {
        console.error('[Auto Assign] Failed to send admin alert email:', err);
      });
      return;
    }

    // Assign to the selected staff member (first in sorted list)
    const selectedStaff = staffList[0];
    console.log(`[Auto Assign] Selected Staff member ${selectedStaff.name} with score ${selectedStaff.workloadScore}`);

    complaint.assignedStaff = selectedStaff._id;
    complaint.status = 'Assigned';
    complaint.workStatus = 'Assigned';
    complaint.autoAssigned = true;
    complaint.assignmentMethod = 'AUTO';
    complaint.assignedAt = new Date();
    complaint.timeline.push({
      status: 'Assigned',
      message: `System auto-allocated ticket to staff: ${selectedStaff.name}`
    });

    await complaint.save();

    // Update staff workload in DB
    await updateStaffWorkload(selectedStaff._id);

    // Populate createdBy and assignedStaff on complaint so email functions get populated fields
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name email')
      .populate('assignedStaff', 'name email category');

    // Notify Student
    if (populatedComplaint.createdBy && populatedComplaint.createdBy.email) {
      sendAutoAssignmentStudentEmail(
        populatedComplaint.createdBy.email,
        populatedComplaint.createdBy.name,
        populatedComplaint
      ).catch(err => {
        console.error('[Auto Assign] Failed to send student assignment email:', err);
      });
    }

    // Notify Staff
    if (populatedComplaint.assignedStaff && populatedComplaint.assignedStaff.email) {
      sendAutoAssignmentStaffEmail(
        populatedComplaint.assignedStaff.email,
        populatedComplaint.assignedStaff.name,
        populatedComplaint
      ).catch(err => {
        console.error('[Auto Assign] Failed to send staff assignment email:', err);
      });
    }
  } catch (error) {
    console.error('[Auto Assign] Exception during auto-assignment:', error);
  }
};

module.exports = {
  updateStaffWorkload,
  autoAssignComplaint
};
