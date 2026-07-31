const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { serializeUser } = require('../utils/serializers');
const { sendWelcomeEmail, sendPasswordResetOTPEmail } = require('../services/emailService');

const signToken = (user) => jwt.sign(
  { id: user._id.toString() },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const register = async (req, res) => {
  const { name, email, password, role = 'USER', mobile = '', category = '' } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role.toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return res.status(403).json({ message: 'Admin account cannot be created.' });
  }
  if (!['USER', 'STAFF'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'Role must be USER or STAFF.' });
  }
  if (normalizedRole === 'STAFF' && !category) {
    return res.status(400).json({ message: 'Specialization Category is required for staff.' });
  }
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    mobile,
    role: normalizedRole,
    category: normalizedRole === 'STAFF' ? category : undefined,
    isVerified: normalizedRole === 'USER'
  });

  sendWelcomeEmail(user.email, user.name, user.role);

  const response = {
    message: normalizedRole === 'STAFF'
      ? 'Registration successful. Your account is awaiting admin approval.'
      : 'Registration successful.',
    user: serializeUser(user)
  };
  if (normalizedRole === 'USER') response.token = signToken(user);
  res.status(201).json(response);
};

const login = async (req, res) => {
  const emailInput = req.body.email || '';
  const passwordInput = req.body.password || '';
  const requestRole = req.body.role || '';

  const normalizedEmail = emailInput.trim().toLowerCase();
  console.log('[Login Debug] Starting authentication flow for:', normalizedEmail);

  // User Lookup
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    console.log('[Login Debug]', {
      Email: normalizedEmail,
      DatabaseRole: 'None',
      ValidationResult: 'FAILED - EMAIL NOT FOUND'
    });
    return res.status(401).json({ message: 'No account found with this email.' });
  }

  // Password Verification
  const isMatch = await bcrypt.compare(passwordInput, user.password);
  if (!isMatch) {
    console.log('[Login Debug]', {
      Email: user.email,
      DatabaseRole: user.role,
      ValidationResult: 'FAILED - INCORRECT PASSWORD'
    });
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  // Role Validation (Portal Match)
  if (requestRole) {
    const lowerRole = requestRole.trim().toLowerCase();
    let mappedRole = requestRole.toUpperCase();
    if (lowerRole === 'student' || lowerRole === 'user') {
      mappedRole = 'USER';
    } else if (lowerRole === 'staff') {
      mappedRole = 'STAFF';
    } else if (lowerRole === 'admin') {
      mappedRole = 'ADMIN';
    }

    if (user.role !== mappedRole) {
      console.log('[Login Debug]', {
        Email: user.email,
        DatabaseRole: user.role,
        RequestRole: requestRole,
        MappedRole: mappedRole,
        ValidationResult: 'FAILED - WRONG PORTAL'
      });
      return res.status(401).json({ message: 'This account belongs to another portal.' });
    }
  }

  // Verification check for STAFF role
  if (user.role === 'STAFF' && !user.isVerified) {
    console.log('[Login Debug]', {
      Email: user.email,
      DatabaseRole: user.role,
      ValidationResult: 'FAILED - STAFF NOT VERIFIED'
    });
    return res.status(403).json({ message: 'Your account is awaiting admin approval.' });
  }

  user.lastLogin = new Date();
  await user.save();

  res.json({ token: signToken(user), user: serializeUser(user) });
};

const { uploadImage } = require('../utils/uploadService');

const me = async (req, res) => res.json({ user: serializeUser(req.user) });

const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }
    const imageUrl = await uploadImage(req.file.buffer, req.file.mimetype);
    req.user.profilePicture = imageUrl;
    await req.user.save();
    res.json({
      message: 'Profile picture updated successfully.',
      user: serializeUser(req.user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Profile picture update failed.' });
  }
};

const removeProfilePicture = async (req, res) => {
  try {
    req.user.profilePicture = '';
    await req.user.save();
    res.json({
      message: 'Profile picture removed successfully.',
      user: serializeUser(req.user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Profile picture deletion failed.' });
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (user.otpLastSentAt && Date.now() - new Date(user.otpLastSentAt).getTime() < 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 1 minute before requesting another OTP.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    user.otpLastSentAt = new Date();

    await user.save();
    await sendPasswordResetOTPEmail(user.email, user.name, otp, 10);

    return res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      otp
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP Expired'
      });
    }

    return res.json({
      success: true,
      message: 'OTP Verified'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      otp
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP Expired'
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpLastSentAt = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
};

const updateProfile = async (req, res) => {
  const { name, mobile, department, year, registrationNumber } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name) user.name = name;
    if (mobile !== undefined) user.mobile = mobile ? mobile.replace(/\D/g, '') : '';
    if (user.role === 'USER') {
      if (department !== undefined) user.department = department;
      if (year !== undefined) user.year = year;
      if (registrationNumber !== undefined) user.registrationNumber = registrationNumber;
    }

    await user.save();
    res.json({ user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update profile.' });
  }
};

module.exports = {
  register,
  login,
  me,
  updateProfilePicture,
  removeProfilePicture,
  sendOTP,
  verifyOTP,
  resetPassword,
  updateProfile
};
