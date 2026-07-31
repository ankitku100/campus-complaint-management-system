import React from 'react';

export const Badge = ({
  children,
  value = '',
  className = ''
}) => {
  const getColors = () => {
    const val = value.toLowerCase();

    // Priority badges
    if (val === 'low') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
    if (val === 'medium') return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
    if (val === 'high') return 'bg-orange-500/10 text-orange-400 border border-orange-500/25';
    if (val === 'critical') return 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse';

    // Status badges
    if (val === 'pending') return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    if (val === 'waiting for staff') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse';
    if (val === 'assigned') return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25';
    if (val === 'in progress') return 'bg-sky-500/10 text-sky-400 border border-sky-500/25';
    if (val === 'completed') return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25';
    if (val === 'closed' || val === 'verified' || val === 'resolved') return 'bg-[#B6FF5C]/10 text-[#B6FF5C] border border-[#B6FF5C]/30';
    if (val === 'escalated') return 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse';

    // Category / Generic fallback
    return 'bg-slate-700/40 text-slate-300 border border-slate-700/60';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getColors()} ${className}`}>
      {children || value}
    </span>
  );
};
