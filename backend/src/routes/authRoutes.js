const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const multer = require('multer');
const { 
  register, 
  login, 
  me, 
  updateProfilePicture, 
  removeProfilePicture,
  sendOTP,
  verifyOTP,
  resetPassword,
  updateProfile
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/errorHandler');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, file.mimetype.startsWith('image/'))
});

router.post('/register', authLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email').trim().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('A valid email is required.'),
  body('password')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters.')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character.'),
  body('role').optional().isIn(['USER', 'STAFF', 'user', 'staff', 'ADMIN', 'admin']).withMessage('Invalid role.')
], validateRequest, register);
router.post('/login', authLimiter, [
  body('email').trim().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('A valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.')
], validateRequest, login);
router.get('/me', authenticateToken, me);
router.put('/profile-picture', authenticateToken, upload.single('image'), updateProfilePicture);
router.delete('/profile-picture', authenticateToken, removeProfilePicture);
router.put('/profile', authenticateToken, updateProfile);

router.post('/send-otp', authLimiter, [
  body('email').trim().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('A valid email is required.')
], validateRequest, sendOTP);

router.post('/verify-otp', authLimiter, [
  body('email').trim().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('A valid email is required.'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
], validateRequest, verifyOTP);

router.post('/reset-password', authLimiter, [
  body('email').trim().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('A valid email is required.'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  body('password')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters.')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character.')
], validateRequest, resetPassword);

module.exports = router;
