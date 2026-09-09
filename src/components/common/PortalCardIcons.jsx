import React from 'react';

/**
 * Customer Portal Icon: Group of 3 People
 * Center prominent white figure flanked by warm amber community members
 */
export function CustomerPortalIcon({ className = "w-8 h-8", size = 32 }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Member (Warm Peach / Amber) */}
      <circle cx="10" cy="18" r="4.6" fill="#FED7AA" />
      <path
        d="M2 33C2 27.5 5.8 24.2 10 24.2C12.8 24.2 15.2 25.5 16.6 27.6C15.6 29.2 15 31 15 33H2Z"
        fill="#FED7AA"
      />

      {/* Right Member (Warm Peach / Amber) */}
      <circle cx="30" cy="18" r="4.6" fill="#FED7AA" />
      <path
        d="M38 33C38 27.5 34.2 24.2 30 24.2C27.2 24.2 24.8 25.5 23.4 27.6C24.4 29.2 25 31 25 33H38Z"
        fill="#FED7AA"
      />

      {/* Center Member (Prominent Pure White) */}
      <circle cx="20" cy="13.5" r="5.8" fill="#FFFFFF" />
      <path
        d="M9.8 33.5C9.8 27 14.2 23 20 23C25.8 23 30.2 27 30.2 33.5C30.2 34.2 29.6 34.5 29 34.5H11C10.4 34.5 9.8 34.2 9.8 33.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Pillar Portal Icon: Skilled Worker with Hard Hat + Wrench
 * High-precision worker silhouette with safety helmet and open-end wrench
 */
export function PillarPortalIcon({ className = "w-8 h-8", size = 32 }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Safety Hard Hat */}
      <path d="M14.5 11.5C14.5 6.2 17 4.5 20 4.5C23 4.5 25.5 6.2 25.5 11.5Z" fill="#FFFFFF" />
      {/* Center Top Ridge */}
      <rect x="19" y="3.2" width="2" height="4.5" rx="1" fill="#FFFFFF" />
      {/* Helmet Brim */}
      <path d="M11 12C11 11.2 13 10.5 20 10.5C27 10.5 29 11.2 29 12C29 12.8 27 13.5 20 13.5C13 13.5 11 12.8 11 12Z" fill="#FFFFFF" />

      {/* Worker Head / Chin */}
      <path d="M15.5 14C15.5 18 17.5 20 20 20C22.5 20 24.5 18 24.5 14H15.5Z" fill="#FFFFFF" />

      {/* Worker Torso / Overalls */}
      <path d="M8.5 35C8.5 28.5 12.5 23.8 16.5 23.5V28H23.5V23.5C24.5 23.6 25.5 24 26.5 24.8L25.2 26.2L22.5 23.5L20 26L23.8 29.8L27.5 26.1C27 28.8 25.5 31.8 22.8 34.5L21.5 35H8.5Z" fill="#FFFFFF" />

      {/* Held Open-End Wrench (Angle ~42 deg in right hand) */}
      <g transform="translate(19.5, 14.5) rotate(42)">
        {/* Open-end Wrench Jaw */}
        <path
          d="M7.5 -4.5C5.8 -4.5 4.3 -3.2 4.1 -1.5C4 -0.5 4.4 0.5 5 1.1L3.2 2.9L4.8 4.5L6.6 2.7C7.2 3.3 8.1 3.7 9.1 3.6C10.8 3.5 12.2 2 12.2 0.2C12.2 -0.7 11.8 -1.5 11.1 -2.1L9.7 -0.7C9.4 -0.4 8.9 -0.4 8.6 -0.7C8.3 -1 8.3 -1.5 8.6 -1.8L10 -3.2C9.3 -4 8.4 -4.5 7.5 -4.5Z"
          fill="#FFFFFF"
        />
        {/* Wrench Handle with Rounded End */}
        <path
          d="M2.5 3.5L-5.5 11.5C-6.2 12.2 -6.2 13.3 -5.5 14C-4.8 14.7 -3.7 14.7 -3 14L5 6L2.5 3.5Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

/**
 * Admin Portal Icon: Cooperative / Government Building with Community
 * Classical institution building with columns and community figures in bottom right
 */
export function AdminPortalIcon({ className = "w-8 h-8", size = 32 }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Classical Building */}
      {/* Triangular Roof Pediment */}
      <path d="M20 5L6 14H34L20 5Z" fill="#FFFFFF" />
      {/* Center Pediment Dot */}
      <circle cx="20" cy="10.8" r="1.8" fill="#042F2E" />

      {/* Horizontal Architrave / Lintel */}
      <rect x="7" y="15" width="26" height="2.5" rx="0.5" fill="#FFFFFF" />

      {/* Columns */}
      <rect x="9.5" y="18.5" width="2.8" height="12.5" rx="0.4" fill="#FFFFFF" />
      <rect x="15.2" y="18.5" width="2.8" height="12.5" rx="0.4" fill="#FFFFFF" />
      <rect x="21" y="18.5" width="2.8" height="8.5" rx="0.4" fill="#FFFFFF" />
      <rect x="26.8" y="18.5" width="2.8" height="6.5" rx="0.4" fill="#FFFFFF" />

      {/* Base Platform / Foundation Steps */}
      <rect x="5" y="32" width="30" height="2.5" rx="0.6" fill="#FFFFFF" />

      {/* 2 Community Figures in Bottom-Right Corner */}
      {/* Back Figure */}
      <circle cx="24.8" cy="25" r="2.5" fill="#FFFFFF" />
      <path
        d="M21.5 33C21.5 30 22.8 28.2 24.8 28.2C26.8 28.2 28.2 30 28.2 33H21.5Z"
        fill="#FFFFFF"
        stroke="#042F2E"
        strokeWidth="1.2"
      />

      {/* Front Figure */}
      <circle cx="29.8" cy="25.5" r="2.5" fill="#FFFFFF" />
      <path
        d="M26.5 33C26.5 30.2 27.8 28.6 29.8 28.6C31.8 28.6 33.2 30.2 33.2 33H26.5Z"
        fill="#FFFFFF"
        stroke="#042F2E"
        strokeWidth="1.2"
      />
    </svg>
  );
}
