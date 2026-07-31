import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Input } from '../components/FormControls';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { resetPasswordRequest } from '../services/authService';
import { BrandMark } from '../components/BrandMark';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const email = location.state?.email || sessionStorage.getItem('reset_password_email') || '';
  const otp = location.state?.otp || sessionStorage.getItem('reset_password_otp') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      setError('Please verify the OTP first.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setError('Password must contain at least one letter, one number, and one special character.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPasswordRequest(email, otp, password);
      sessionStorage.removeItem('reset_password_email');
      sessionStorage.removeItem('reset_password_otp');
      setSuccess('Password reset successfully.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#0B0F19] relative py-12 text-left">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon/5 rounded-full blur-[80px] pointer-events-none" />

      <Card variant="dark" className="w-full max-w-md p-8 relative z-10 border border-slate-800">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandMark compact showName />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Reset Password</h2>
          <p className="text-slate-400 text-xs mt-1.5">Choose a new password for {email || 'your account'}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-neon/10 border border-neon/25 text-neon text-xs font-semibold px-4 py-3 rounded-xl mb-6 flex items-center gap-2 shadow-glow">
            <FiCheckCircle className="text-lg flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New Password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={FiLock}
            required
            disabled={loading || !!success}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={FiLock}
            required
            disabled={loading || !!success}
          />

          <Button
            type="submit"
            variant="neon"
            className="w-full py-3"
            loading={loading}
            disabled={!!success}
          >
            Update Password
          </Button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link to="/login" className="text-neon hover:underline font-bold">
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};
