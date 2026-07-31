import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export const Modal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'md', // 'sm' | 'md' | 'lg'
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-none w-screen h-screen rounded-none border-none'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto ${size === 'full' ? 'p-0' : 'p-4'}`}>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={size === 'full' ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.95, y: 15 }}
            animate={size === 'full' ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={size === 'full' ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`
              relative bg-[#111827] border border-slate-800 text-white rounded-card shadow-premium overflow-hidden z-10 flex flex-col
              ${sizes[size] || sizes.md}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 flex-shrink-0">
              <h3 className="text-base font-bold text-white tracking-tight">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Close"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Content Body */}
            <div className={`px-6 py-6 overflow-y-auto flex-1 ${size === 'full' ? 'h-[calc(100vh-65px)] max-h-none' : 'max-h-[75vh]'}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
