const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { serializeUser } = require('../utils/serializers');
const { sendWelcomeEmail, sendPasswordResetOTPEmail, sendAccountVerificationEmail } = require('../services/emailService');

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

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }
    
    // Overwrite details of the existing unverified account to allow re-registration
    existingUser.name = name;
    existingUser.password = await bcrypt.hash(password, 12);
    existingUser.mobile = mobile;
    existingUser.role = normalizedRole;
    existingUser.category = normalizedRole === 'STAFF' ? category : undefined;
    existingUser.isVerified = false;
    existingUser.emailVerificationOTP = otp;
    existingUser.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    existingUser.otpLastSentAt = new Date();
    
    await existingUser.save();
    await sendAccountVerificationEmail(existingUser.email, existingUser.name, otp);
    
    return res.status(201).json({
      success: true,
      message: 'Registration updated. Please verify your email address.',
      email: existingUser.email,
      emailVerificationRequired: true
    });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    mobile,
    role: normalizedRole,
    category: normalizedRole === 'STAFF' ? category : undefined,
    isVerified: false,
    isEmailVerified: false,
    emailVerificationOTP: otp,
    emailVerificationOTPExpires: Date.now() + 10 * 60 * 1000,
    otpLastSentAt: new Date()
  });

  await sendAccountVerificationEmail(user.email, user.name, otp);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email address.',
    email: user.email,
    emailVerificationRequired: true
  });
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

  // Verification check for Student (USER) and Staff (STAFF) roles
  if (user.role === 'USER') {
    if (!user.isEmailVerified) {
      console.log('[Login Debug]', {
        Email: user.email,
        DatabaseRole: user.role,
        ValidationResult: 'FAILED - USER EMAIL NOT VERIFIED'
      });
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.', 
        emailVerificationRequired: true,
        email: user.email
      });
    }
  }

  if (user.role === 'STAFF') {
    if (!user.isEmailVerified || !user.isVerified) {
      console.log('[Login Debug]', {
        Email: user.email,
        DatabaseRole: user.role,
        ValidationResult: !user.isEmailVerified ? 'FAILED - STAFF EMAIL NOT VERIFIED' : 'FAILED - STAFF NOT APPROVED BY ADMIN'
      });
      return res.status(403).json({ 
        message: 'Please verify your email and wait for administrator approval.', 
        emailVerificationRequired: !user.isEmailVerified,
        email: user.email
      });
    }
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

const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    user.otpLastSentAt = new Date();
    await user.save();
    
    await sendAccountVerificationEmail(user.email, user.name, otp);
    res.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send verification code.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }
    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }
    if (user.emailVerificationOTPExpires && new Date() > new Date(user.emailVerificationOTPExpires)) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }
    
    // Success
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationOTP = '';
    user.emailVerificationOTPExpires = null;
    
    if (user.role === 'USER') {
      user.isVerified = true; // Auto-activate student
    } else {
      user.isVerified = false; // Staff awaits admin approval
    }
    
    await user.save();
    
    // Send standard welcome email after verification is successful
    sendWelcomeEmail(user.email, user.name, user.role);

    res.json({
      success: true,
      message: user.role === 'STAFF'
        ? 'Email verified successfully. Your account is now awaiting administrator approval.'
        : 'Email verified successfully. You can now log in.',
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Verification failed.' });
  }
};

const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }
    
    if (user.otpLastSentAt && Date.now() - new Date(user.otpLastSentAt).getTime() < 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another verification code.'
      });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    user.otpLastSentAt = new Date();
    await user.save();
    
    await sendAccountVerificationEmail(user.email, user.name, otp);
    res.json({ success: true, message: 'Verification code resent successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to resend verification code.' });
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
  updateProfile,
  sendVerificationOTP,
  verifyEmail,
  resendVerificationOTP
};
