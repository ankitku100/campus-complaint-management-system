const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  mobile: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['USER', 'STAFF', 'ADMIN'], required: true },
  category: {
    type: String,
    enum: [
      "Hostel",
      "Academic",
      "Infrastructure",
      "IT Services",
      "Security",
      "Other"
    ],
    required: function() {
      return this.role === 'STAFF';
    },
    validate: {
      validator: function(value) {
        if (this.role !== 'STAFF') {
          return !value;
        }
        return true;
      },
      message: 'Only STAFF users should have this field.'
    }
  },
  isVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationOTP: { type: String, default: '' },
  emailVerificationOTPExpires: { type: Date },
  emailVerifiedAt: { type: Date },
  currentWorkloadScore: { type: Number, default: 0 },
  isDisabled: { type: Boolean, default: false },
  profilePicture: { type: String, default: '' },
  otp: { type: String },
  otpExpires: { type: Date },
  otpLastSentAt: { type: Date },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  registrationNumber: { type: String, default: '' },
  lastLogin: { type: Date }
}, { timestamps: true });

userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: 'ADMIN' }, name: 'single_admin_account' }
);

userSchema.index({ role: 1 });
userSchema.index({ category: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ role: 1, isVerified: 1 });

module.exports = mongoose.model('User', userSchema);
