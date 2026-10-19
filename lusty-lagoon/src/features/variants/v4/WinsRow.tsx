import { useEffect, useMemo, useRef, useState } from 'react';
import { CaretLeft, CaretRight, WarningCircle } from '@phosphor-icons/react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { IconSquare, LiveDot } from '../kit/parts';
import { LIVE_WINS, ONLINE_NOW } from '../shared/data';
import { WRAP } from './icons';

const handle = (name: string) => name.replace(/\s|\./g, '').toLowerCase();
const digits = (n: number) => (Number.isInteger(n) ? 0 : n < 10 ? 2 : 2);

// HugeWin's live wins across the top, drawn as one panel with one edge. Each win is a quiet chip with
// the cover, the player and the amount with its coin, and an edge that lights on hover. The strip drifts slowly, stops under the pointer or keyboard focus, and the
// two squares move it a few wins at a time. ?still and reduced motion keep it parked.
export function WinsRow({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
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
        pos += dt * 0.03;
        const half = el.scrollWidth / 2;
        if (pos >= half) pos -= half;
        el.scrollLeft = pos;
      } else pos = el.scrollLeft;
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
    el.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  // The first copy is the real list. The second only fills the loop and stays out of the tab order.
  const row = (copy: 0 | 1) =>
    wins.map((w) => {
      const coin = coinById(w.coin);
      const amt = formatAmount(w.amount, digits(w.amount));
      return (
        <li key={`${copy}-${w.id}`} className="shrink-0">
          <button
            type="button"
            tabIndex={copy ? -1 : 0}
            aria-hidden={copy ? true : undefined}
            onClick={() => onPlay(w.game)}
            aria-label={`${w.player} won ${amt} ${coin.symbol} on ${w.game.name}, ${w.ago} ago. Open the game`}
            className="group flex h-11 items-center gap-3 rounded-[12px] border border-transparent py-[3px] pl-[3px] pr-3 text-left outline-none transition-colors duration-200 hover:border-white/[0.14] hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
          >
            <span className="h-[36px] w-[36px] shrink-0 overflow-hidden rounded-[9px]">
              <img src={w.game.image} alt="" className="h-full w-full object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]" />
            </span>
            <span className="flex flex-col">
              <span className="max-w-[112px] truncate text-12 font-semibold leading-4 text-[rgb(var(--k-dim))]">{handle(w.player)}</span>
              <span className="flex items-center gap-[6px]">
                <img src={coin.icon} alt="" width={16} height={16} className="rounded-full" />
                <span className="num text-14 font-bold leading-5 text-ink">{amt}</span>
              </span>
            </span>
          </button>
        </li>
      );
    });

  return (
    <section className={cn(WRAP, 'pb-4')} aria-label="Live wins">
    <div className="k-surface flex h-[60px] items-center gap-3 rounded-[16px] p-2">
      <div className="flex h-11 shrink-0 flex-col justify-center border-r border-white/[0.08] pl-2 pr-4">
        <h2 className="flex items-center gap-2 text-14 font-bold leading-5 text-ink">
          {paused ? <span aria-hidden className="h-[8px] w-2 rounded-full bg-pending" /> : <LiveDot />}
          Live wins
        </h2>
        <p className="num pl-4 text-12 font-semibold leading-4 text-[rgb(var(--k-dim))]">{ONLINE_NOW.toLocaleString('en-US')} playing</p>
      </div>

      {paused ? (
        <p role="status" className="flex h-11 min-w-0 flex-1 items-center gap-3 text-14 text-[rgb(var(--k-muted))]">
          <WarningCircle weight="fill" className="h-5 w-5 shrink-0 text-pending" aria-hidden />
          <span className="font-bold text-ink">Live wins are paused.</span>
          <span>The feed reconnects on its own, your play is not affected.</span>
        </p>
      ) : (
        <div
          className="min-w-0 flex-1 [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-32px),transparent)]"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
        >
          {loading ? (
            <div className="flex gap-2 overflow-hidden" aria-busy>
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} className="h-11 w-[164px] shrink-0 rounded-[12px]" />
              ))}
            </div>
          ) : (
            <div ref={scroller} className="k-no-scrollbar overflow-x-auto">
              <ul className="flex w-max gap-2">
                {row(0)}
                {row(1)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex shrink-0 gap-2">
        <IconSquare size={44} label="Earlier wins" onClick={() => !loading && !paused && move(-1)} className={cn('rounded-[12px]', (loading || paused) && 'opacity-50')}>
          <CaretLeft weight="bold" className="h-4 w-4" aria-hidden />
        </IconSquare>
        <IconSquare size={44} label="Later wins" onClick={() => !loading && !paused && move(1)} className={cn('rounded-[12px]', (loading || paused) && 'opacity-50')}>
          <CaretRight weight="bold" className="h-4 w-4" aria-hidden />
        </IconSquare>
      </div>
    </div>
    </section>
  );
}
