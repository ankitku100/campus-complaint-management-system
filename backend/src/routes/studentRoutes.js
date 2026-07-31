const router = require('express').Router();
const { getStudentProfileStats, getStudentComplaintDetails } = require('../controllers/complaintController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/profile/stats', authenticateToken, authorizeRoles('USER'), getStudentProfileStats);
router.get('/complaints/:id', authenticateToken, authorizeRoles('USER'), getStudentComplaintDetails);

module.exports = router;
