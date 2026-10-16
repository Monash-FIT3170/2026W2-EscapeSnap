import React from 'react';

// Shared SVG paint for the evidence photos and the pins. Rendered once, in
// EvidenceBoard.
export function PaintDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="lp-g-lit" cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#3b322b" />
          <stop offset=".6" stopColor="#16120f" />
          <stop offset="1" stopColor="#060504" />
        </radialGradient>
        <linearGradient id="lp-g-beam" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f6ebd3" stopOpacity=".6" />
          <stop offset="1" stopColor="#f6ebd3" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lp-g-spill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e7cf" stopOpacity=".55" />
          <stop offset="1" stopColor="#f3e7cf" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lp-g-pin" cx="35%" cy="32%" r="70%">
          <stop offset="0" stopColor="#ff9a8a" />
          <stop offset=".42" stopColor="#cf1f14" />
          <stop offset="1" stopColor="#430705" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Photo({ children }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="url(#lp-g-lit)" />
      {children}
    </svg>
  );
}

// #1 A torn note with a question mark.
export function ArtRiddle() {
  return (
    <Photo>
      <g transform="rotate(-7 100 100)">
        <path
          d="M50 36H150L146 49 152 62 146 76 151 91 145 106 151 121 146 136 150 150 147 164H50Z"
          fill="#dcd1bc"
        />
        <path
          d="M64 60H134M64 76H140M64 92H120M64 108H136M64 124H108"
          stroke="#4a3f36"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="10 5 18 4 24 6"
        />
        <text
          x="112"
          y="156"
          fontFamily="Rock Salt, cursive"
          fontSize="34"
          fill="#b51a12"
        >
          ?
        </text>
      </g>
    </Photo>
  );
}

// #2 A torch beam finding a clock.
export function ArtFind() {
  return (
    <Photo>
      <polygon points="59,141 67,152 206,100 142,18" fill="url(#lp-g-beam)" />
      <g stroke="#e8dfcf" strokeWidth="3" fill="none" strokeLinecap="round">
        <circle cx="166" cy="64" r="20" />
        <path d="M166 64V52M166 64L175 70M152 46L146 40M180 46L186 40M154 84L150 90M178 84L182 90" />
      </g>
      <g transform="translate(62 147) rotate(-38)">
        <rect
          x="-50"
          y="-9"
          width="42"
          height="18"
          rx="3"
          fill="#3a332e"
          stroke="#e8dfcf"
          strokeWidth="2"
        />
        <path
          d="M-8 -9L6 -14V14L-8 9Z"
          fill="#5a514a"
          stroke="#e8dfcf"
          strokeWidth="2"
        />
      </g>
    </Photo>
  );
}

// #3 A key in the camera's viewfinder.
export function ArtPhoto() {
  return (
    <Photo>
      <path
        d="M36 58V36H58M142 36H164V58M164 142V164H142M58 164H36V142"
        stroke="#e8dfcf"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="50" cy="50" r="4" fill="#d32a1d" />
      <text
        x="59"
        y="54"
        fontFamily="ui-monospace,monospace"
        fontSize="11"
        fill="#e8dfcf"
        letterSpacing="1"
      >
        REC
      </text>
      <g stroke="#e8dfcf" fill="none" strokeLinecap="round">
        <circle cx="72" cy="104" r="14" strokeWidth="5" />
        <path d="M86 104H144M130 104V118M140 104V114" strokeWidth="6" />
      </g>
      <path
        d="M110 82V94M110 114V126M88 82V88H94M132 82V88H126M88 126V120H94M132 126V120H126"
        stroke="#d32a1d"
        strokeWidth="2"
        fill="none"
      />
    </Photo>
  );
}

// #4 Letter tiles O R D and an empty slot.
export function ArtLetters() {
  return (
    <Photo>
      <g
        fontFamily="Oswald, Impact, sans-serif"
        fontWeight="700"
        fontSize="36"
        textAnchor="middle"
        fill="#1e1915"
      >
        <g transform="rotate(-9 56 88)">
          <rect x="34" y="62" width="44" height="52" rx="3" fill="#dcd1bc" />
          <text x="56" y="101">
            O
          </text>
        </g>
        <g transform="rotate(6 102 112)">
          <rect x="80" y="86" width="44" height="52" rx="3" fill="#dcd1bc" />
          <text x="102" y="125">
            R
          </text>
        </g>
        <g transform="rotate(-4 148 80)">
          <rect x="126" y="54" width="44" height="52" rx="3" fill="#dcd1bc" />
          <text x="148" y="93">
            D
          </text>
        </g>
      </g>
      <g transform="rotate(8 129 160)">
        <rect
          x="112"
          y="142"
          width="34"
          height="40"
          rx="3"
          fill="none"
          stroke="#e8dfcf"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <text
          x="129"
          y="170"
          textAnchor="middle"
          fontFamily="Rock Salt, cursive"
          fontSize="16"
          fill="#e04434"
        >
          ?
        </text>
      </g>
    </Photo>
  );
}

// #5 An open door with a figure in the light.
export function ArtEscape() {
  return (
    <Photo>
      <polygon points="98,164 138,164 200,200 72,200" fill="url(#lp-g-spill)" />
      <rect x="62" y="32" width="76" height="132" fill="#efe4cc" />
      <circle cx="117" cy="66" r="8" fill="#0d0a08" />
      <path
        d="M106 80Q117 74 128 80L131 122H125L124 164H118L117 128 116 164H110L109 122H103Z"
        fill="#0d0a08"
      />
      <polygon
        points="62,32 98,44 98,152 62,164"
        fill="#1c1714"
        stroke="#e8dfcf"
        strokeWidth="2"
      />
      <circle cx="91" cy="100" r="3" fill="#e8dfcf" />
      <rect
        x="62"
        y="32"
        width="76"
        height="132"
        fill="none"
        stroke="#e8dfcf"
        strokeWidth="3"
      />
      <path d="M14 164H186" stroke="#e8dfcf" strokeWidth="2" opacity=".35" />
    </Photo>
  );
}
