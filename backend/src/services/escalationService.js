const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendEscalationAdminEmail } = require('./emailService');

/**
 * Checks all unresolved complaints and escalates them if they exceed the SLA thresholds.
 * SLA Rules:
 * - Status 'Pending': Escalated if age > 3 days (72 hours)
 * - Status 'Assigned' or 'In Progress': Escalated if age > 5 days (120 hours)
 * 
 * @returns {Promise<Array>} List of newly escalated complaints
 */
const checkAndEscalateComplaints = async () => {
  try {
    const admin = await User.findOne({ role: 'ADMIN' });
    const adminEmail = admin ? admin.email : 'campuscare.service@gmail.com'; // Fallback if no admin seeded yet

    // Get unresolved, non-escalated complaints
    const complaints = await Complaint.find({
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
      isEscalated: { $ne: true }
    });

    const now = new Date();
    const escalatedList = [];

    for (const complaint of complaints) {
      const ageInMs = now - new Date(complaint.createdAt);
      const ageInHours = ageInMs / (1000 * 60 * 60);

      let shouldEscalate = false;
      let reason = '';

      if (complaint.status === 'Pending' && ageInHours > 72) {
        shouldEscalate = true;
        reason = `Complaint remained in Pending status for more than 3 days (${Math.floor(ageInHours / 24)} days).`;
      } else if ((complaint.status === 'Assigned' || complaint.status === 'In Progress') && ageInHours > 120) {
        shouldEscalate = true;
        reason = `Complaint remained unresolved in ${complaint.status} status for more than 5 days (${Math.floor(ageInHours / 24)} days).`;
      }

      if (shouldEscalate) {
        complaint.isEscalated = true;
        complaint.escalatedAt = now;
        complaint.escalationHistory.push({
          escalatedAt: now,
          reason,
          previousStatus: complaint.status
        });

        // Add timeline record
        complaint.timeline.push({
          status: 'Escalated',
          message: `SLA Breached: Escalated to Admin. ${reason}`,
          date: now
        });

        await complaint.save();

        // Send notification email
        // We do this asynchronously without blocking the loop
        sendEscalationAdminEmail(adminEmail, complaint).catch(err => {
          console.error(`Error sending escalation email for complaint ${complaint.id}:`, err);
        });

        escalatedList.push(complaint);
      }
    }

    if (escalatedList.length > 0) {
      console.log(`[Escalation Monitor] Escalated ${escalatedList.length} complaints to Admin.`);
    }

    return escalatedList;
  } catch (error) {
    console.error('Error running escalation check:', error);
    throw error;
  }
};

/**
 * Initializes the background escalation monitor.
 * Runs check immediately and then every hour.
 */
const initEscalationMonitor = () => {
  console.log('[Escalation Monitor] Initializing background SLA monitor (Interval: 1 hour)...');
  
  // Run immediate scan on boot
  checkAndEscalateComplaints().catch(err => {
    console.error('Initial escalation check failed:', err);
  });

  // Run every 1 hour (3600000 ms)
  setInterval(() => {
    console.log('[Escalation Monitor] Running scheduled SLA check...');
    checkAndEscalateComplaints().catch(err => {
      console.error('Scheduled escalation check failed:', err);
    });
  }, 3600000);
};

module.exports = {
  checkAndEscalateComplaints,
  initEscalationMonitor
};
