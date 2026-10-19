import { Fire, Play } from '@phosphor-icons/react';
import { DAILY_CHEST, LIVE_WINS, ONLINE_NOW } from '../shared/data';
import { gameById } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { amountText, CoinIcon, Key, Live, handle } from './ui';

// The hero, round 6. A deep, less saturated purple with one lit area, the burst behind the woman
// (notes 10 and 15). A different woman over the lagoon night scene, between the two flower pillars
// (note 14). The display headline, the orange key, and the top win as a bigger glass card on the
// right (note 16). --bx is her centre, --by her shoulders, so the burst always sits behind her.

const TOP = LIVE_WINS[0];

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
      {/* The lagoon night scene, toned into the hero's purple. 1536 by 768, drawn at most 1272 wide. */}
      <img src="/art/kit/neon-casino.webp" alt="" className="n1-scene pointer-events-none absolute inset-0 -z-30 h-full w-full select-none object-cover object-[60%_40%]" />

      {/* The one lit area. The core, the rays turning slowly, the orange floor light. */}
      <span aria-hidden className="n1-core pointer-events-none absolute left-[var(--bx)] top-[var(--by)] -z-20 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 w1920:h-[760px] w1920:w-[760px]" />
      <span aria-hidden className="n1-rays pointer-events-none absolute left-[var(--bx)] top-[var(--by)] -z-10 h-[900px] w-[900px] w1920:h-[1100px] w1920:w-[1100px]" />
      <span aria-hidden className="n1-floor pointer-events-none absolute bottom-[-80px] left-[var(--bx)] -z-10 h-[200px] w-[520px] -translate-x-1/2 w1920:w-[640px]" />

      {/* The flower pillars, 282 by 853, a step behind her. */}
      <img src="/art/landing/pillar-flowers-left.webp" alt="" className="n1-pillar pointer-events-none absolute bottom-[-24px] left-[calc(var(--bx)-182px)] h-[300px] w-auto max-w-none select-none w1920:bottom-[-28px] w1920:left-[calc(var(--bx)-216px)] w1920:h-[372px]" />
      <img src="/art/landing/pillar-flowers-right.webp" alt="" className="n1-pillar pointer-events-none absolute bottom-[-24px] left-[calc(var(--bx)+98px)] h-[300px] w-auto max-w-none select-none w1920:bottom-[-28px] w1920:left-[calc(var(--bx)+96px)] w1920:h-[372px]" />

      {/* The woman, 618 by 1036, whole, her crown 20px under the frame. Drawn at most 516 tall. */}
      <img
        src="/art/landing/girl-offshoulder.webp"
        alt=""
        className="n1-woman pointer-events-none absolute bottom-0 left-[calc(var(--bx)-132px)] h-[444px] w-[265px] max-w-none select-none w1920:left-[calc(var(--bx)-154px)] w1920:h-[516px] w1920:w-[308px]"
      />
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
