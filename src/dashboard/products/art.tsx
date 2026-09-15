/** The feature rows' glyphs, on the nav set's 24 grid. */
/* ---------- Small glyphs for the feature rows, on the nav set's 24 grid ---------- */
const g = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const SpotGlyph = () => (
  <svg {...g} aria-hidden="true"><path d="M4 8h13M14 4.5 17.5 8 14 11.5" /><path d="M20 16H7M10 12.5 6.5 16l3.5 3.5" /></svg>
);
export const WalletGlyph = () => (
  <svg {...g} aria-hidden="true"><path d="M4 8a2.5 2.5 0 0 1 2.5-2.5H17a1.5 1.5 0 0 1 1.5 1.5v1" /><rect x="4" y="8" width="16" height="11" rx="2.5" /><path d="M20 12h-3.5a1.5 1.5 0 0 0 0 3H20" /></svg>
);
export const PositionsGlyph = () => (
  <svg {...g} aria-hidden="true"><rect x="4" y="4.5" width="16" height="15" rx="2.5" /><path d="M8 9.5h8M8 13h5M8 16.5h3" /><path d="m14.5 15.5 1.4 1.4 2.6-2.8" /></svg>
);
