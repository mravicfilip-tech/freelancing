import type { CSSProperties } from 'react';
import { Fire, Play } from '@phosphor-icons/react';
import { DAILY_CHEST, LIVE_WINS, ONLINE_NOW } from '../shared/data';
import { gameById } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { amountText, CoinIcon, Key, Live, handle } from './ui';

// The hero, round 7 art (note 1, plan line G). The woman stands inside the night casino courtyard,
// built on briefs/round-7/art-recipe.md back to front. The scene, graded purple and out of focus,
// the lamp light behind her, a floor shadow, the woman graded toward the scene, a light wrap masked by
// her own alpha with a warm rim on the lit side, the flower pillars in front of her, the haze band at
// her crop, and the vignette that keeps the headline side calm. The display headline, the orange key
// and the top win card stay where round 6 put them. --bx is her centre, --by her shoulders.

const TOP = LIVE_WINS[0];

/** The two flower pillars, placed from her centre. The left one crosses her hair, the right one her hip. */
const PILLARS = [
  { src: '/art/landing/pillar-flowers-left.webp', className: 'bottom-[-24px] left-[calc(var(--bx)-182px)] w1920:bottom-[-28px] w1920:left-[calc(var(--bx)-216px)]' },
  { src: '/art/landing/pillar-flowers-right.webp', className: 'bottom-[-24px] left-[calc(var(--bx)+98px)] w1920:bottom-[-28px] w1920:left-[calc(var(--bx)+96px)]' },
];

/** Sparks round her, x from her centre in px, y as a share of the hero height. Orange and lilac only. */
const SPARKS: { x: number; y: number; delay: number; dur: number; tone?: 'lilac' }[] = [
  { x: -196, y: 30, delay: 0, dur: 14 },
  { x: -120, y: 62, delay: -5, dur: 17, tone: 'lilac' },
  { x: 150, y: 24, delay: -9, dur: 15 },
  { x: 212, y: 56, delay: -3, dur: 19, tone: 'lilac' },
  { x: 92, y: 78, delay: -11, dur: 16 },
  { x: -64, y: 16, delay: -7, dur: 18 },
];

/** Top win today, Snegbet's prize card on glass. Wide is the row under the key below 1920. */
function TopWin({ onPlay, wide, className }: { onPlay: () => void; wide?: boolean; className?: string }) {
  const game = gameById(TOP.gameId)!;
  const coin = coinById(TOP.coin);
  const label = (
    <span className="flex items-center justify-between gap-3">
      <span className="n1-label text-[rgb(var(--n-muted))]">Top win today</span>
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
      className={cn('n1-glass n1-ring group rounded-[20px] text-left', wide && 'rounded-[16px]', className)}
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
              <span className="num text-12 font-semibold text-[rgb(var(--n-dim))]">About {formatAmount(TOP.amount * coin.rate, 0)} USDT</span>
            </span>
          </span>
        </>
      )}
    </button>
  );
}

export function Hero({ onPlay }: { onPlay: () => void }) {
  const game = gameById(TOP.gameId)!;
  return (
    <section
      aria-labelledby="n1-hero-title"
      className="n1-hero relative isolate h-[464px] overflow-hidden rounded-[20px] [--bx:602px] [--by:36%] w1920:h-[540px] w1920:[--bx:672px] w1920:[--by:35%]"
    >
      {/* 1. The scene, the night casino courtyard, 1400 by 1400, never drawn past its source size. It
          covers the hero up to 1920. Wider, it ends under the middle of the top win card and a mirrored
          copy carries it to the edge, and the wrapper blurs both as one picture, so the join never shows. */}
      <div aria-hidden className="n1-scene pointer-events-none absolute inset-0 -z-50 select-none">
        <img src="/art/landing/casino-courtyard.webp" alt="" className="n1-scene-img absolute left-[var(--sx)] top-0 h-full w-full max-w-[1400px]" />
        <img src="/art/landing/casino-courtyard.webp" alt="" className="n1-scene-img n1-scene-mirror absolute left-[calc(var(--sx)+1400px)] top-0 h-full w-[1400px] max-w-none" />
      </div>
      {/* The grade into the hero's purple, then the vignette that calms the headline side. */}
      <span aria-hidden className="n1-grade pointer-events-none absolute inset-0 -z-40" />
      <span aria-hidden className="n1-vignette pointer-events-none absolute inset-0 -z-40" />

      {/* 2 and 3. The lamp light from the terrace behind her, the purple haze it hangs in, and the
          shadow on the floor where she stands. */}
      <span aria-hidden className="n1-lamp pointer-events-none absolute left-[calc(var(--bx)-150px)] top-[var(--by)] -z-30 h-[520px] w-[640px] -translate-x-1/2 -translate-y-1/2 w1920:h-[620px] w1920:w-[760px]" />
      <span aria-hidden className="n1-contact pointer-events-none absolute bottom-[-48px] left-[var(--bx)] -z-30 h-[120px] w-[360px] -translate-x-1/2 w1920:w-[420px]" />

      {/* 4 and 5. The woman, 618 by 1036, drawn at most 516 tall, graded toward the scene, with the
          light wrap masked by her own alpha laid over her. */}
      <span aria-hidden className="n1-figure pointer-events-none absolute bottom-0 left-[calc(var(--bx)-132px)] -z-20 h-[444px] w-[265px] select-none w1920:left-[calc(var(--bx)-154px)] w1920:h-[516px] w1920:w-[308px]">
        <span className="n1-rim absolute inset-0" />
        <img src="/art/landing/girl-offshoulder.webp" alt="" className="n1-woman absolute inset-0 h-full w-full max-w-none" />
        <span className="n1-wrap n1-shade absolute inset-0" />
        <span className="n1-wrap absolute inset-0" />
      </span>

      {/* 6. The flower pillars, 282 by 853, in front of her and crossing her edges, darker, shaded into
          the scene's purple and a little soft, so they read nearer. */}
      {PILLARS.map((p) => (
        <span key={p.src} aria-hidden className={cn('n1-pillar pointer-events-none absolute -z-10 aspect-[282/853] h-[300px] select-none w1920:h-[372px]', p.className)} style={{ '--src': `url('${p.src}')` } as CSSProperties}>
          <img src={p.src} alt="" className="absolute inset-0 h-full w-full max-w-none" />
          <span className="n1-pillar-shade absolute inset-0" />
        </span>
      ))}

      {/* The haze band low in the frame, across her crop and the pillar feet, so no hard edge shows. */}
      <span aria-hidden className="n1-haze pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[140px] w1920:h-[160px]" />

      {/* 8. A few slow sparks in front of her. ?still and reduced motion hold them. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {SPARKS.map((s, i) => (
          <span key={i} className={cn('n1-spark', s.tone === 'lilac' && 'n1-spark-lilac')} style={{ left: `calc(var(--bx) + ${s.x}px)`, top: `${s.y}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />
        ))}
      </span>

      <span className="n1-glass absolute bottom-6 left-[var(--bx)] z-10 flex h-8 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full pl-2 pr-3 text-12 font-extrabold uppercase tracking-[0.06em] text-ink">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(180deg,#FF9A4A,#F2620C)] text-[#2A1200]">
          <Fire weight="fill" className="h-[12px] w-[12px]" aria-hidden />
        </span>
        <span className="num">{DAILY_CHEST.streak}</span> day streak
      </span>

      {/* Top win today on the burst's right from 1920, Snegbet's prize card on glass. */}
      <TopWin onPlay={onPlay} className="absolute right-12 top-1/2 z-10 hidden w-[320px] -translate-y-1/2 flex-col gap-4 p-6 w1920:flex" />

      <div className="relative z-10 flex h-full w-[440px] flex-col justify-center gap-6 px-[40px] w1920:w-[600px] w1920:gap-12 w1920:px-12">
        <div className="flex flex-col items-start gap-6">
          <span className="n1-glass flex h-8 items-center gap-2 rounded-full pl-3 pr-1 text-12 font-bold text-ink">
            <Live />
            <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span> online now
            <span aria-hidden className="ml-1 flex -space-x-2">
              {['peki', 'alice', 'ficko'].map((a) => (
                <img key={a} src={`/art/avatars/${a}.webp`} alt="" className="h-6 w-6 rounded-full border-2 border-[#1E1446] object-cover" />
              ))}
            </span>
          </span>
          <div className="flex flex-col gap-4">
            {/* The page's one heading style, Bai Jamjuree 700 in sentence case (round 7, note 2). */}
            <h1 id="n1-hero-title" className="font-display text-[56px] font-bold leading-[56px] tracking-[-0.01em] text-ink">
              Where luck
              <br />
              meets lust.
            </h1>
            <p className="max-w-[360px] text-16 font-medium leading-6 text-[rgb(var(--n-muted))]">Spin, win and open a free chest every single day.</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-6">
          <Key tone="orange" size={56} onClick={onPlay} className="gap-3 pl-8 pr-[10px]">
            Play {game.short ?? game.name}
            <span className="n1-key-mark h-9 w-9">
              <Play weight="fill" className="h-4 w-4 translate-x-px" aria-hidden />
            </span>
          </Key>
          {/* Below 1920 the top win sits under the key, a wide card, so it never covers her. */}
          <TopWin onPlay={onPlay} wide className="flex w-full items-center gap-4 p-3 pr-4 w1920:hidden" />
        </div>
      </div>
    </section>
  );
}
