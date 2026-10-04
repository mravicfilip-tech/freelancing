/** Stand-in for the reference's rendered bust: a dark figure under lavender studio light. */
export function Portrait() {
  return (
    <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Generated thumbnail: dark sculpted figure">
      <defs>
        <radialGradient id="pt-bg" cx="50%" cy="22%" r="85%">
          <stop offset="0" stopColor="#d6d1ec" />
          <stop offset="0.35" stopColor="#8f88b6" />
          <stop offset="0.75" stopColor="#3b3758" />
          <stop offset="1" stopColor="#1d1b2b" />
        </radialGradient>
        <linearGradient id="pt-skin" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#4a4858" />
          <stop offset="0.45" stopColor="#1d1c25" />
          <stop offset="1" stopColor="#0d0c12" />
        </linearGradient>
        <linearGradient id="pt-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2934" />
          <stop offset="1" stopColor="#0b0a10" />
        </linearGradient>
        <linearGradient id="pt-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c4b5fd" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#c4b5fd" stopOpacity="0" />
          <stop offset="1" stopColor="#e9e4ff" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect width="200" height="170" fill="url(#pt-bg)" />
      <path d="M18 170 C 26 132, 58 116, 82 112 L 118 112 C 142 116, 174 132, 182 170 Z" fill="url(#pt-body)" />
      <path d="M18 170 C 26 132, 58 116, 82 112 M118 112 C 142 116, 174 132, 182 170" fill="none" stroke="url(#pt-rim)" strokeWidth="1.2" />
      <path d="M86 92 L 84 118 Q 100 126 116 118 L 114 92 Z" fill="#14131a" />
      {[98, 104, 110].map((y) => (
        <path key={y} d={`M86 ${y} Q 100 ${y + 5} 114 ${y}`} fill="none" stroke="#3d3b4c" strokeWidth="1.4" />
      ))}
      <path d="M100 26 C 124 26, 133 46, 132 66 C 131 84, 120 100, 100 102 C 80 100, 69 84, 68 66 C 67 46, 76 26, 100 26 Z" fill="url(#pt-skin)" />
      <path d="M100 26 C 124 26, 133 46, 132 66 C 131 84, 120 100, 100 102" fill="none" stroke="#ddd6fe" strokeOpacity="0.55" strokeWidth="1.1" />
      <path d="M100 26 C 76 26, 67 46, 68 66" fill="none" stroke="#ddd6fe" strokeOpacity="0.35" strokeWidth="1" />
      <ellipse cx="118" cy="56" rx="7" ry="16" fill="#e9e4ff" opacity="0.08" />
      <path d="M78 66 Q 100 74 122 66" stroke="#09080d" strokeOpacity="0.5" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
