const router = require('express').Router();
const multer = require('multer');
const { body, param } = require('express-validator');
const { assignedComplaints, updateComplaint, addRemark, completeComplaint, getPerformance, getStaffStats, getStaffProfileStats } = require('../controllers/staffController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/errorHandler');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, file.mimetype.startsWith('image/'))
});

router.use(authenticateToken, authorizeRoles('STAFF'));
router.get('/complaints', assignedComplaints);
router.get('/stats', getStaffStats);
router.get('/profile/stats', getStaffProfileStats);
router.get('/performance', getPerformance);
router.patch('/complaints/:id', [
  param('id').isMongoId(),
  body('status').isIn(['Assigned', 'In Progress', 'Resolved', 'Completed']),
  body('remarks').optional().trim().isLength({ max: 3000 }),
  body('resolutionImage').optional().isString()
], validateRequest, updateComplaint);
router.patch('/remarks/:id', [
  param('id').isMongoId(),
  body('message').trim().isLength({ min: 1, max: 3000 })
], validateRequest, addRemark);
router.put('/complaints/:id/complete', upload.array('images', 5), [
  param('id').isMongoId(),
  body('notes').trim().isLength({ min: 1, max: 5000 }).withMessage('Completion notes must be between 1 and 5000 characters.')
], validateRequest, completeComplaint);

module.exports = router;
