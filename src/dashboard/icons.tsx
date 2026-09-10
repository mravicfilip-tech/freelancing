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

/**
 * Outline set. One 24 grid, 1.6px stroke, rounded joins — and every glyph's
 * ink centred on y=12 spanning roughly 4 to 20, so the gap between a glyph and
 * its label is the same on every item. Before this they ranged from 10.5px
 * tall (earn) to 17px (claim), which is why Earn sat high in its row.
 */
export const NavIcon = {
  presale: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.4v9.2M14.2 9.7a2.4 2.4 0 0 0-4.4 1.2c0 2.3 4.4 1.3 4.4 3.4a2.4 2.4 0 0 1-4.4 1.2" />
    </svg>
  ),
  earn: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M4 18l5.5-5.5 3.5 3.5L19 6" />
      <path d="M14.2 6H19v4.8" />
    </svg>
  ),
  markets: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M4 4.5v15h16" />
      <path d="M8.4 16.1v-4.6M12.6 16.1V6.3M16.8 16.1V9.1" />
    </svg>
  ),
  payfi: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2.6" />
      <path d="M3 10h18M6.6 14.4h3.4" />
    </svg>
  ),
  referrals: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <circle cx="9.6" cy="8.2" r="3.2" />
      <path d="M3.8 19a5.8 5.8 0 0 1 11.6 0" />
      <path d="M16.6 5.4a3.2 3.2 0 0 1 0 5.6M18 19a5.8 5.8 0 0 0-1.5-3.9" />
    </svg>
  ),
  updates: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <path d="M18 10a6 6 0 1 0-12 0c0 4.2-1.7 5.6-1.7 5.6h15.4S18 14.2 18 10Z" />
      <path d="M10.2 19a2.1 2.1 0 0 0 3.6 0" />
    </svg>
  ),
  claim: (p: IconProps) => (
    <svg {...line} {...p} aria-hidden="true">
      <rect x="4" y="10.6" width="16" height="9.4" rx="1.8" />
      <path d="M3.2 7.2h17.6v3.4H3.2zM12 7.2V20" />
      <path d="M12 7.2S10.9 4 8.9 4a1.8 1.8 0 0 0 0 3.2ZM12 7.2S13.1 4 15.1 4a1.8 1.8 0 0 1 0 3.2Z" />
    </svg>
  ),
} as const;

/**
 * $RTX as a token mark: the brand logo on the indigo, drawn on the same 32 grid
 * and full-bleed circle the official token marks use, so the two sit at one
 * size. The colour is fixed rather than themed, as a token mark is.
 */
export const RtxMark = (p: IconProps) => (
  <svg viewBox="0 0 32 32" {...p} aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="#4042d2" />
    <g transform="translate(6.5 11.1) scale(0.578)" fill="#fff">
      <path d="M8.375 10.1057H8.37305V15.4309C8.37302 16.2813 7.68344 16.9709 6.83301 16.9709H5.06934C4.58429 16.9709 4.12762 16.742 3.83691 16.3538L0.307617 11.6389C0.108284 11.3726 5.94423e-05 11.0487 0 10.7161V10.0413C3.95559e-05 9.19085 0.689618 8.50122 1.54004 8.50122H8.375V10.1057Z" />
      <path d="M4.17532 3.14357L14.1041 15.9261C14.3958 16.3017 14.8447 16.5214 15.3202 16.5214H17.0367C17.8871 16.5214 18.5765 15.832 18.5765 14.9815V8.86801C18.5765 8.5263 18.4629 8.1943 18.2535 7.92429L12.719 0.788522C12.4274 0.412451 11.9782 0.192383 11.5022 0.192383H5.39143C4.54098 0.192383 3.85156 0.881805 3.85156 1.73225V2.19896C3.85156 2.54105 3.96547 2.8734 4.17532 3.14357Z" />
      <path d="M18.3516 7.87219V2.14624C18.3516 1.68975 18.4971 1.24515 18.7671 0.877032C19.1714 0.325716 19.8141 0 20.4978 0H21.2769C21.9602 0 22.6039 0.320107 23.0163 0.864875L32.4099 13.2747C32.6967 13.6537 32.852 14.116 32.852 14.5913V14.6596C32.852 15.1761 32.6575 15.6736 32.3072 16.053C31.9183 16.4744 31.371 16.714 30.7976 16.714H25.7926C25.125 16.714 24.4942 16.4083 24.0805 15.8845L18.821 9.22415C18.5169 8.83911 18.3516 8.36281 18.3516 7.87219Z" />
    </g>
  </svg>
);

export const ArrowUp = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const ChevronDown = (p: IconProps) => (
  <svg {...line} {...p} aria-hidden="true">
    <path d="m6 9.5 6 6 6-6" />
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

/* Both card marks are drawn on the same 32 grid as the token art, circle
   included, so the "We accept" row is one geometry rather than five coins and
   two cards. */
export const VisaMark = (p: IconProps) => (
  <svg viewBox="0 0 32 32" {...p} aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="#1434CB" />
    <text
      x="16"
      y="19.4"
      textAnchor="middle"
      fontFamily="Helvetica, Arial, sans-serif"
      fontSize="9.5"
      fontWeight="700"
      fontStyle="italic"
      fill="#fff"
      letterSpacing="0.2"
    >
      VISA
    </text>
  </svg>
);

/* Mastercard's ground flips with the theme: its brand black vanishes on a dark
   card, and its brand white vanishes on a light one. */
export const MastercardMark = (p: IconProps) => (
  <svg viewBox="0 0 32 32" {...p} aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="var(--d-mark-ground, #16181D)" />
    <circle cx="13" cy="16" r="6.8" fill="#EB001B" />
    <circle cx="19" cy="16" r="6.8" fill="#F79E1B" fillOpacity=".9" />
  </svg>
);
