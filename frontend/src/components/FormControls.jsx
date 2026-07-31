import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            <Icon />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full bg-[#111827] border text-white rounded-xl py-3 px-4 text-sm transition-all focus:outline-none focus:ring-1
            ${Icon ? 'pl-11' : ''}
            ${error 
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-800 focus:border-neon focus:ring-neon'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-semibold text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

export const TextArea = React.forwardRef(({
  label,
  error,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full bg-[#111827] border text-white rounded-xl py-3 px-4 text-sm transition-all focus:outline-none focus:ring-1
          ${error 
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' 
            : 'border-slate-800 focus:border-neon focus:ring-neon'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs font-semibold text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

export const Select = React.forwardRef(({
  label,
  options = [],
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full bg-[#111827] border text-white rounded-xl py-3 px-4 text-sm transition-all focus:outline-none focus:ring-1 cursor-pointer
          ${error 
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' 
            : 'border-slate-800 focus:border-neon focus:ring-neon'
          }
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => {
          const isObject = typeof opt === 'object' && opt !== null;
          const labelVal = isObject ? opt.label : opt;
          const keyVal = isObject ? opt.value : opt;
          return (
            <option key={keyVal} value={keyVal} className="bg-slate-900">
              {labelVal}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-xs font-semibold text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
TextArea.displayName = 'TextArea';
Select.displayName = 'Select';
