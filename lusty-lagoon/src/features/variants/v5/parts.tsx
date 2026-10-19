import { useMemo, type ReactNode } from 'react';
import { coinById, type CoinId } from '../../../data/wallet';
import { cn } from '../../../lib/cn';
import { Skeleton } from '../../../components/ui/Skeleton';

// Small shared pieces for the Quiet vault page.

export function Coin({ id, size = 20, className }: { id: CoinId; size?: number; className?: string }) {
  const coin = coinById(id);
  return <img src={coin.icon} alt={coin.symbol} width={size} height={size} className={cn('shrink-0 rounded-full ring-1 ring-ink/20', className)} />;
}

/** True when the page asks for a still frame with ?still. */
export function useStill() {
  return useMemo(() => new URLSearchParams(window.location.search).has('still'), []);
}

/** A section heading in Bai Jamjuree, with an optional line of help and an action on the right. */
export function SectionHead({ id, title, sub, children }: { id: string; title: ReactNode; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="font-display text-24 font-semibold leading-[1.2] text-ink">
          {title}
        </h2>
        {sub ? <p className="text-14 text-ink2">{sub}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** Signed money, plus in win green, minus and zero in ink3. */
export function signed(n: number) {
  const abs = Math.abs(n).toFixed(2);
  return n > 0 ? `+${abs}` : n < 0 ? `−${abs}` : abs;
}

export function RowSkeletons({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-[64px] items-center gap-4 border-b border-line/60 px-6">
          <Skeleton className="h-10 w-8" />
          <Skeleton className="h-5 w-[180px]" />
          <Skeleton className="ml-auto h-5 w-[240px]" />
        </div>
      ))}
    </div>
  );
}
