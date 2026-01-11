import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="none"
  >
    <defs>
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#neon-glow)">
      {/* Main Hexagon/Cube Outline */}
      <path d="M50 10 L88 32 V76 L50 98 L12 76 V32 L50 10Z" 
            stroke="#00F0FF" 
            strokeWidth="3" 
            strokeLinejoin="round" />
      
      {/* Inner Y Shape forming the cube */}
      <path d="M50 54 L50 98 M50 54 L88 32 M50 54 L12 32" 
            stroke="#00F0FF" 
            strokeWidth="3" 
            strokeLinecap="round" />
            
      {/* Cyberpunk Circuit Details */}
      <path d="M22 45 L35 52 M22 65 L30 60" 
            stroke="#00F0FF" 
            strokeWidth="2" 
            opacity="0.8" />
            
      <path d="M78 45 L65 52 M78 65 L70 60" 
            stroke="#00F0FF" 
            strokeWidth="2" 
            opacity="0.8" />
            
      <path d="M50 20 V35" 
            stroke="#00F0FF" 
            strokeWidth="2" 
            opacity="0.8" />
            
      {/* Center Node */}
      <circle cx="50" cy="54" r="5" fill="#050505" stroke="#00F0FF" strokeWidth="2" />
      <circle cx="50" cy="54" r="2" fill="#00F0FF" />
    </g>
  </svg>
);