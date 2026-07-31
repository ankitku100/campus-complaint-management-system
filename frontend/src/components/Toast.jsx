import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';

export const Toast = ({
  message = '',
  type = 'success', // 'success' | 'error'
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border text-white rounded-xl shadow-2xl max-w-sm"
          style={{
            borderColor: type === 'success' ? '#B6FF5C' : '#EF4444'
          }}
        >
          {/* Icon indicator */}
          {type === 'success' ? (
            <FiCheckCircle className="text-neon text-xl flex-shrink-0" />
          ) : (
            <FiAlertTriangle className="text-red-550 text-xl flex-shrink-0" />
          )}

          {/* Text Message */}
          <span className="text-xs font-semibold leading-relaxed flex-grow">
            {message}
          </span>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
            title="Dismiss alert"
          >
            <FiX className="text-sm" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
