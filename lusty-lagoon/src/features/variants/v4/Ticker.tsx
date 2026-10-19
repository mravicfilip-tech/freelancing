import { useEffect, useMemo, useRef, useState } from 'react';
import { CaretLeft, CaretRight, WarningCircle } from '@phosphor-icons/react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { LIVE_WINS, ONLINE_NOW } from '../shared/data';
import { WRAP } from './TopBar4';

const arrow = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-ink hover:border-accent';

// The live wins ticker. One strip under the nav, a cover, the player and the win. It drifts slowly,
// stops under the pointer and on keyboard focus, and the arrows move it a few wins at a time.
// ?still and reduced motion keep it parked.
export function Ticker({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const wins = useMemo(() => LIVE_WINS.map((w) => ({ ...w, game: gameById(w.gameId)! })), []);
  const scroller = useRef<HTMLDivElement>(null);
  const holdUntil = useRef(0);
  const [hover, setHover] = useState(false);
  const loading = state === 'loading';
  const paused = state === 'error';

  const still = useMemo(() => new URLSearchParams(window.location.search).has('still') || window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el || still || hover || loading || paused) return;
    let raf = 0;
    let last = performance.now();
    let pos = el.scrollLeft;
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      if (t > holdUntil.current) {
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
        pos += dt * 0.035;
        const half = el.scrollWidth / 2;
        if (pos >= half) pos -= half;
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [still, hover, loading, paused]);

  const move = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    holdUntil.current = performance.now() + 1400;
    const half = el.scrollWidth / 2;
    if (dir < 0 && el.scrollLeft < 8) el.scrollLeft += half;
    el.scrollBy({ left: dir * 480, behavior: 'smooth' });
  };

  // The first copy is the real list, the second only fills the loop and stays out of the tab order.
  const row = (copy: 0 | 1) =>
    wins.map((w) => {
      const coin = coinById(w.coin);
      return (
        <li key={`${copy}-${w.id}`} className="shrink-0 border-r border-line/70 pr-6">
          <button
            type="button"
            tabIndex={copy ? -1 : 0}
            aria-hidden={copy ? true : undefined}
            onClick={() => onPlay(w.game)}
            aria-label={`${w.player} won ${formatAmount(w.amount, Number.isInteger(w.amount) ? 0 : 2)} ${coin.symbol} on ${w.game.name}, ${w.ago} ago. Open the game`}
            className="group flex items-center gap-3 rounded-lg py-2 pr-1 text-left"
          >
            <img src={w.game.image} alt="" loading="lazy" className="h-[48px] w-9 rounded-md object-cover ring-1 ring-line group-hover:ring-gold" />
            <span className="flex flex-col gap-0.5">
              <span className="flex items-baseline gap-2">
                <span className="text-14 font-semibold text-ink">{w.player}</span>
                <span className="text-12 text-ink3">{w.ago} ago</span>
              </span>
              <span className="flex items-center gap-2">
                <img src={coin.icon} alt="" width={16} height={16} className="rounded-full" />
                <span className="num font-display text-14 font-bold text-win">
                  {formatAmount(w.amount, Number.isInteger(w.amount) ? 0 : 2)} {coin.symbol}
                </span>
              </span>
            </span>
          </button>
        </li>
      );
    });

  return (
    <section aria-label="Live wins" className="border-b border-line bg-sunken">
      <div className={cn(WRAP, 'flex h-[72px] items-center gap-6')}>
        <div className="flex w-[136px] shrink-0 flex-col justify-center border-r border-line pr-6">
          <h2 className="flex items-center gap-2 font-display text-18 font-bold leading-6 text-ink">
            <span aria-hidden className={cn('h-[8px] w-[8px] rounded-full', paused ? 'bg-pending' : 'bg-success', !paused && !still && 'animate-pulse')} />
            Live wins
          </h2>
          <p className="num text-12 text-ink3">{ONLINE_NOW.toLocaleString('en-US')} playing</p>
        </div>

        {paused ? (
          <p role="status" className="flex flex-1 items-center gap-3 text-14 text-ink2">
            <WarningCircle weight="fill" className="h-5 w-5 shrink-0 text-pending" aria-hidden />
            <span className="font-semibold text-ink">Live wins are paused.</span>
            <span>The feed reconnects on its own, your play is not affected.</span>
          </p>
        ) : (
          <div
            className="min-w-0 flex-1 [mask-image:linear-gradient(90deg,transparent,#000_24px,#000_calc(100%-24px),transparent)]"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
          >
            {loading ? (
              <div className="flex gap-6 overflow-hidden px-2" aria-busy>
                {Array.from({ length: 7 }, (_, i) => (
                  <Skeleton key={i} className="h-[48px] w-[188px] shrink-0" />
                ))}
              </div>
            ) : (
              <div ref={scroller} className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <ul className="flex w-max gap-6 px-2">
                  {row(0)}
                  {row(1)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex shrink-0 gap-2">
          <button type="button" aria-label="Earlier wins" onClick={() => move(-1)} disabled={loading || paused} className={cn(arrow, 'disabled:opacity-50')}>
            <CaretLeft weight="bold" className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" aria-label="Later wins" onClick={() => move(1)} disabled={loading || paused} className={cn(arrow, 'disabled:opacity-50')}>
            <CaretRight weight="bold" className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
