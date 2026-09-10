/**
 * Inline SVG so the rail and the tables carry no network cost and every glyph
 * inherits `currentColor`. Token marks keep their own brand colour; everything
 * else is a 1.6px line icon drawn on a 24px grid.
 */
import type { TokenId } from './data';
import { TOKEN_ART } from './tokenArt';

type IconProps = { className?: string };

const line = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

// ---------- Navigation ----------

/** Outline set: one 24 grid, 1.6px stroke, rounded joins. */
export const NavIcon = {
  presale: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2v9.6M14.4 9.6a2.6 2.6 0 0 0-4.8 1.3c0 2.5 4.8 1.4 4.8 3.7a2.6 2.6 0 0 1-4.8 1.2" />
    </svg>
  ),
  earn: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M3.5 16.5 9 10.8l3.5 3.3L20.5 6" />
      <path d="M15.6 6h4.9v4.9" />
    </svg>
  ),
  markets: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8.5 16.5v-4M13 16.5V8M17.5 16.5v-6" />
    </svg>
  ),
  payfi: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2.8" />
      <path d="M2.8 10h18.4" />
      <path d="M6.6 14.4h3.2" />
    </svg>
  ),
  referrals: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <circle cx="9.6" cy="8.4" r="3.2" />
      <path d="M3.6 19.2a6 6 0 0 1 12 0" />
      <path d="M16.8 5.6a3.2 3.2 0 0 1 0 5.8M18.2 19.2a6 6 0 0 0-1.6-4.1" />
    </svg>
  ),
  updates: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M18.2 9.4a6.2 6.2 0 1 0-12.4 0c0 4.4-1.8 5.8-1.8 5.8h16s-1.8-1.4-1.8-5.8Z" />
      <path d="M10.2 18.6a2.1 2.1 0 0 0 3.6 0" />
    </svg>
  ),
  claim: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <rect x="3.4" y="10.6" width="17.2" height="9.4" rx="2" />
      <path d="M2.6 7h18.8v3.6H2.6zM12 7v13" />
      <path d="M12 7S10.8 3.6 8.6 3.6a2 2 0 0 0 0 3.4ZM12 7s1.2-3.4 3.4-3.4a2 2 0 0 1 0 3.4Z" />
    </svg>
  ),
} as const;

export const ChevronRight = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="m10 6 6 6-6 6" />
  </svg>
);

export const ArrowOut = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="M8 16 16 8M9.4 8H16v6.6" />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const RocketIcon = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="M12 3.4c2.8 2.2 4.2 5.3 4.2 8.8L12 15.4 7.8 12.2c0-3.5 1.4-6.6 4.2-8.8Z" />
    <circle cx="12" cy="9.4" r="1.6" />
    <path d="M7.8 12.4 5.9 16.4l3-1.3M16.2 12.4l1.9 4-3-1.3" />
    <path d="M10.7 17.4c.5 1.3 1.3 2.4 1.3 2.4s.8-1.1 1.3-2.4" />
  </svg>
);

export const SunIcon = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
);

export const MoonIcon = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" />
  </svg>
);

export const RailIcon = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M10 4.5v15" />
  </svg>
);

// ---------- Payment marks ----------

export function PayMark({ id, className }: { id: TokenId | 'CARD'; className?: string }) {
  if (id === 'CARD') {
    return (
      <svg {...line} className={className} aria-hidden="true">
        <rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2.8" />
        <path d="M2.8 10h18.4M6.6 14.4h3.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {TOKEN_ART[id]}
    </svg>
  );
}

export const VisaMark = (p: IconProps) => (
  <svg viewBox="0 0 48 24" {...p} aria-hidden="true">
    <rect width="48" height="24" rx="4" fill="#1434CB" />
    <text
      x="24"
      y="16.6"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fontStyle="italic"
      fill="#fff"
      letterSpacing="0.5"
    >
      VISA
    </text>
  </svg>
);

export const MastercardMark = (p: IconProps) => (
  <svg viewBox="0 0 48 24" {...p} aria-hidden="true">
    <rect width="48" height="24" rx="4" fill="#16181D" />
    <circle cx="20" cy="12" r="7" fill="#EB001B" />
    <circle cx="28" cy="12" r="7" fill="#F79E1B" fillOpacity=".9" />
  </svg>
);
