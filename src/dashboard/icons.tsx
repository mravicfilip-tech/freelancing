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

export const NavIcon = {
  presale: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M14.4 9.4a2.7 2.7 0 0 0-4.6 1.8c0 2.6 4.6 1.4 4.6 3.8a2.7 2.7 0 0 1-4.6 1.6M12 5.6v1.6M12 16.8v1.6" />
    </svg>
  ),
  earn: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M4 17.5 9 11l3.6 3.2L20 6.5" />
      <path d="M15.4 6.5H20v4.6" />
    </svg>
  ),
  markets: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M4.5 19.5v-6M9.5 19.5V8.5M14.5 19.5v-9M19.5 19.5V4.5" />
    </svg>
  ),
  payfi: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M3 10.5h18M6.5 14.5h3" />
    </svg>
  ),
  referrals: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.4a3.2 3.2 0 0 1 0 6M17.6 19a5.6 5.6 0 0 0-2-4.3" />
    </svg>
  ),
  updates: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </svg>
  ),
  claim: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M12 3.5 14.3 8l5 .7-3.6 3.5.9 5-4.6-2.4L7.4 17l.9-5L4.7 8.7l5-.7Z" />
    </svg>
  ),
} as const;

export const ChevronRight = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="m10 6 6 6-6 6" />
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

// ---------- Rank badges ----------

/** A hex plate with a star, tinted bronze for the current rank and silver for the next. */
export function RankBadge({ tone, className }: { tone: 'bronze' | 'silver'; className?: string }) {
  const id = `rank-${tone}`;
  const stops =
    tone === 'bronze'
      ? ['#E8B18A', '#B5714A', '#8A4F2E']
      : ['#F2F4F7', '#C3CAD3', '#8E97A3'];
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={stops[0]} />
          <stop offset="55%" stopColor={stops[1]} />
          <stop offset="100%" stopColor={stops[2]} />
        </linearGradient>
      </defs>
      <path
        d="M24 2.6 42 12.4v23.2L24 45.4 6 35.6V12.4Z"
        fill={`url(#${id})`}
        stroke={stops[2]}
        strokeWidth="1.2"
      />
      <path
        d="M24 8.6 37 15.6v16.8L24 39.4 11 32.4V15.6Z"
        fill="none"
        stroke="rgba(255,255,255,.35)"
        strokeWidth="1"
      />
      <path
        d="m24 16.4 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8Z"
        fill="rgba(255,255,255,.9)"
      />
    </svg>
  );
}
