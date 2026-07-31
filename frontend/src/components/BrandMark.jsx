import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand';

const FallbackIcon = ({ className = '', isDark = true }) => {
  const primaryColor = isDark ? '#B6FF5C' : '#4B8014';
  const bgColor = isDark ? '#111827' : '#F8FAFC';
  const accentColor = isDark ? '#DFFFC0' : '#A3E635';

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" role="img">
      <path
        d="M32 7.5L48.5 13.5C50.1 14.1 51.2 15.6 51.2 17.4V30.2C51.2 39.7 45.4 48.1 37 51.8L32 54.1L27 51.8C18.6 48.1 12.8 39.7 12.8 30.2V17.4C12.8 15.6 13.9 14.1 15.5 13.5L32 7.5Z"
        fill={bgColor}
        stroke={primaryColor}
        strokeWidth="1.6"
      />
      <path
        d="M22.8 31.2L29 37.4L42 24.8"
        fill="none"
        stroke={primaryColor}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.4 21.8H40.6"
        stroke={accentColor}
        strokeOpacity={isDark ? '0.7' : '0.9'}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const BrandMark = ({
  compact = false,
  showTagline = false,
  showName = true,
  hideNameMobile = false,
  clickable = true,
  className = '',
  textClassName = '',
  iconClassName = '',
}) => {
  const [logoFailed, setLogoFailed] = useState(false);

  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (e) {
    // Auth context fallback
  }

  let isDark = true;
  try {
    const themeContext = useTheme();
    isDark = themeContext?.theme === 'dark';
  } catch (e) {
    // Theme context fallback
  }

  // Proportional sizing: standard is 48px (h-12), compact is 40px (h-10)
  const iconSize = compact ? 'h-10 w-10' : 'h-12 w-12';
  const titleSize = compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

  // Branding colors text styling (neon gradient for dark theme, dark forest green gradient for light theme)
  const textColorClass = isDark
    ? 'text-neon bg-gradient-to-r from-[#B6FF5C] via-[#c8ff80] to-[#9edf45] bg-clip-text text-transparent'
    : 'text-[#4B8014] bg-gradient-to-r from-[#4B8014] via-[#5C991B] to-[#3A630E] bg-clip-text text-transparent';

  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${iconSize} flex items-center justify-center flex-shrink-0`}>
        {!logoFailed ? (
          <img
            src="/brand-logo.svg"
            alt={`${BRAND_NAME} Logo`}
            className={`block w-full h-full object-contain ${iconClassName}`}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <FallbackIcon className={`block w-full h-full ${iconClassName}`} isDark={isDark} />
        )}
      </div>

      {showName && (
        <div className={`min-w-0 text-left ${hideNameMobile ? 'hidden sm:block' : ''}`}>
          <div className={`font-black tracking-tight ${titleSize} ${textColorClass} ${textClassName}`}>
            {BRAND_NAME}
          </div>
          {showTagline && (
            <div className={`mt-0.5 text-slate-400 font-semibold tracking-normal ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
              {BRAND_TAGLINE}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (clickable) {
    const target = user ? '/dashboard' : '/';
    return (
      <Link to={target} className="inline-block hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default BrandMark;

