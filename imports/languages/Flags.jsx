import React from 'react';

// Inline SVG flags — emoji flags (🇪🇸) render as bare letters on Windows browsers,
// so these are drawn instead. Sized for ~20px wide display; deliberately simplified.

const STAR = '0,-1 0.2245,-0.309 0.951,-0.309 0.3633,0.1181 0.588,0.809 0,0.382 -0.588,0.809 -0.3633,0.1181 -0.951,-0.309 -0.2245,-0.309';

function Svg({ children, title, size = 20 }) {
  return (
    <svg
      viewBox="0 0 60 40"
      width={size}
      height={Math.round((size * 2) / 3)}
      role="img"
      aria-label={title}
      className="shrink-0"
    >
      {children}
      <rect x="0" y="0" width="60" height="40" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
    </svg>
  );
}

function FlagGB({ size }) {
  return (
    <Svg title="English" size={size}>
      <clipPath id="gb-clip"><rect width="60" height="40" /></clipPath>
      <g clipPath="url(#gb-clip)">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 L30,40 M0,20 L60,20" stroke="#fff" strokeWidth="13" />
        <path d="M30,0 L30,40 M0,20 L60,20" stroke="#C8102E" strokeWidth="8" />
      </g>
    </Svg>
  );
}

function FlagES({ size }) {
  return (
    <Svg title="Español" size={size}>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </Svg>
  );
}

function FlagFR({ size }) {
  return (
    <Svg title="Français" size={size}>
      <rect width="60" height="40" fill="#fff" />
      <rect width="20" height="40" fill="#002395" />
      <rect x="40" width="20" height="40" fill="#ED2939" />
    </Svg>
  );
}

function FlagIN({ size }) {
  return (
    <Svg title="हिन्दी" size={size}>
      <rect width="60" height="40" fill="#fff" />
      <rect width="60" height="13.33" fill="#FF9933" />
      <rect y="26.67" width="60" height="13.33" fill="#138808" />
      <circle cx="30" cy="20" r="5" fill="none" stroke="#000080" strokeWidth="1.6" />
      <circle cx="30" cy="20" r="1.2" fill="#000080" />
    </Svg>
  );
}

function FlagCN({ size }) {
  return (
    <Svg title="简体中文" size={size}>
      <rect width="60" height="40" fill="#EE1C25" />
      <polygon points={STAR} fill="#FFDE00" transform="translate(12,11) scale(7) rotate(0)" />
      <polygon points={STAR} fill="#FFDE00" transform="translate(24,5) scale(2.4)" />
      <polygon points={STAR} fill="#FFDE00" transform="translate(29,11) scale(2.4)" />
      <polygon points={STAR} fill="#FFDE00" transform="translate(29,18) scale(2.4)" />
      <polygon points={STAR} fill="#FFDE00" transform="translate(24,23) scale(2.4)" />
    </Svg>
  );
}

function FlagID({ size }) {
  return (
    <Svg title="Bahasa Indonesia" size={size}>
      <rect width="60" height="40" fill="#fff" />
      <rect width="60" height="20" fill="#CE1126" />
    </Svg>
  );
}

// Flag of the Arab League — a pan-Arab flag rather than any one country's, which
// suits a language that spans 20+ nations. The emblem's gold chain and wreath
// enclose a crescent; the Arabic inscription inside it is illegible at this size
// and is left out rather than faked.
function FlagAL({ size }) {
  return (
    <Svg title="العربية" size={size}>
      <rect width="60" height="40" fill="#007A3D" />
      {/* chain / wreath ring */}
      <circle cx="30" cy="20" r="13" fill="none" stroke="#FFCC00" strokeWidth="1.6" />
      {/* crescent, horns pointing up: a gold disc carved by a green one */}
      <circle cx="30" cy="21.5" r="9" fill="#FFCC00" />
      <circle cx="30" cy="17.8" r="7.8" fill="#007A3D" />
    </Svg>
  );
}

export const FLAGS = {
  en: FlagGB,
  es: FlagES,
  fr: FlagFR,
  hi: FlagIN,
  id: FlagID,
  zh: FlagCN,
  ar: FlagAL,
};

export function Flag({ code, size = 20 }) {
  const Component = FLAGS[code];
  return Component ? <Component size={size} /> : null;
}
