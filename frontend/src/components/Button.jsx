import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'neon', // 'neon' | 'dark' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  icon: Icon,
  loading = false,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    neon: 'bg-neon text-slate-900 border border-transparent hover:bg-neon-dark shadow-[0_0_10px_rgba(182,255,92,0.15)] hover:shadow-glow',
    dark: 'bg-slate-900 text-white border border-slate-800 hover:border-neon hover:text-neon shadow-premium',
    outline: 'bg-transparent text-slate-800 border border-slate-300 hover:border-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:border-neon dark:hover:text-neon dark:hover:bg-slate-900',
    danger: 'bg-red-500 text-white border border-transparent hover:bg-red-600 focus:ring-red-400',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <motion.button
      whileTap={disabled || loading ? {} : { scale: 0.96 }}
      whileHover={disabled || loading ? {} : { y: -1 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <Icon className="-ml-0.5 mr-2 text-lg" />
      ) : null}
      {children}
    </motion.button>
  );
};
