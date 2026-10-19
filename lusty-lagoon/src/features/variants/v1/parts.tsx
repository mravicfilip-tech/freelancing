import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { coinById, type CoinId } from '../../../data/wallet';
import { cn } from '../../../lib/cn';

// Small parts the Social lagoon page shares. Nothing here is a new design language, they sit on the
// tokens and the lobby's own arrow art.

export function Coin({ id, size = 16 }: { id: CoinId; size?: number }) {
  const coin = coinById(id);
  return <img src={coin.icon} alt="" width={size} height={size} className="shrink-0 rounded-full" />;
}

/** A flat green dot for live things. Decorative, the words beside it carry the meaning. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn('inline-block h-2 w-2 shrink-0 rounded-full bg-success', className)} />;
}

export function SectionHead({ id, title, hint, children }: { id: string; title: string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-[32px] items-center justify-between gap-4">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 id={id} className="text-20 font-bold leading-[28px] text-ink">
          {title}
        </h2>
        {hint ? <span className="truncate text-14 text-ink2">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function RoundArrow({ dir, label, onClick, disabled }: { dir: 'prev' | 'next'; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-full transition-opacity hover:brightness-125 disabled:opacity-40 disabled:hover:brightness-100"
    >
      <img src="/art/lobby/arrow-next.svg" alt="" width={32} height={32} className={dir === 'prev' ? 'rotate-180' : undefined} />
    </button>
  );
}

/** A horizontally scrolling rail with previous and next arrows that switch off at the ends. */
export function useRail(step: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 4);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);
  const move = (d: 1 | -1) => ref.current?.scrollBy({ left: d * step, behavior: 'smooth' });
  return { ref, atStart, atEnd, update, move };
}

export function RailArrows({ rail, name }: { rail: ReturnType<typeof useRail>; name: string }) {
  return (
    <div className="flex gap-1">
      <RoundArrow dir="prev" label={`Previous, ${name}`} onClick={() => rail.move(-1)} disabled={rail.atStart} />
      <RoundArrow dir="next" label={`Next, ${name}`} onClick={() => rail.move(1)} disabled={rail.atEnd} />
    </div>
  );
}

/** A paused or failed block, one icon, one headline, one sentence, flat. */
export function Paused({ icon, title, body, action, className }: { icon: ReactNode; title: string; body: string; action?: ReactNode; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center gap-4 rounded-xl border border-line bg-panel px-4 py-4', className)}>
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-16 font-semibold text-ink">{title}</p>
        <p className="text-14 text-ink2">{body}</p>
      </div>
      {action}
    </div>
  );
}

export const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
