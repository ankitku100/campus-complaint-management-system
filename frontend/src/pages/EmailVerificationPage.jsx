import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FiMail, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { verifyEmailRequest, resendVerificationOtpRequest } from '../services/authService';
import { BrandMark } from '../components/BrandMark';

export const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialEmail = location.state?.email || sessionStorage.getItem('pending_verification_email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    if (initialEmail) {
      sessionStorage.setItem('pending_verification_email', initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    // Only numeric inputs allowed
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newValues = [...otpValues];
      newValues[index] = '';
      setOtpValues(newValues);
      return;
    }

    const newValues = [...otpValues];
    newValues[index] = cleanValue.slice(-1); // Take only the last digit entered
    setOtpValues(newValues);

    // Auto-focus next input
    if (index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = '';
        setOtpValues(newValues);
        inputRefs[index - 1].current?.focus();
      } else {
        const newValues = [...otpValues];
        newValues[index] = '';
        setOtpValues(newValues);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length >= 6) {
      const chars = pastedData.slice(0, 6).split('');
      setOtpValues(chars);
      inputRefs[5].current?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setError('');
    setSuccess('');
    try {
      await resendVerificationOtpRequest(email);
      setSuccess('A new 6-digit verification code has been sent to your email.');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please start from the register page again.');
      return;
    }
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await verifyEmailRequest(email, fullOtp);
      setSuccess(data.message || 'Email verified successfully!');
      sessionStorage.removeItem('pending_verification_email');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
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
          <h2 className="text-2xl font-extrabold text-white">Verify Your Email</h2>
          <p className="text-slate-400 text-xs mt-2">
            Enter the 6-digit verification code sent to
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <FiMail className="text-neon text-xs" />
            <span className="text-white font-semibold text-xs">{email || 'your email'}</span>
          </div>
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

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 text-center">
              Verification Code
            </label>
            <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading}
                  className="w-12 h-14 text-center text-xl font-bold bg-[#111827] border border-slate-800 text-white rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none transition-all"
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="neon"
            className="w-full py-3"
            loading={loading}
            disabled={otpValues.join('').length !== 6 || loading}
          >
            Verify Email
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          {countdown > 0 ? (
            <p className="text-slate-400 text-xs">
              Resend OTP in <span className="text-neon font-bold">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-neon hover:underline font-bold text-xs"
            >
              Resend OTP
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
