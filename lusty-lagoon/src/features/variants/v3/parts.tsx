import { useId, type ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import type { TierId } from './games-data';

// The arena's own small parts. Rank badges in gold, silver and bronze, hex tier shields, the section
// head with a tinted icon tile, a live dot and a skeleton in the arena's colours.

/** A square place badge. 1, 2 and 3 take gold, silver and bronze, the rest sit quiet. */
export function RankBadge({ place, size = 36, you, className }: { place: number | string; size?: 28 | 32 | 36 | 44; you?: boolean; className?: string }) {
  const tone = you ? 'a-badge-you' : place === 1 ? 'a-badge-1' : place === 2 ? 'a-badge-2' : place === 3 ? 'a-badge-3' : 'a-badge-n';
  return (
    <span
      className={cn(
        'a-badge',
        tone,
        size === 28 && 'h-[28px] w-[28px] rounded-[8px] text-12',
        size === 32 && 'h-8 w-8 rounded-[8px] text-14',
        size === 36 && 'h-9 w-9 text-14',
        size === 44 && 'h-11 min-w-[44px] px-2 text-16',
        className,
      )}
    >
      {place}
    </span>
  );
}

const SHIELD: Record<TierId, [string, string, string]> = {
  bronze: ['#F3B08A', '#B8653F', '#6E3218'],
  silver: ['#EEF5FA', '#93B3C7', '#4E6B80'],
  gold: ['#FFEC8A', '#DDB012', '#7E5E00'],
  platinum: ['#B2F5FA', '#2FB3C4', '#0F6670'],
  diamond: ['#FFC2E2', '#D9479A', '#7E1A55'],
};

/** A hex tier shield with a star, drawn in the tier's colours so it stays crisp at any size. */
export function TierShield({ tier, size = 20, className, label }: { tier: TierId; size?: number; className?: string; label?: string }) {
  const id = useId().replace(/:/g, '');
  const [hi, lo, rim] = SHIELD[tier];
  return (
    <svg width={size} height={(size * 44) / 40} viewBox="0 0 40 44" className={cn('shrink-0', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
      </defs>
      <path d="M20 1.5 37.5 11.5v21L20 42.5 2.5 32.5v-21Z" fill={rim} />
      <path d="M20 4 35.3 12.8v18.4L20 40 4.7 31.2V12.8Z" fill={`url(#${id}f)`} />
      <path d="M20 4 35.3 12.8v3L20 7 4.7 15.8v-3Z" fill="#fff" opacity="0.35" />
      <path d="m20 13.2 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8Z" fill="#fff" opacity="0.92" />
    </svg>
  );
}

/** A section head. A tinted icon tile, a title at 20 and an optional line under it, controls on the right. */
export function Head({ id, icon, tint, title, sub, children }: { id?: string; icon: ReactNode; tint: string; title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] [&>svg]:h-5 [&>svg]:w-5" style={{ background: `${tint}26`, color: tint, boxShadow: `inset 0 0 0 1px ${tint}40` }}>
          {icon}
        </span>
        <div className="flex flex-col">
          <h2 id={id} className="text-20 font-bold leading-[24px] tracking-[-0.01em] text-ink">
            {title}
          </h2>
          {sub && <p className="a-muted text-14 leading-[20px]">{sub}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Live({ className }: { className?: string }) {
  return <span aria-hidden className={cn('a-live', className)} />;
}

export function Skel({ className }: { className?: string }) {
  return <span aria-hidden className={cn('a-skel block rounded-[12px]', className)} />;
}

/** A player's avatar, or their initials when there is no picture. */
export function Avatar({ src, name, size = 24 }: { src?: string; name: string; size?: 20 | 24 | 28 | 40 }) {
  const cls = cn('shrink-0 rounded-full object-cover', size === 20 && 'h-5 w-5', size === 24 && 'h-6 w-6', size === 28 && 'h-[28px] w-[28px]', size === 40 && 'h-10 w-10');
  if (src) return <img src={src} alt="" className={cls} />;
  const initials = name
    .split(/\s|\./)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span aria-hidden className={cn(cls, 'flex items-center justify-center bg-[#4A2C80] text-12 font-bold text-ink')}>
      {initials}
    </span>
  );
}
