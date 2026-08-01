import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  lightOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
  lightOnly = false
}) => {
  // Size mapping
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-4xl sm:text-5xl'
  };

  const subtitleSizes = {
    sm: 'text-[8px] tracking-[0.25em]',
    md: 'text-[10px] sm:text-[11px] tracking-[0.32em]',
    lg: 'text-[12px] sm:text-[13px] tracking-[0.36em]',
    xl: 'text-[15px] tracking-[0.42em]'
  };

  const taglineSizes = {
    sm: 'text-[7px]',
    md: 'text-[8px] sm:text-[9px]',
    lg: 'text-[10px] sm:text-[11px]',
    xl: 'text-[12px]'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Isometric E-Cube Symbol with Circuit Traces & Upward Arrow */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center filter drop-shadow-[0_4px_10px_rgba(6,182,212,0.4)]`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform hover:scale-105 transition-transform duration-300"
        >
          <defs>
            {/* 3D Metallic Cube Gradients */}
            <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>

            <linearGradient id="metallicText" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 3D Isometric Cube Stack forming 'E' */}
          {/* Top-Left Cube 1 */}
          <path d="M 35 25 L 55 13 L 75 25 L 55 37 Z" fill="url(#cubeTop)" stroke="#38bdf8" strokeWidth="0.8" />
          <path d="M 35 25 L 55 37 L 55 60 L 35 48 Z" fill="url(#cubeLeft)" stroke="#0284c7" strokeWidth="0.8" />
          <path d="M 55 37 L 75 25 L 75 48 L 55 60 Z" fill="url(#cubeRight)" stroke="#334155" strokeWidth="0.8" />

          {/* Top-Right Cube 2 with Arrow */}
          <path d="M 65 38 L 85 26 L 105 38 L 85 50 Z" fill="url(#cubeTop)" stroke="#38bdf8" strokeWidth="0.8" />
          <path d="M 65 38 L 85 50 L 85 73 L 65 61 Z" fill="url(#cubeLeft)" stroke="#0284c7" strokeWidth="0.8" />
          <path d="M 85 50 L 105 38 L 105 61 L 85 73 Z" fill="url(#cubeRight)" stroke="#334155" strokeWidth="0.8" />

          {/* Middle Cube 3 */}
          <path d="M 45 60 L 65 48 L 85 60 L 65 72 Z" fill="url(#cubeTop)" stroke="#38bdf8" strokeWidth="0.8" />
          <path d="M 45 60 L 65 72 L 65 95 L 45 83 Z" fill="url(#cubeLeft)" stroke="#0284c7" strokeWidth="0.8" />
          <path d="M 65 72 L 85 60 L 85 83 L 65 95 Z" fill="url(#cubeRight)" stroke="#334155" strokeWidth="0.8" />

          {/* Bottom-Right Cube 4 */}
          <path d="M 65 83 L 85 71 L 105 83 L 85 95 Z" fill="url(#cubeTop)" stroke="#38bdf8" strokeWidth="0.8" />
          <path d="M 65 83 L 85 95 L 85 112 L 65 100 Z" fill="url(#cubeLeft)" stroke="#0284c7" strokeWidth="0.8" />
          <path d="M 85 95 L 105 83 L 105 100 L 85 112 Z" fill="url(#cubeRight)" stroke="#334155" strokeWidth="0.8" />

          {/* Cyan Circuit Board Traces Connecting Cubes */}
          <path d="M 45 35 Q 45 52 65 58 Q 75 62 75 78" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
          <circle cx="45" cy="35" r="3" fill="#22d3ee" filter="url(#glow)" />
          <circle cx="75" cy="78" r="3" fill="#22d3ee" filter="url(#glow)" />

          {/* Upward Growth Arrow Path */}
          <path d="M 75 60 L 98 37 M 98 37 L 85 37 M 98 37 L 98 50" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

          {/* Micro Node Dots */}
          <circle cx="65" cy="48" r="2" fill="#ffffff" />
          <circle cx="85" cy="60" r="2" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography Text Side */}
      {variant !== 'icon' && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center">
            <span className={`font-black ${titleSizes[size]} tracking-tight font-sans text-slate-900 dark:text-white uppercase ${lightOnly ? 'text-white' : ''}`}>
              ELEVATE
            </span>
          </div>
          <span className={`font-extrabold ${subtitleSizes[size]} text-accent-blue dark:text-cyan-400 uppercase mt-0.5`}>
            TECHNOLOGIES
          </span>
          {showTagline && (
            <span className={`font-bold ${taglineSizes[size]} text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1 border-t border-slate-200 dark:border-slate-700 pt-0.5`}>
              ELEVATING SOLUTIONS. EMPOWERING GROWTH.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
