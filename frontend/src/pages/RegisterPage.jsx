import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Select } from '../components/FormControls';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FiUser, FiMail, FiPhone, FiLock, FiAlertCircle } from 'react-icons/fi';
import { getCategoriesRequest } from '../services/categoryService';
import { BrandMark } from '../components/BrandMark';

import { IndianPhoneInput } from '../components/IndianPhoneInput';
import { isValidIndianMobile, cleanMobileNumber } from '../utils/phoneFormatter';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategoriesRequest();
        setCategories(data);
        if (data.length > 0) {
          setCategory(data[0].name);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
        const defaults = ['Hostel', 'Academic', 'Infrastructure', 'IT Services', 'Security', 'Other'];
        setCategories(defaults.map((c, i) => ({ id: i.toString(), name: c })));
        setCategory(defaults[0]);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mobile && !isValidIndianMobile(mobile)) {
      setError('Please enter a valid Indian mobile number.');
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
    setLoading(true);

    const payload = { name, email: email.trim(), mobile: cleanMobileNumber(mobile), password, role };
    if (role === 'STAFF') {
      payload.category = category;
    }

    const res = await register(payload);
    setLoading(false);
    
    if (res.success && !res.awaitingApproval) {
      navigate('/dashboard');
    } else if (res.success) {
      navigate('/login');
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-[#0B0F19] relative py-12 text-left">
      {/* Background glow decorator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon/5 rounded-full blur-[80px] pointer-events-none" />

      <Card variant="dark" className="w-full max-w-md p-8 relative z-10 border border-slate-800">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandMark compact showName />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Create Account</h2>
          <p className="text-slate-400 text-xs mt-1.5">Register for CampusCare</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={FiUser}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={FiMail}
            required
          />

          <IndianPhoneInput
            label="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />

          <Select
            label="Account Type"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'USER', label: 'Student' },
              { value: 'STAFF', label: 'Staff (requires admin approval)' }
            ]}
          />

          {role === 'STAFF' && (
            <Select
              label="Specialization Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories.map(c => ({ value: c.name, label: c.name }))}
              required
            />
          )}

          <Input
            label="Password *"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={FiLock}
            required
          />

          <Input
            label="Confirm Password *"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={FiLock}
            required
          />

          <Button
            type="submit"
            variant="neon"
            className="w-full py-3 mt-2"
            loading={loading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-xs">
          <span className="text-slate-400">Already have an account? </span>
          <Link to="/login" className="text-neon hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};
