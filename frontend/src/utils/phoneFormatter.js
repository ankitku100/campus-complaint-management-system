/**
 * Formats a mobile number string as: +91 XXXXX XXXXX
 */
export const formatIndianMobile = (mobile) => {
  if (!mobile) return '';
  // Strip non-digits
  const digits = mobile.replace(/\D/g, '');
  // If starts with 91 and has 12 digits, strip the leading 91
  let cleanDigits = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    cleanDigits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    cleanDigits = digits.slice(1);
  }
  
  // Format as +91 XXXXX XXXXX
  if (cleanDigits.length <= 5) {
    return cleanDigits ? `+91 ${cleanDigits}` : '';
  }
  return `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5, 10)}`;
};

/**
 * Strips all non-digits and leading country code 91 if present.
 * Returns only the 10-digit number.
 */
export const cleanMobileNumber = (mobile) => {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
};

/**
 * Validates if the input is a valid 10-digit Indian mobile number.
 * Valid Indian numbers start with 6, 7, 8, or 9 and contain exactly 10 digits.
 */
export const isValidIndianMobile = (mobile) => {
  const cleaned = cleanMobileNumber(mobile);
  return /^[6-9]\d{9}$/.test(cleaned);
};
