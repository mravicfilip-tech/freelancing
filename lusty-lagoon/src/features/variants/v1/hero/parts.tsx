import type { CSSProperties } from 'react';
import { Fire } from '@phosphor-icons/react';
import { DAILY_CHEST, LIVE_WINS, ONLINE_NOW } from '../../shared/data';
import { gameById } from '../../../../data/games';
import { coinById } from '../../../../data/wallet';
import { formatAmount } from '../../../../lib/format';
import { cn } from '../../../../lib/cn';
import { amountText, CoinIcon, Live, handle } from '../ui';

// The hero's parts. The online pill, the streak pill and Top win today keep the round 7 hero's markup
// (Filip's pick of round 8, "Combo baseline and 3, no slider"). The labels on glass take the lighter
// lilac in hero.css, so they hold AA over the sunset. The art parts follow
// briefs/round-7/art-recipe.md, a figure with its light wrap and rim masked by its own alpha, and sparks.

const TOP = LIVE_WINS[0];

/** The online pill, the live dot, the count and three faces. */
export function OnlinePill({ className }: { className?: string }) {
  return (
    <span className={cn('n1-glass flex h-8 w-max items-center gap-2 rounded-full pl-3 pr-1 text-12 font-bold text-ink', className)}>
      <Live />
      <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span> online now
      <span aria-hidden className="ml-1 flex -space-x-2">
        {['peki', 'alice', 'ficko'].map((a) => (
          <img key={a} src={`/art/avatars/${a}.webp`} alt="" className="h-6 w-6 rounded-full border-2 border-[#1E1446] object-cover" />
        ))}
      </span>
    </span>
  );
}

/** The streak pill, low by her feet. */
export function StreakPill({ className }: { className?: string }) {
  return (
    <span className={cn('n1-glass flex h-8 w-max items-center gap-2 whitespace-nowrap rounded-full pl-2 pr-3 text-12 font-extrabold uppercase tracking-[0.06em] text-ink', className)}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(180deg,#FF9A4A,#F2620C)] text-[#2A1200]">
        <Fire weight="fill" className="h-[12px] w-[12px]" aria-hidden />
      </span>
      <span className="num">{DAILY_CHEST.streak}</span> day streak
    </span>
  );
}

/** Top win today, Snegbet's prize card on glass. Wide is the row card under the key below 1920. */
export function TopWin({ onPlay, wide, className }: { onPlay: () => void; wide?: boolean; className?: string }) {
  const game = gameById(TOP.gameId)!;
  const coin = coinById(TOP.coin);
  const label = (
    <span className="flex items-center justify-between gap-3">
      <span className="n1-label h8-label">Top win today</span>
      <span className="flex items-center gap-2 text-12 font-semibold text-[rgb(var(--n-muted))]">
        <Live />
        {TOP.ago} ago
      </span>
    </span>
  );
  const cover = (
    <span className={cn('relative shrink-0 overflow-hidden rounded-[12px]', wide ? 'h-[72px] w-[54px] rounded-[10px]' : 'h-[120px] w-[90px]')}>
      <img src={game.image} alt="" className="n1-zoom h-full w-full object-cover" />
      <span aria-hidden className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]" />
    </span>
  );
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Top win today, ${handle(TOP.player)} won ${amountText(TOP.coin, TOP.amount)} ${coin.symbol} on ${game.name}. Play it`}
      className={cn('n1-glass n1-ring h8-win group rounded-[20px] text-left', wide && 'rounded-[16px]', className)}
    >
      {wide ? (
        <>
          {cover}
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            {label}
            <span className="flex items-center gap-3">
              <span className="num flex items-center gap-2 text-28 font-extrabold leading-[32px] tracking-[-0.02em] text-ink">
                <CoinIcon id={TOP.coin} size={24} />
                {amountText(TOP.coin, TOP.amount)}
              </span>
              <span className="flex min-w-0 flex-col text-12 font-semibold leading-4">
                <span className="flex items-center gap-1 truncate text-ink">
                  <img src={TOP.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                  {handle(TOP.player)}
                </span>
                <span className="truncate text-[rgb(var(--n-muted))]">
                  {coin.symbol} on {game.short ?? game.name}
                </span>
              </span>
            </span>
          </span>
        </>
      ) : (
        <>
          {label}
          <span className="flex items-center gap-4">
            {cover}
            <span className="flex min-w-0 flex-col gap-1">
              <span className="flex items-center gap-2 text-14 font-bold text-ink">
                <img src={TOP.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                {handle(TOP.player)}
              </span>
              <span className="num flex items-center gap-2 text-40 font-extrabold leading-[44px] tracking-[-0.02em] text-ink">
                <CoinIcon id={TOP.coin} size={32} />
                {amountText(TOP.coin, TOP.amount)}
              </span>
              <span className="truncate text-12 font-semibold text-[rgb(var(--n-muted))]">
                {coin.symbol} on {game.short ?? game.name}
              </span>
              <span className="num text-12 font-semibold text-[rgb(var(--n-muted))]">About {formatAmount(TOP.amount * coin.rate, 0)} USDT</span>
            </span>
          </span>
        </>
      )}
    </button>
  );
}

/**
 * A character, layers 4 and 5 of the recipe. The cut out, graded toward the scene, a rim of the key
 * light on its lit side, the scene's colour multiplied into its shadow side and the light wrap, the
 * last three masked by its own alpha. w and h are the source pixels, so CSS caps the drawn height at h.
 */
export function Figure({ src, w, h, className }: { src: string; w: number; h: number; className?: string }) {
  return (
    <span aria-hidden className={cn('h8-fig pointer-events-none absolute select-none', className)} style={{ '--src': `url('${src}')`, '--src-h': `${h}px`, aspectRatio: `${w} / ${h}` } as CSSProperties}>
      <span className="h8-rim" />
      <img src={src} alt="" width={w} height={h} className="h8-fig-img" />
      <span className="h8-shade" />
      <span className="h8-wrap" />
    </span>
  );
}

/** Slow sparks drifting up, orange and lilac only. ?still and reduced motion hold them. */
export function Sparks({ items, className }: { items: { x: string; y: string; delay: number; dur: number; lilac?: boolean }[]; className?: string }) {
  return (
    <span aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {items.map((s, i) => (
        <span key={i} className={cn('h8-spark', s.lilac && 'h8-spark-lilac')} style={{ left: s.x, top: s.y, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />
      ))}
    </span>
  );
}
