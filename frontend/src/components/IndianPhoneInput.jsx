import React from 'react';
import { Input } from './FormControls';
import { FiPhone } from 'react-icons/fi';

export const IndianPhoneInput = ({ value, onChange, label = 'Mobile Number', error, required = false, ...props }) => {
  const handleInputChange = (e) => {
    let rawVal = e.target.value || '';
    
    // If completely cleared or just prefix
    if (!rawVal.trim() || rawVal === '+91') {
      if (onChange) {
        onChange({
          target: {
            name: e.target.name,
            value: ''
          }
        });
      }
      return;
    }

    // Strip '+91' from the start to prevent digits extraction collision
    let typed = rawVal;
    if (typed.startsWith('+91')) {
      typed = typed.slice(3);
    }

    // Strip everything except digits from the user input
    let digits = typed.replace(/\D/g, '');
    
    // Handle cases where country code 91 or 0 is pasted/typed as prefix
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    
    // Limit to 10 digits max
    digits = digits.slice(0, 10);
    
    // Format: +91 XXXXX XXXXX
    let formatted = '';
    if (digits.length > 0) {
      formatted = '+91';
      if (digits.length <= 5) {
        formatted += ` ${digits}`;
      } else {
        formatted += ` ${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
      }
    }
    
    if (onChange) {
      onChange({
        target: {
          name: e.target.name,
          value: formatted
        }
      });
    }
  };

  const FlagIcon = () => (
    <span className="text-base select-none" style={{ filter: 'grayscale(0%)' }}>
      🇮🇳
    </span>
  );

  return (
    <Input
      label={label}
      type="tel"
      placeholder="+91 98765 43210"
      value={value}
      onChange={handleInputChange}
      error={error}
      required={required}
      icon={FlagIcon}
      {...props}
    />
  );
};
