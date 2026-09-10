/**
 * Inline SVG so the rail and the tables carry no network cost and every glyph
 * inherits `currentColor`. Token marks keep their own brand colour; everything
 * else is a 1.6px line icon drawn on a 24px grid.
 */
import type { ReactElement } from 'react';
import type { TokenId } from './data';

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

/** A coin on edge: the token has no brand mark, so it gets a drawn one that
 *  matches the nav set rather than a gold chip that matches nothing. */
export const CoinIcon = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="5.9" opacity=".55" />
    <path d="M12 8.6v6.8M13.7 10.2a1.9 1.9 0 0 0-3.4.9c0 1.8 3.4 1 3.4 2.6a1.9 1.9 0 0 1-3.4.9" />
  </svg>
);

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

const TOKEN_ART: Record<TokenId | 'CARD', { bg: string; fg: string; glyph: ReactElement }> = {
  BTC: {
    bg: '#F7931A',
    fg: '#fff',
    glyph: (
      <text x="12" y="16.4" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
        ₿
      </text>
    ),
  },
  ETH: {
    bg: '#627EEA',
    fg: '#fff',
    glyph: (
      /* The faceted diamond: grey-on-grey loses its shape at 22px, so the mark
         carries its own blue ground. */
      <g fill="#fff">
        <path d="M12 3.6 12 9.9 17.2 12.3Z" opacity=".55" />
        <path d="M12 3.6 6.8 12.3 12 9.9Z" opacity=".85" />
        <path d="M12 16.1 12 20.4 17.2 13.3Z" opacity=".55" />
        <path d="M12 20.4 12 16.1 6.8 13.3Z" opacity=".85" />
        <path d="M12 15.1 17.2 12.3 12 9.9Z" opacity=".35" />
        <path d="M6.8 12.3 12 15.1 12 9.9Z" opacity=".55" />
      </g>
    ),
  },
  USDT: {
    bg: '#26A17B',
    fg: '#fff',
    glyph: (
      <text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
        T
      </text>
    ),
  },
  USDC: {
    bg: '#2775CA',
    fg: '#fff',
    glyph: (
      <text x="12" y="16.2" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">
        $
      </text>
    ),
  },
  SOL: {
    bg: '#12121A',
    fg: '#9945FF',
    glyph: (
      <g>
        <path d="M8.8 7.2h9L15.2 9.9H6.2Z" fill="#9945FF" />
        <path d="M6.2 10.7h9l2.6 2.7h-9Z" fill="#19B6F5" />
        <path d="M8.8 14.2h9l-2.6 2.7H6.2Z" fill="#14F195" />
      </g>
    ),
  },
  BNB: {
    bg: '#F3BA2F',
    fg: '#fff',
    glyph: (
      <g fill="#fff">
        <path d="m12 6.6 1.7 1.8L12 10.2 10.3 8.4Z" />
        <path d="m8.6 10 1.7 1.8-1.7 1.8L6.9 11.8Z" />
        <path d="m15.4 10 1.7 1.8-1.7 1.8-1.7-1.8Z" />
        <path d="m12 13.4 1.7 1.8L12 17l-1.7-1.8Z" />
      </g>
    ),
  },
  CARD: {
    bg: 'transparent',
    fg: 'currentColor',
    glyph: (
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <rect x="4" y="7" width="16" height="10" rx="2.2" />
        <path d="M4 10.6h16" />
      </g>
    ),
  },
};

export function PayMark({ id, className }: { id: TokenId | 'CARD'; className?: string }) {
  const art = TOKEN_ART[id];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {art.bg !== 'transparent' && <circle cx="12" cy="12" r="11" fill={art.bg} />}
      {art.glyph}
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
