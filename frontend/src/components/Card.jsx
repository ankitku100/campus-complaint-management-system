import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  variant = 'dark', // 'dark' | 'light' | 'neon-border'
  className = '',
  onClick,
  hoverable = false,
  padding = 'p-6',
}) => {
  const baseStyles = 'rounded-card transition-smooth overflow-hidden';
  
  const variants = {
    dark: 'bg-[#111827] text-white border border-slate-800/80 shadow-premium',
    light: 'bg-white text-slate-900 border border-slate-100 shadow-sm',
    'neon-border': 'bg-[#111827] text-white border border-neon/30 hover:border-neon shadow-premium',
  };

  const isClickable = !!onClick || hoverable;

  return (
    <motion.div
      onClick={onClick}
      whileHover={isClickable ? { y: -4, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' } : {}}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${padding} 
        ${isClickable ? 'cursor-pointer hover:shadow-glow' : ''} 
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};
