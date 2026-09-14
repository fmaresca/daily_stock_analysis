import React from 'react';

export interface DeltaHarvestLogoProps {
  /**
   * Layout variant:
   * - 'full': Mark + DELTAHARVEST + INSTITUTIONAL + Subtitle
   * - 'header': Mark + DELTAHARVEST + INSTITUTIONAL (standard brand header)
   * - 'mark': Vector mark only (faceted delta + dynamic orbital swoosh)
   * - 'icon': App icon squircle container with mark (matches bottom-left of reference design)
   */
  variant?: 'full' | 'header' | 'mark' | 'icon';
  /**
   * Layout alignment direction:
   * - 'horizontal' (default): Mark on left, Wordmark on right
   * - 'vertical': Mark on top, Wordmark centered underneath
   */
  layout?: 'horizontal' | 'vertical';
  /**
   * Theme mode:
   * - 'dark': White/silver text, neon/cyan luminous accents, dark backdrop
   * - 'light': Navy/slate text, deep jewel teal/cyan accents, light backdrop
   * - 'auto': Uses CSS/currentColor and adapts automatically to html.light / html.dark
   */
  theme?: 'dark' | 'light' | 'auto';
  /**
   * Size presets or custom pixel size
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showSubtitle?: boolean;
}

export const DeltaHarvestLogo: React.FC<DeltaHarvestLogoProps> = ({
  variant = 'header',
  layout = 'horizontal',
  theme = 'auto',
  size = 'md',
  className = '',
  showSubtitle = false,
}) => {
  // Dimension sizing map
  const markSize = typeof size === 'number'
    ? size
    : size === 'xs'
    ? 24
    : size === 'sm'
    ? 32
    : size === 'md'
    ? 40
    : size === 'lg'
    ? 52
    : 68;

  // Unique ID prefix to avoid SVG gradient ID collisions
  const uid = React.useId().replace(/:/g, '');

  // Render the core 3D faceted Greek Delta (Δ) emblem + dynamic orbital swoosh
  const renderMark = (s: number) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transform transition-transform duration-300 hover:scale-105"
      role="img"
      aria-label="DeltaHarvest Institutional Logo Mark"
    >
      <defs>
        {/* Glow filter for dark mode luminous effect */}
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#06b6d4" floodOpacity={theme === 'light' ? '0.2' : '0.4'} />
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#10b981" floodOpacity={theme === 'light' ? '0.15' : '0.3'} />
        </filter>

        {/* Soft shadow for depth */}
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#021422" floodOpacity="0.5" />
        </filter>

        {/* Left Strut Outer Facet (Teal into Deep Cyan) */}
        <linearGradient id={`${uid}-left-outer`} x1="80" y1="26" x2="30" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>

        {/* Left Strut Inner Facet (Brighter Emerald / Cyan Highlight) */}
        <linearGradient id={`${uid}-left-inner`} x1="80" y1="30" x2="52" y2="114" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="40%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>

        {/* Right Strut Outer Facet (Chiseled Darker Shade / Oceanic Teal) */}
        <linearGradient id={`${uid}-right-outer`} x1="80" y1="26" x2="132" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="60%" stopColor="#0f4c64" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>

        {/* Right Strut Inner Facet (Deep Emerald Shading) */}
        <linearGradient id={`${uid}-right-inner`} x1="80" y1="30" x2="108" y2="114" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="70%" stopColor="#115e59" />
          <stop offset="100%" stopColor="#042f2e" />
        </linearGradient>

        {/* Bottom Strut Lower Facet (Deep Foundation Shelf) */}
        <linearGradient id={`${uid}-bottom-lower`} x1="30" y1="128" x2="130" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="50%" stopColor="#083344" />
          <stop offset="100%" stopColor="#06212d" />
        </linearGradient>

        {/* Bottom Strut Upper Facet (Gleaming Base Ridge) */}
        <linearGradient id={`${uid}-bottom-upper`} x1="45" y1="112" x2="115" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="50%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#115e59" />
        </linearGradient>

        {/* Dynamic Front Orbital Swoosh (Vibrant Spring Emerald to Cyan) */}
        <linearGradient id={`${uid}-orbital-front`} x1="140" y1="70" x2="90" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="35%" stopColor="#10b981" />
          <stop offset="70%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Background Orbital Guide Loop (Curved ambient ring) */}
        <linearGradient id={`${uid}-orbital-back`} x1="25" y1="60" x2="145" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Group wrapped with subtle financial glow */}
      <g filter={`url(#${uid}-glow)`}>
        {/* Background Ambient Orbital Arc (Looping behind left base & apex) */}
        <path
          d="M 28 92 C 18 68 32 38 60 28 C 82 20 114 26 130 46"
          stroke={`url(#${uid}-orbital-back)`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="4 6"
          fill="none"
        />
        <path
          d="M 134 108 C 145 88 140 60 126 44"
          stroke={`url(#${uid}-orbital-back)`}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 22 96 C 24 120 54 138 88 138 C 106 138 124 132 136 122"
          stroke={`url(#${uid}-orbital-back)`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="3 5"
          fill="none"
        />

        {/* === 3D FACETED GREEK DELTA (Δ) CHISEL BODY === */}
        {/* Facet 1: Left Strut - Outer Face */}
        <polygon
          points="80,24 45,116 28,124 80,24"
          fill={`url(#${uid}-left-outer)`}
          filter={`url(#${uid}-shadow)`}
        />

        {/* Facet 2: Left Strut - Inner Face */}
        <polygon
          points="80,24 80,68 56,110 45,116 80,24"
          fill={`url(#${uid}-left-inner)`}
        />

        {/* Facet 3: Right Strut - Outer Face (Chiseled Shadow) */}
        <polygon
          points="80,24 132,124 115,116 80,24"
          fill={`url(#${uid}-right-outer)`}
          filter={`url(#${uid}-shadow)`}
        />

        {/* Facet 4: Right Strut - Inner Face */}
        <polygon
          points="80,24 115,116 104,110 80,68 80,24"
          fill={`url(#${uid}-right-inner)`}
        />

        {/* Facet 5: Bottom Base - Lower Shelf */}
        <polygon
          points="28,124 45,116 115,116 132,124 28,124"
          fill={`url(#${uid}-bottom-lower)`}
        />

        {/* Facet 6: Bottom Base - Upper Ridge */}
        <polygon
          points="45,116 56,110 104,110 115,116 45,116"
          fill={`url(#${uid}-bottom-upper)`}
        />

        {/* Center Triangular Negative Space (Cutout bevel border) */}
        <polygon
          points="80,70 58,109 102,109"
          fill={theme === 'light' ? '#ffffff' : '#090d16'}
          opacity={theme === 'auto' ? '0.95' : '1'}
          className={theme === 'auto' ? 'fill-slate-950 light:fill-white' : ''}
        />

        {/* Apex Highlight Gem Spike */}
        <polygon
          points="80,24 82,34 80,38 78,34"
          fill="#a5f3fc"
          opacity="0.9"
        />

        {/* === DYNAMIC OVERLAPPING ORBITAL SWOOSH & ARROW === */}
        {/* Layered foreground swoosh ribbon cutting diagonally through right flank */}
        <path
          d="M 124 58 C 142 82 135 110 108 126 C 92 135 72 136 54 130 C 42 126 36 120 38 116 C 40 112 48 114 62 118 C 78 122 96 121 110 112 C 128 100 132 80 118 64 Z"
          fill={`url(#${uid}-orbital-front)`}
          filter={`url(#${uid}-shadow)`}
        />

        {/* Forward Sharp Arrow Head / Chevron on the Orbit */}
        <path
          d="M 112 50 L 132 60 L 118 76 L 122 65 L 106 58 Z"
          fill="#86efac"
          filter={`url(#${uid}-shadow)`}
        />

        {/* Inner Apex Gleam Accent */}
        <path
          d="M 76 34 L 80 26 L 84 34"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>
    </svg>
  );

  // Variant: Pure vector Mark
  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderMark(markSize)}
      </div>
    );
  }

  // Variant: App Icon Tile Squircle (matches bottom-left quadrant of reference)
  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl p-2.5 transition-all shadow-xl ${
          theme === 'light'
            ? 'bg-white border border-slate-200/90 shadow-slate-300/40'
            : theme === 'dark'
            ? 'bg-slate-900 border border-slate-800 shadow-cyan-950/40'
            : 'bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200'
        } ${className}`}
        style={{ width: markSize * 1.4, height: markSize * 1.4 }}
      >
        {renderMark(markSize)}
      </div>
    );
  }

  // Text color classes based on theme
  const titleColor =
    theme === 'light'
      ? 'text-slate-900'
      : theme === 'dark'
      ? 'text-white'
      : 'text-white light:text-slate-900';

  const subtitleColor =
    theme === 'light'
      ? 'text-slate-600'
      : theme === 'dark'
      ? 'text-slate-300'
      : 'text-slate-300 light:text-slate-600';

  const tagColor =
    theme === 'light'
      ? 'text-slate-500'
      : theme === 'dark'
      ? 'text-slate-400'
      : 'text-slate-400 light:text-slate-500';

  const isVertical = layout === 'vertical';

  // Variant: Full or Header
  return (
    <div
      className={`inline-flex ${
        isVertical ? 'flex-col items-center justify-center space-y-2.5' : 'items-center space-x-3'
      } select-none ${className}`}
    >
      {/* 3D Chiseled Delta Mark */}
      <div className="shrink-0 flex items-center justify-center">
        {renderMark(markSize)}
      </div>

      {/* Institutional Wordmark */}
      <div
        className={`flex flex-col justify-center leading-none ${
          isVertical ? 'items-center text-center' : ''
        }`}
      >
        {/* DELTAHARVEST Primary Wordmark */}
        <div className={`flex items-center ${isVertical ? 'justify-center' : ''}`}>
          <span
            className={`font-extrabold tracking-[0.12em] uppercase font-sans ${titleColor}`}
            style={{
              fontSize: markSize <= 32 ? '1.05rem' : markSize <= 42 ? '1.25rem' : '1.5rem',
              letterSpacing: '0.12em',
            }}
          >
            DELTAHARVEST
          </span>
        </div>

        {/* INSTITUTIONAL Sub-Wordmark */}
        <div className={`flex items-center mt-0.5 ${isVertical ? 'justify-center' : ''}`}>
          <span
            className={`font-semibold tracking-[0.32em] uppercase font-sans text-emerald-400 light:text-teal-700 ${subtitleColor}`}
            style={{
              fontSize: markSize <= 32 ? '0.58rem' : markSize <= 42 ? '0.68rem' : '0.78rem',
              letterSpacing: '0.32em',
            }}
          >
            INSTITUTIONAL
          </span>
        </div>

        {/* Full Descriptor Subtitle (when variant === 'full' or showSubtitle is true) */}
        {(variant === 'full' || showSubtitle) && (
          <p
            className={`text-[9px] font-mono tracking-wider uppercase mt-1 hidden sm:block ${tagColor} ${
              isVertical ? 'text-center' : ''
            }`}
            style={{ letterSpacing: '0.08em' }}
          >
            SYSTEMATIC US EQUITIES QUANTITATIVE ANALYSIS | OPTIONS CASH FLOW HARVESTING | INSTITUTIONAL RISK MANAGEMENT
          </p>
        )}
      </div>
    </div>
  );
};
