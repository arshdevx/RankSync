import React from 'react';

interface RankSyncLogoProps {
  size?: number;
  className?: string;
}

export const RankSyncLogo: React.FC<RankSyncLogoProps> = ({ size = 20, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="rs-mark-grad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="rs-mark-accent" x1="22" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="rs-mark-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Dark rounded shield container */}
      <rect width="64" height="64" rx="14" fill="#0d0d12" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" stroke="rgba(255,255,255,0.12)" />

      {/* Main vertical spine */}
      <path
        d="M18 16C18 14.8954 18.8954 14 20 14H27C28.1046 14 29 14.8954 29 16V48C29 49.1046 28.1046 50 27 50H20C18.8954 50 18 49.1046 18 48V16Z"
        fill="url(#rs-mark-grad)"
      />

      {/* Geometric upper loop */}
      <path
        d="M27 14H37C42.5228 14 47 18.4772 47 24C47 29.5228 42.5228 34 37 34H27V14Z"
        fill="url(#rs-mark-grad)"
        opacity="0.9"
      />
      <path
        d="M29 20H36C38.2091 20 40 21.7909 40 24C40 26.2091 38.2091 28 36 28H29V20Z"
        fill="#0d0d12"
      />

      {/* Ascending Chevron / Sync Blade */}
      <path
        d="M33 32L46 48C46.8 48.9 45.9 50 44.5 50H37.5C36.8 50 36.1 49.6 35.6 49L26 36L33 32Z"
        fill="url(#rs-mark-accent)"
        filter="url(#rs-mark-glow)"
      />

      {/* Top right sync impulse dot */}
      <circle cx="45" cy="18" r="3.5" fill="#38bdf8" filter="url(#rs-mark-glow)" />
    </svg>
  );
};
