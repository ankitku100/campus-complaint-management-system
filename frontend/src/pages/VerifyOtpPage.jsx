import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Input } from '../components/FormControls';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { verifyOtpRequest } from '../services/authService';
import { BrandMark } from '../components/BrandMark';

export const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const email = location.state?.email || sessionStorage.getItem('reset_password_email') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please start from the Forgot Password page again.');
      return;
    }
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyOtpRequest(email, otp);
      sessionStorage.setItem('reset_password_otp', otp);
      setSuccess('OTP verified successfully.');
      navigate('/reset-password', { state: { email, otp } });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
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
          <h2 className="text-2xl font-extrabold text-white">Verify OTP</h2>
          <p className="text-slate-400 text-xs mt-1.5">Enter the 6-digit code sent to {email || 'your email'}</p>
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
            label="6 Digit OTP"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            icon={FiLock}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="neon"
            className="w-full py-3"
            loading={loading}
          >
            Verify OTP
          </Button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link to="/forgot-password" className="text-neon hover:underline font-bold">
            Resend OTP
          </Link>
        </div>
      </Card>
    </div>
  );
};
