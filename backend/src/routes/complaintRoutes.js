const router = require('express').Router();
const multer = require('multer');
const { body, param } = require('express-validator');
const { 
  createComplaint, 
  myComplaints, 
  complaintDetails, 
  addMessage, 
  rateComplaint, 
  getStudentStats,
  deleteComplaint
} = require('../controllers/complaintController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/errorHandler');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, file.mimetype.startsWith('image/'))
});

router.use(authenticateToken);
router.post('/', authorizeRoles('USER'), upload.single('image'), [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Complaint Title must be between 3 and 200 characters long'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Detailed Description must be between 10 and 5000 characters long'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Priority Level must be one of Low, Medium, High, or Critical'),
  body('location').trim().isLength({ min: 2, max: 300 }).withMessage('Specific Location must be between 2 and 300 characters long')
], validateRequest, createComplaint);
router.get('/my', authorizeRoles('USER'), myComplaints);
router.get('/stats', authorizeRoles('USER'), getStudentStats);
router.get('/:id', param('id').isMongoId().withMessage('Invalid complaint ID'), validateRequest, complaintDetails);
router.post('/:id/messages', [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('message').trim().isLength({ min: 1, max: 2000 })
], validateRequest, addMessage);
router.post(
  "/:id/rate",
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  authorizeRoles("USER"),
  validateRequest,
  rateComplaint
);

module.exports = router;
