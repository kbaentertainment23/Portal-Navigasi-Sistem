import React from 'react';

export const PalmLeafOrnamentRight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none ${className}`}
  >
    <path
      d="M210 20C170 40 130 90 100 150C80 190 60 220 20 230"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.35"
    />
    {/* Fronds */}
    <path d="M190 35C160 30 135 45 120 65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M175 55C140 50 120 70 105 95" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M155 80C125 80 105 100 92 125" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M135 110C105 115 88 135 78 160" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M115 140C90 150 72 170 65 195" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />

    <path d="M205 30C190 60 180 90 175 120" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.25" />
    <path d="M180 60C165 90 155 115 150 145" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.25" />
    <path d="M155 95C140 120 130 145 125 170" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.25" />
  </svg>
);

export const PalmLeafOrnamentLeft: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none ${className}`}
  >
    <path
      d="M30 20C70 40 110 90 140 150C160 190 180 220 220 230"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.35"
    />
    {/* Fronds */}
    <path d="M50 35C80 30 105 45 120 65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M65 55C100 50 120 70 135 95" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M85 80C115 80 135 100 148 125" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M105 110C135 115 152 135 162 160" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
    <path d="M125 140C150 150 168 170 175 195" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />

    <path d="M35 30C50 60 60 90 65 120" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.25" />
    <path d="M60 60C75 90 85 115 90 145" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.25" />
    <path d="M85 95C100 120 110 145 115 170" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.25" />
  </svg>
);

export const TropicalHeaderAccent: React.FC = () => (
  <div className="flex items-center justify-center gap-2 my-2 text-amber-500/80">
    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-500/60" />
    <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 13.5 7 16 9.5C18.5 12 22 12 22 12C22 12 18.5 12 16 14.5C13.5 17 12 22 12 22C12 22 10.5 17 8 14.5C5.5 12 2 12 2 12C2 12 5.5 12 8 9.5C10.5 7 12 2 12 2Z" />
    </svg>
    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-500/60" />
  </div>
);
