const router = require('express').Router();
const { body, param } = require('express-validator');
const {
  pendingStaff, verifiedStaff, approveStaff, deleteStaff, stats,
  allComplaints, assignStaff, updateComplaint, verifyComplaint, reopenComplaint,
  staffPerformance, checkEscalations, allStudents, getAdminProfileStats,
  adminAddUser, updateUser, toggleUserVerify, toggleUserStatus, resetUserPassword,
  deleteUser, getUserDetails
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/errorHandler');

router.use(authenticateToken, authorizeRoles('ADMIN'));
router.get('/pending-staff', pendingStaff);
router.get('/staff', verifiedStaff);
router.get('/students', allStudents);
router.patch('/approve-staff/:id', param('id').isMongoId(), validateRequest, approveStaff);
router.delete('/staff/:id', param('id').isMongoId(), validateRequest, deleteStaff);
router.get('/stats', stats);
router.get('/profile/stats', getAdminProfileStats);
router.get('/complaints', allComplaints);
router.get('/staff-performance', staffPerformance);
router.patch('/complaints/:id/assign', [
  param('id').isMongoId(),
  body('staffId').isMongoId().withMessage('A valid staff ID is required.')
], validateRequest, assignStaff);
router.patch('/complaints/:id', [
  param('id').isMongoId(),
  body('status').optional().isIn(['Pending', 'Assigned', 'In Progress', 'Completed', 'Verified']),
  body('remarks').optional().trim().isLength({ max: 3000 })
], validateRequest, updateComplaint);
router.put('/complaints/:id/verify', param('id').isMongoId(), validateRequest, verifyComplaint);
router.put('/complaints/:id/reopen', param('id').isMongoId(), validateRequest, reopenComplaint);
router.post('/escalations/check', checkEscalations);

// Admin User Management Endpoints
router.post('/users', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email').trim().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('A valid email is required.'),
  body('password')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters.')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character.'),
  body('role').isIn(['USER', 'STAFF', 'ADMIN']).withMessage('Invalid role.')
], validateRequest, adminAddUser);
router.patch('/users/:id', param('id').isMongoId(), validateRequest, updateUser);
router.patch('/users/:id/toggle-verify', param('id').isMongoId(), validateRequest, toggleUserVerify);
router.patch('/users/:id/toggle-status', param('id').isMongoId(), validateRequest, toggleUserStatus);
router.patch('/users/:id/reset-password', [
  param('id').isMongoId(),
  body('password')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters.')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character.')
], validateRequest, resetUserPassword);
router.delete('/users/:id', param('id').isMongoId(), validateRequest, deleteUser);
router.get('/users/:id/details', param('id').isMongoId(), validateRequest, getUserDetails);

module.exports = router;
