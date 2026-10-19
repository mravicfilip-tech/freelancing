import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { cn } from '../../../lib/cn';
import { LIVE_WINS } from '../shared/data';
import { amountText, CoinIcon, IconSquare, Label, Live, Skel, handle } from './ui';

// The winners live feed after Snegbet. Compact cards with the cover, the player, the amount and its
// coin chip, filling the centre row with whole cards only. A new win slides in from the left every
// four seconds. Pause holds it, and so does ?still for shots.

const MIN = 156;
const GAP = 8;

function FeedCard({ w, width, onPlay, off }: { w: (typeof LIVE_WINS)[number]; width: number; onPlay: (g: CatalogueGame) => void; off?: boolean }) {
  const g = gameById(w.gameId)!;
  return (
    <li style={{ width }} className="shrink-0" aria-hidden={off || undefined}>
      <button
        type="button"
        tabIndex={off ? -1 : undefined}
        onClick={() => onPlay(g)}
        aria-label={`${w.player} won ${amountText(w.coin, w.amount)} ${coinById(w.coin).symbol} on ${g.name}, play it`}
        className="n1-panel n1-ring group flex h-[60px] w-full items-center gap-3 rounded-[12px] pl-[6px] pr-3 text-left transition-colors hover:border-[#B47CFF]/60 hover:bg-[rgb(var(--n-raised))]"
      >
        <span className="relative h-[48px] w-10 shrink-0 overflow-hidden rounded-[8px]">
          <img src={g.image} alt="" className="n1-zoom h-full w-full object-cover object-top" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-[6px]">
            {w.avatar ? <img src={w.avatar} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" /> : <span className="h-4 w-4 shrink-0 rounded-full bg-[#5B2BC4]" aria-hidden />}
            <span className="truncate text-12 font-semibold text-[rgb(var(--n-muted))]">{handle(w.player)}</span>
          </span>
          <span className="flex min-w-0 items-center gap-[6px]">
            <CoinIcon id={w.coin} size={16} />
            <span className="num truncate text-14 font-extrabold text-ink">{amountText(w.coin, w.amount)}</span>
            <span className="sr-only">{coinById(w.coin).symbol}</span>
            <span className="num ml-auto shrink-0 text-12 font-semibold text-[rgb(var(--n-dim))]">
              {w.ago}
              <span className="sr-only"> ago</span>
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

export function Feed({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  const still = useMemo(() => new URLSearchParams(window.location.search).has('still'), []);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState(0);
  const [head, setHead] = useState(0);
  const [paused, setPaused] = useState(false);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = Math.max(1, Math.floor((width + GAP) / (MIN + GAP)));
  const cw = width ? (width - (n - 1) * GAP) / n : MIN;
  const items = Array.from({ length: n + 1 }, (_, i) => LIVE_WINS[(head + i) % LIVE_WINS.length]);

  // A new win arrives every four seconds, the newest first.
  useEffect(() => {
    if (still || paused || state) return;
    const t = window.setInterval(() => setHead((h) => (h - 1 + LIVE_WINS.length) % LIVE_WINS.length), 4000);
    return () => window.clearInterval(t);
  }, [still, paused, state]);

  // Slide the row one card to the right, so the new card enters from the left edge.
  useLayoutEffect(() => {
    const el = track.current;
    if (!el || still || reduced || head === 0) return;
    el.style.transition = 'none';
    el.style.transform = `translateX(${-(cw + GAP)}px)`;
    void el.offsetWidth;
    el.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'translateX(0)';
  }, [head]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-labelledby="n1-feed" className="flex min-w-0 flex-col gap-2">
      <div className="flex h-6 items-center gap-2">
        <Live />
        <Label id="n1-feed">Winners live feed</Label>
        {!state && (
          <IconSquare size={36} label={paused ? 'Play the winners feed' : 'Pause the winners feed'} pressed={paused} onClick={() => setPaused((p) => !p)} className="ml-auto h-6 w-6 rounded-[6px] border-transparent bg-transparent">
            {paused ? <Play weight="fill" className="h-[12px] w-[12px]" aria-hidden /> : <Pause weight="fill" className="h-[12px] w-[12px]" aria-hidden />}
          </IconSquare>
        )}
      </div>
      <div ref={wrap} className="relative overflow-hidden">
        {state === 'loading' ? (
          <div className="flex gap-2">
            {Array.from({ length: n }, (_, i) => (
              <Skel key={i} className="h-[60px] shrink-0 rounded-[12px]" />
            )).map((s, i) => (
              <span key={i} style={{ width: cw }} className="shrink-0">
                {s}
              </span>
            ))}
          </div>
        ) : state === 'error' ? (
          <p role="status" className="n1-panel flex h-[60px] items-center gap-3 rounded-[12px] px-4 text-14 font-semibold text-[rgb(var(--n-muted))]">
            <WarningCircle weight="fill" className="h-5 w-5 text-danger" aria-hidden />
            The live feed lost its connection. It reconnects on its own.
          </p>
        ) : (
          <ul ref={track} aria-live="off" className={cn('flex gap-2', !width && 'invisible')}>
            {items.map((w, i) => (
              <FeedCard key={`${w.id}-${i}`} w={w} width={cw} onPlay={onPlay} off={i === n} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
