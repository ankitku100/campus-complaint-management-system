import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { FiMenu, FiX, FiCheck, FiMail, FiMapPin, FiPhone, FiSun, FiMoon } from 'react-icons/fi';
import { BrandMark } from '../components/BrandMark';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_SUPPORT_EMAIL } from '../config/brand';

export const LandingLayout = ({ children }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for glass navbar background effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col font-sans">
      {/* Navbar Header */}
      <header className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled 
          ? isDark
            ? 'bg-slate-900/90 text-white backdrop-blur-md border-b border-slate-800 shadow-md py-4' 
            : 'bg-white/95 text-slate-900 backdrop-blur-md border-b border-slate-200 shadow-md py-4'
          : isDark ? 'bg-transparent text-white py-6' : 'bg-transparent text-slate-900 py-6'
        }
      `}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <BrandMark compact showTagline hideNameMobile />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-semibold transition-colors ${isDark ? 'text-slate-350 hover:text-neon' : 'text-slate-600 hover:text-slate-950'}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth Button */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all border border-transparent ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 hover:border-neon shadow-premium' : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-sm'}`}
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-neon text-slate-900 hover:bg-neon-dark px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all border border-transparent ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-650 hover:text-slate-950'}`}
            >
              {mobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-b px-6 py-6 space-y-4 absolute top-full left-0 right-0 shadow-lg animate-in slide-in-from-top duration-200 ${isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'}`}>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-base font-semibold transition-colors ${isDark ? 'text-slate-300 hover:text-neon' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-center px-5 py-3 rounded-xl text-sm font-semibold block transition-all ${isDark ? 'bg-slate-850 hover:bg-slate-800 text-white border border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'}`}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-neon hover:bg-neon-dark text-slate-900 px-5 py-3 rounded-xl text-sm font-semibold block transition-all"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero and Pages */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-white border-t border-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & Description */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <BrandMark compact showName />
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Empowering students, hostel residents, apartments, and employees to resolve complaints swiftly using smart routing and transparent pipelines.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#about" className="text-slate-400 hover:text-neon transition-colors">About Us</a></li>
              <li><a href="#features" className="text-slate-400 hover:text-neon transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-slate-400 hover:text-neon transition-colors">How It Works</a></li>
              <li><a href="#faq" className="text-slate-400 hover:text-neon transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <FiMail className="text-neon" />
                <span>{BRAND_SUPPORT_EMAIL}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <FiPhone className="text-neon" />
                <span>+1 (800) 555-0199</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <FiMapPin className="text-neon" />
                <span>100 Technology Way, Suite 400</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <p>© 2026 {BRAND_NAME}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
