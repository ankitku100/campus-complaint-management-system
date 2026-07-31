import React from 'react';
import { FiCheckCircle, FiTool, FiFlag, FiUserCheck } from 'react-icons/fi';
import { formatLocalDate } from '../utils/dateFormatter';

export const Timeline = ({ timeline = [], currentStatus = 'Pending', complaint = {} }) => {
  const steps = [
    { label: 'Submitted', key: 'Submitted', icon: FiCheckCircle, timestampKey: 'submittedAt' },
    { label: 'Assigned', key: 'Assigned', icon: FiUserCheck, timestampKey: 'assignedAt' },
    { label: 'In Progress', key: 'In Progress', icon: FiTool, timestampKey: 'startedAt' },
    { label: 'Resolved', key: 'Resolved', icon: FiFlag, timestampKey: 'resolvedAt' },
    { label: 'Closed', key: 'Closed', icon: FiCheckCircle, timestampKey: 'closedAt' },
  ];

  const statusToIndex = (status) => {
    const normalized = status?.toUpperCase() || 'SUBMITTED';
    if (['PENDING', 'WAITING FOR STAFF', 'SUBMITTED', 'ESCALATED'].includes(normalized)) return 0;
    if (normalized === 'ASSIGNED') return 1;
    if (normalized === 'IN PROGRESS') return 2;
    if (['COMPLETED', 'VERIFIED', 'RESOLVED'].includes(normalized)) return 3;
    if (normalized === 'CLOSED') return 4;
    return 0;
  };

  const currentIdx = statusToIndex(currentStatus);

  const getStepStatus = (stepKey) => {
    const stepIdx = steps.findIndex(s => s.key === stepKey);
    if (stepIdx <= currentIdx) return 'completed';
    return 'upcoming';
  };

  const defaultMessages = {
    'Submitted': 'Complaint registered and submitted.',
    'Assigned': 'Staff assigned to resolve the complaint.',
    'In Progress': 'Maintenance work is currently in progress.',
    'Resolved': 'Complaint resolved and awaiting verification.',
    'Closed': 'Complaint has been successfully closed.'
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Resolution Timeline</h3>
      
      <div className="relative pl-6 border-l border-slate-800 space-y-8 ml-3">
        {steps.map((step) => {
          const status = getStepStatus(step.key);
          const Icon = status === 'completed' ? FiCheckCircle : step.icon;
          
          // Find if there is actual historical data for this step in the timeline
          const historyItem = timeline.find(h => {
            const hStatus = h.status;
            if (step.key === 'Submitted' && (hStatus === 'Submitted' || hStatus === 'Pending')) return true;
            if (step.key === 'Assigned' && hStatus === 'Assigned') return true;
            if (step.key === 'In Progress' && hStatus === 'In Progress') return true;
            if (step.key === 'Resolved' && (hStatus === 'Completed' || hStatus === 'Verified' || hStatus === 'Resolved')) return true;
            if (step.key === 'Closed' && hStatus === 'Closed') return true;
            return false;
          });

          const displayMessage = historyItem ? historyItem.message : defaultMessages[step.key];
          
          // Use specific database timestamp, or fallback to history date
          const rawDate = complaint[step.timestampKey] || (historyItem ? historyItem.date : null);
          const displayDate = rawDate ? formatLocalDate(rawDate) : null;

          return (
            <div key={step.key} className="relative group">
              {/* Dot Icon Indicator */}
              <div className={`
                absolute -left-[37px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300
                ${status === 'completed' ? 'bg-[#B6FF5C]/10 text-[#B6FF5C] border border-[#B6FF5C]/50 shadow-[0_0_10px_rgba(182,255,92,0.15)] animate-in fade-in zoom-in duration-300' : ''}
                ${status === 'upcoming' ? 'bg-slate-900 text-slate-600 border border-slate-800' : ''}
              `}>
                <Icon className="text-sm" />
              </div>

              {/* Text Area */}
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className={`text-sm font-bold transition-colors ${status === 'completed' ? 'text-white' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                  {status === 'completed' && displayDate && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {displayDate}
                    </span>
                  )}
                </div>
                
                {status === 'completed' ? (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {displayMessage}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600">
                    Awaiting this stage
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
