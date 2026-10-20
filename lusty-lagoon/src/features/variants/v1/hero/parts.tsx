import type { CSSProperties, ReactNode } from 'react';
import { Fire, Play } from '@phosphor-icons/react';
import { DAILY_CHEST, LIVE_WINS, ONLINE_NOW } from '../../shared/data';
import { gameById } from '../../../../data/games';
import { coinById } from '../../../../data/wallet';
import { cn } from '../../../../lib/cn';
import { amountText, CoinIcon, Key, Live, handle } from '../ui';

// The parts the three round 8 hero iterations share (note 6, plan part C). Every iteration keeps the
// headline, the line, Play Sugar Rush, the online pill, Top win today and the streak, so they are
// written once here and each iteration only places them. The art parts follow
// briefs/round-7/art-recipe.md, a scene, a figure with its light wrap and rim masked by its own alpha,
// and the haze. Sizes and light come from CSS variables in hero.css, per iteration and per width.

export const TOP = LIVE_WINS[0];
export const TOP_GAME = gameById(TOP.gameId)!;
const TOP_COIN = coinById(TOP.coin);
export const TOP_LABEL = `Top win today, ${handle(TOP.player)} won ${amountText(TOP.coin, TOP.amount)} ${TOP_COIN.symbol} on ${TOP_GAME.name}. Play it`;

/** The headline, the page's one heading style, Bai Jamjuree 700 in sentence case (round 7, note 2). */
export function Headline({ id, as: Tag = 'h1', className, children }: { id?: string; as?: 'h1' | 'h2'; className?: string; children?: ReactNode }) {
  return (
    <Tag id={id} className={cn('h8-head font-display font-bold text-ink', className)}>
      {children ?? (
        <>
          Where luck
          <br />
          meets lust.
        </>
      )}
    </Tag>
  );
}

export function Line({ className, children }: { className?: string; children?: ReactNode }) {
  return <p className={cn('h8-line text-16 font-medium leading-6', className)}>{children ?? 'Spin, win and open a free chest every single day.'}</p>;
}

/** Play Sugar Rush, the v1 orange key with the sheen hover and its mark. */
export function PlayKey({ onPlay, className }: { onPlay: () => void; className?: string }) {
  return (
    <Key tone="orange" size={56} onClick={onPlay} className={cn('h8-key gap-3 pl-8 pr-[10px]', className)}>
      Play {TOP_GAME.short ?? TOP_GAME.name}
      <span className="n1-key-mark h-9 w-9">
        <Play weight="fill" className="h-4 w-4 translate-x-px" aria-hidden />
      </span>
    </Key>
  );
}

/** The online pill, the live dot, the count and three faces. */
export function OnlinePill({ className }: { className?: string }) {
  return (
    <span className={cn('n1-glass flex h-8 w-max items-center gap-2 rounded-full pl-3 pr-1 text-12 font-bold text-ink', className)}>
      <Live />
      <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span> online now
      <Faces />
    </span>
  );
}

export function Faces({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('ml-1 flex -space-x-2', className)}>
      {['peki', 'alice', 'ficko'].map((a) => (
        <img key={a} src={`/art/avatars/${a}.webp`} alt="" className="h-6 w-6 rounded-full border-2 border-[#1E1446] object-cover" />
      ))}
    </span>
  );
}

/** The fire mark, an orange disc with a dark glyph. */
export function FireMark({ size = 20 }: { size?: 20 | 28 }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#FF9A4A,#F2620C)] text-[#2A1200]', size === 20 ? 'h-5 w-5' : 'h-[28px] w-[28px]')}>
      <Fire weight="fill" className={size === 20 ? 'h-[12px] w-[12px]' : 'h-4 w-4'} aria-hidden />
    </span>
  );
}

/** The streak chip, as Base draws it. */
export function StreakChip({ className }: { className?: string }) {
  return (
    <span className={cn('n1-glass flex h-8 w-max items-center gap-2 whitespace-nowrap rounded-full pl-2 pr-3 text-12 font-extrabold uppercase tracking-[0.06em] text-ink', className)}>
      <FireMark />
      <span className="num">{DAILY_CHEST.streak}</span> day streak
    </span>
  );
}

function Cover({ size }: { size: 'sm' | 'md' }) {
  return (
    <span className={cn('relative shrink-0 overflow-hidden', size === 'md' ? 'h-[72px] w-[54px] rounded-[10px]' : 'h-[48px] w-9 rounded-[8px]')}>
      <img src={TOP_GAME.image} alt="" className="n1-zoom h-full w-full object-cover" />
      <span aria-hidden className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]" />
    </span>
  );
}

function Ago() {
  return (
    <span className="flex items-center gap-2 text-12 font-semibold text-[rgb(var(--n-muted))]">
      <Live />
      {TOP.ago} ago
    </span>
  );
}

/**
 * Top win today. Wide is the row card Base shows under the key, cell sits inside a bar with no card of
 * its own, its player and game only when detail is on. Both play the game on click, and the label names
 * the player, the amount and the game.
 */
export function TopWin({ onPlay, layout, detail = true, className }: { onPlay: () => void; layout: 'wide' | 'cell'; detail?: boolean; className?: string }) {
  const amount = (
    <span className={cn('num flex items-center gap-2 font-extrabold tracking-[-0.02em] text-ink', layout === 'wide' ? 'text-28 leading-[32px]' : 'text-20 leading-7')}>
      <CoinIcon id={TOP.coin} size={layout === 'wide' ? 24 : 20} />
      {amountText(TOP.coin, TOP.amount)}
    </span>
  );
  const who = (
    <span className="flex min-w-0 flex-col text-12 font-semibold leading-4">
      <span className="flex items-center gap-1 truncate text-ink">
        <img src={TOP.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
        {handle(TOP.player)}
      </span>
      <span className="truncate text-[rgb(var(--n-muted))]">
        {TOP_COIN.symbol} on {TOP_GAME.short ?? TOP_GAME.name}
      </span>
    </span>
  );
  if (layout === 'wide') {
    return (
      <button type="button" onClick={onPlay} aria-label={TOP_LABEL} className={cn('n1-glass n1-ring group flex items-center gap-4 rounded-[16px] p-3 pr-4 text-left', className)}>
        <Cover size="md" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center justify-between gap-3">
            <span className="n1-label h8-label">Top win today</span>
            <Ago />
          </span>
          <span className="flex items-center gap-3">
            {amount}
            {who}
          </span>
        </span>
      </button>
    );
  }
  return (
    <button type="button" onClick={onPlay} aria-label={TOP_LABEL} className={cn('n1-ring group flex min-w-0 items-center gap-3 rounded-[12px] text-left', className)}>
      <Cover size="sm" />
      <span className="flex min-w-0 flex-col gap-[2px]">
        <span className="n1-label h8-label">Top win today</span>
        <span className="flex min-w-0 items-center gap-3">
          {amount}
          {detail && (
            <span className="hidden min-w-0 truncate text-12 font-semibold text-[rgb(var(--n-muted))] w1440:block">
              {handle(TOP.player)} on {TOP_GAME.short ?? TOP_GAME.name}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

/**
 * One illustrated scene from public/art, layer 1 of the recipe. Its size and place come from
 * --sw, --sh, --sx and --sy on the iteration, so it is never drawn past its source pixels, and the
 * wrapper grades and blurs it.
 */
export function Scene({ src, className, flip }: { src: string; className?: string; flip?: boolean }) {
  return (
    <span aria-hidden className={cn('h8-scene pointer-events-none absolute select-none', className)}>
      <img src={src} alt="" className={cn('h8-scene-img', flip && 'h8-flip')} />
    </span>
  );
}

/**
 * A character or prop, layers 4 and 5 of the recipe. The cut out, graded toward the scene, a rim of the
 * key light on its lit side, the scene's colour multiplied into its shadow side and the light wrap, the
 * last three masked by its own alpha. w and h are the source pixels, so CSS can cap the drawn height
 * at h. Flip mirrors the whole stack, so the light on the source turns to face the scene's light.
 */
export function Figure({ src, w, h, className, flip, style }: { src: string; w: number; h: number; className?: string; flip?: boolean; style?: CSSProperties }) {
  return (
    <span aria-hidden className={cn('h8-fig pointer-events-none absolute select-none', className)} style={{ '--src': `url('${src}')`, '--src-h': `${h}px`, aspectRatio: `${w} / ${h}`, ...style } as CSSProperties}>
      <span className={cn('h8-fig-stack', flip && 'h8-flip')}>
        <span className="h8-rim" />
        <img src={src} alt="" width={w} height={h} className="h8-fig-img" />
        <span className="h8-shade" />
        <span className="h8-wrap" />
      </span>
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
