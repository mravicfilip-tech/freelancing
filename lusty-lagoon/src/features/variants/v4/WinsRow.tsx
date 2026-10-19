import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CaretLeft, CaretRight, Crown, Lightning, User, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { LIVE_WINS } from '../shared/data';
import { BIG_WIN, ME, RARITY_TEXT, WIN_MULT, formatMult, rarityOf } from './data';
import { WRAP } from './icons';
import { IconBox, Skel } from './ui';

const handle = (name: string) => name.replace(/\s|\./g, '').toLowerCase();
const digits = (n: number) => (Number.isInteger(n) ? 0 : 2);

type View = 'all' | 'big' | 'mine';
const VIEWS: { value: View; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'All wins', icon: <Lightning weight="fill" /> },
  { value: 'big', label: 'Big wins', icon: <Crown weight="fill" /> },
  { value: 'mine', label: 'Your wins', icon: <User weight="fill" /> },
];

// CS2's Live upgrades row. A caps head with the live dot, three angled view tabs in the middle on a
// thin rule, then one strip of sunken cells, each with its rarity line underneath, gold from 1000x,
// purple from 100x, blue from 10x and green below. The strip drifts slowly, stops under the pointer
// or keyboard focus, and the two squares move it a few wins at a time. ?still parks it.
export function WinsRow({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const [view, setView] = useState<View>('all');
  const all = useMemo(() => LIVE_WINS.map((w) => ({ ...w, game: gameById(w.gameId)!, mult: WIN_MULT[w.id] ?? 1 })), []);
  const wins = view === 'big' ? all.filter((w) => w.mult >= BIG_WIN) : view === 'mine' ? all.filter((w) => w.player === ME) : all;
  const loop = wins.length >= 6;
  const scroller = useRef<HTMLDivElement>(null);
  const holdUntil = useRef(0);
  const [hover, setHover] = useState(false);
  const loading = state === 'loading';
  const paused = state === 'error';
  const still = useMemo(() => new URLSearchParams(window.location.search).has('still') || window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = 0;
  }, [view]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || still || hover || loading || paused || !loop) return;
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
  }, [still, hover, loading, paused, loop, view]);

  const move = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    holdUntil.current = performance.now() + 1400;
    const half = el.scrollWidth / 2;
    if (loop && dir < 0 && el.scrollLeft < 8) el.scrollLeft += half;
    el.scrollBy({ left: dir * 3 * ((el.querySelector('li')?.offsetWidth ?? 197) + 1), behavior: 'smooth' });
  };

  // The first copy is the real list. The second only fills the loop and stays out of the tab order.
  const row = (copy: 0 | 1) =>
    wins.map((w) => {
      const coin = coinById(w.coin);
      const amt = formatAmount(w.amount, digits(w.amount));
      const r = rarityOf(w.mult);
      return (
        <li key={`${copy}-${w.id}`} className="shrink-0">
          <button
            type="button"
            tabIndex={copy ? -1 : 0}
            aria-hidden={copy ? true : undefined}
            onClick={() => onPlay(w.game)}
            aria-label={`${w.player} won ${amt} ${coin.symbol} at ${formatMult(w.mult)} on ${w.game.name}, ${w.ago} ago. Open the game`}
            className={cn('v4-cell group flex h-[64px] w-[197px] w1920:w-[206px] items-center gap-3 pl-3 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B47CFF]', `v4-r-${r}`)}
          >
            <span className="relative h-11 w-11 shrink-0">
              <svg aria-hidden viewBox="0 0 44 44" className="absolute inset-0 h-11 w-11">
                <circle cx="22" cy="22" r="20.5" fill="none" stroke="rgb(var(--hue))" strokeOpacity="0.16" strokeWidth="2" />
                <circle cx="22" cy="22" r="20.5" fill="none" stroke="rgb(var(--hue))" strokeOpacity="0.85" strokeWidth="2" strokeDasharray="80 129" transform="rotate(120 22 22)" />
              </svg>
              <span className="absolute inset-[6px] overflow-hidden rounded-[3px] [clip-path:polygon(0_0,calc(100%-7px)_0,100%_7px,100%_100%,0_100%)]">
                <img src={w.game.image} alt="" className="h-full w-full object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]" />
              </span>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="flex items-center gap-2 leading-4">
                <span className={cn('num text-12 font-bold', RARITY_TEXT[r])}>{formatMult(w.mult)}</span>
                <span className="truncate text-12 font-semibold text-[rgb(var(--v4-label))]">{handle(w.player)}</span>
              </span>
              <span className="mt-1 flex items-center gap-[6px]">
                <img src={coin.icon} alt="" width={16} height={16} className="rounded-full" />
                <span className="num text-14 font-bold leading-5 text-ink">{amt}</span>
                <span className="text-12 font-semibold text-[rgb(var(--v4-label))]">{coin.symbol}</span>
              </span>
            </span>
          </button>
        </li>
      );
    });

  return (
    <section className={cn(WRAP, 'pt-4')} aria-labelledby="wins-title">
      <div className="flex h-9 items-center gap-6">
        <h2 id="wins-title" className="flex shrink-0 items-center gap-3 text-14 font-extrabold uppercase tracking-[0.06em] text-ink">
          {paused ? <span aria-hidden className="h-[8px] w-[8px] rounded-full bg-[#F4D543]" /> : <span aria-hidden className="v4-live" />}
          Live wins
        </h2>
        <span aria-hidden className="h-[1px] flex-1 bg-gradient-to-r from-white/[0.08] to-white/[0.02]" />
        <div role="radiogroup" aria-label="Which wins" className="flex items-center gap-1">
          {VIEWS.map((v) => {
            const on = view === v.value;
            return (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setView(v.value)}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-[4px] px-3 text-12 font-extrabold uppercase tracking-[0.06em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#B47CFF] [&>svg]:h-4 [&>svg]:w-4',
                  on ? 'text-ink [&>svg]:text-[#F4D543]' : 'text-[rgb(var(--v4-label))] hover:text-ink',
                )}
              >
                {v.icon}
                {v.label}
              </button>
            );
          })}
        </div>
        <span aria-hidden className="h-[1px] flex-1 bg-gradient-to-l from-white/[0.08] to-white/[0.02]" />
        <div className="flex shrink-0 gap-2">
          <IconBox size={40} aria-label="Earlier wins" disabled={loading || paused} onClick={() => move(-1)}>
            <CaretLeft weight="bold" className="h-4 w-4" aria-hidden />
          </IconBox>
          <IconBox size={40} aria-label="Later wins" disabled={loading || paused} onClick={() => move(1)}>
            <CaretRight weight="bold" className="h-4 w-4" aria-hidden />
          </IconBox>
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-[4px] border border-white/[0.05]">
        {paused ? (
          <p role="status" className="v4-well flex h-[64px] items-center gap-3 px-6 text-14 text-[rgb(var(--v4-muted))]">
            <WarningCircle weight="fill" className="h-5 w-5 shrink-0 text-[#F4D543]" aria-hidden />
            <span className="font-bold text-ink">Live wins are paused.</span>
            <span>The feed reconnects on its own, your play is not affected.</span>
          </p>
        ) : loading ? (
          <div className="v4-well flex h-[64px] gap-[1px] overflow-hidden" aria-busy>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="flex w-[197px] w1920:w-[206px] shrink-0 items-center gap-3 px-3">
                <Skel className="h-[34px] w-[34px]" />
                <span className="flex flex-col gap-2">
                  <Skel className="h-[12px] w-[72px]" />
                  <Skel className="h-4 w-[96px]" />
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div
            className="v4-well [mask-image:linear-gradient(90deg,#000_calc(100%-200px),rgb(0_0_0/0.45))]"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
          >
            <div ref={scroller} className="v4-noscroll overflow-x-auto">
              <ul className="flex w-max gap-[1px]">
                {row(0)}
                {loop && row(1)}
                {!loop && (
                  <li className="flex h-[64px] items-center px-6 text-14 text-[rgb(var(--v4-muted))]">
                    {view === 'mine' ? 'Your next win lands here the moment it pays.' : 'Fewer big wins than usual right now.'}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
