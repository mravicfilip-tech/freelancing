import type { ReactNode } from 'react';

/**
 * Empty-state art. Drawn on a 64 grid at the nav set's 1.6px stroke so it reads
 * as the same hand, and each piece uses the site's dashed rail for the part
 * that is missing — the slot with no tokens, the sale with no code, the friend
 * who has not joined, the order that has not happened.
 */
const art = {
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** An open wallet with an empty card slot. */
export const WalletArt = () => (
  <svg {...art} className="empty__art" aria-hidden="true">
    <path d="M10 22a6 6 0 0 1 6-6h30a4 4 0 0 1 4 4v2" />
    <rect x="10" y="22" width="44" height="28" rx="6" />
    <path d="M54 32h-9a4 4 0 0 0 0 8h9" />
    <path d="M20 33h14" strokeDasharray="4 4" opacity=".55" />
  </svg>
);

/** A price tag with nothing written on it. */
export const TagArt = () => (
  <svg {...art} className="empty__art" aria-hidden="true">
    <path d="M33.4 12H48a4 4 0 0 1 4 4v14.6a4 4 0 0 1-1.17 2.83L33.66 50.6a4 4 0 0 1-5.66 0L13.4 36a4 4 0 0 1 0-5.66l17.17-17.17A4 4 0 0 1 33.4 12Z" />
    <circle cx="42" cy="22" r="3" />
    <path d="M26 32l8 8M32 26l8 8" strokeDasharray="4 4" opacity=".55" />
  </svg>
);

/** One friend joined, the next slot still open. */
export const InviteArt = () => (
  <svg {...art} className="empty__art" aria-hidden="true">
    <circle cx="23" cy="24" r="7" />
    <path d="M11 47a12 12 0 0 1 24 0" />
    <circle cx="45" cy="26" r="6" strokeDasharray="4 4" opacity=".55" />
    <path d="M35 45a10 10 0 0 1 18-4" strokeDasharray="4 4" opacity=".55" />
  </svg>
);

/** A ledger whose rows have not been written yet. */
export const OrdersArt = () => (
  <svg {...art} className="empty__art" aria-hidden="true">
    <rect x="12" y="11" width="40" height="42" rx="6" />
    <path d="M20 22h16" />
    <path d="M20 32h24" strokeDasharray="4 4" opacity=".55" />
    <path d="M20 42h18" strokeDasharray="4 4" opacity=".55" />
  </svg>
);

export function EmptyState({
  art: Art,
  title,
  body,
  children,
  tight,
}: {
  art: () => ReactNode;
  title: string;
  body: string;
  /** The one action that resolves the emptiness, if there is one. */
  children?: ReactNode;
  /** Inside a side panel, where the card's own padding already gives room. */
  tight?: boolean;
}) {
  return (
    <div className="empty" data-tight={tight || undefined}>
      <Art />
      <h3 className="empty__title">{title}</h3>
      <p className="empty__body">{body}</p>
      {children}
    </div>
  );
}
