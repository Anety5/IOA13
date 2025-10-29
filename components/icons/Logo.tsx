
import React from 'react';

export const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M32 8C20.9543 8 12 16.9543 12 28C12 39.0457 20.9543 48 32 48C43.0457 48 52 39.0457 52 28C52 16.9543 43.0457 8 32 8Z" stroke="url(#logo-gradient-brain)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32 8V56" stroke="url(#logo-gradient-brain)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 28H42" stroke="#818CF8" strokeWidth="4" strokeLinecap="round"/>
        <path d="M26 36H38" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round"/>
        <path d="M28 20H36" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round"/>
      <defs>
        <linearGradient id="logo-gradient-brain" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA"/>
          <stop offset="1" stopColor="#38BDF8"/>
        </linearGradient>
      </defs>
    </svg>
    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">
      IOAI Studio
    </h1>
  </div>
);