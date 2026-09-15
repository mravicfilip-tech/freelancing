/**
 * The product drawings, in the empty-state art's hand: a 64 grid, a round
 * 1.6px stroke that does not scale with the drawing, and the site's dashed
 * rail for whatever is not there yet.
 */
const art = {
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  vectorEffect: 'non-scaling-stroke',
} as const;
const ns = { vectorEffect: 'non-scaling-stroke' } as const;

/** Three candles and the line a perpetual runs on. */
export const MarketsArt = () => (
  <svg {...art} className="phero__draw" aria-hidden="true">
    <path {...ns} d="M8 52h48" />
    <path {...ns} d="M18 22v6M18 40v6" />
    <rect {...ns} x="14" y="28" width="8" height="12" rx="1.5" />
    <path {...ns} d="M32 14v4M32 34v6" />
    <rect {...ns} x="28" y="18" width="8" height="16" rx="1.5" />
    <path {...ns} d="M46 24v4M46 42v4" />
    <rect {...ns} x="42" y="28" width="8" height="14" rx="1.5" />
    <path {...ns} d="M10 44 24 32l10 6 12-16 6 2" strokeDasharray="4 4" opacity=".55" />
    <path {...ns} d="M48 20h6v6" />
  </svg>
);

/** A vault whose door has not been fitted yet. */
export const EarnArt = () => (
  <svg {...art} className="phero__draw" aria-hidden="true">
    <rect {...ns} x="10" y="10" width="44" height="40" rx="7" />
    <path {...ns} d="M16 50v5M48 50v5" />
    <circle {...ns} cx="30" cy="30" r="10" strokeDasharray="4 4" opacity=".55" />
    <circle {...ns} cx="30" cy="30" r="3" />
    <path {...ns} d="M30 20v3M30 37v3M20 30h3M37 30h3" />
    <path {...ns} d="M47 22v16" />
    <path {...ns} d="M44 27h6M44 33h6" />
  </svg>
);

/** A coin on the way into a bank. */
export const PayFiArt = () => (
  <svg {...art} className="phero__draw" aria-hidden="true">
    <circle {...ns} cx="16" cy="32" r="9" />
    <path {...ns} d="M16 26.5v11M18.6 29a2.6 2.6 0 0 0-5.2 0c0 3 5.2 2 5.2 5a2.6 2.6 0 0 1-5.2 0" />
    <path {...ns} d="M28 32h8" strokeDasharray="4 4" opacity=".55" />
    <path {...ns} d="M33 28.5 37 32l-4 3.5" />
    <path {...ns} d="M40 26 50 20l10 6" />
    <path {...ns} d="M41 26h18" />
    <path {...ns} d="M44 30v12M50 30v12M56 30v12" />
    <path {...ns} d="M40 44h20" />
  </svg>
);

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
