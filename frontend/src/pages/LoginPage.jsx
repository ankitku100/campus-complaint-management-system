import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/FormControls';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { BrandMark } from '../components/BrandMark';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await login(email.trim(), password);
    setLoading(false);
    
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#0B0F19] relative py-12 text-left">
      {/* Background glow decorator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon/5 rounded-full blur-[80px] pointer-events-none" />

      <Card variant="dark" className="w-full max-w-md p-8 relative z-10 border border-slate-800">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandMark compact showName />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Portal Login</h2>
          <p className="text-slate-400 text-xs mt-1.5">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={FiMail}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={FiLock}
            required
          />

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Secure role-based access</span>
            <Link
              to="/forgot-password"
              className="text-neon hover:underline font-bold"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="neon"
            className="w-full py-3"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-xs">
          <span className="text-slate-400">Don't have an account? </span>
          <Link to="/register" className="text-neon hover:underline font-bold">
            Create Account
          </Link>
        </div>

      </Card>
    </div>
  );
};
