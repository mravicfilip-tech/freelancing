import { useRef } from 'react';
import { Buildings, Check } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { RailControls, SectionHead } from '../kit/parts';
import { PROVIDER_LIST } from './data';
import { WRAP } from './icons';

// Each studio set as its own wordmark, so the tiles read like HugeWin's logo row and not a list.
const MARK: Record<string, string> = {
  'Pragmatic Play': 'font-display text-18 font-bold uppercase tracking-[0.04em]',
  Rotativka: 'font-display text-20 font-bold italic tracking-[0.02em]',
  Gamzix: 'font-sans text-20 font-bold lowercase tracking-[-0.02em]',
  '3 Oaks Gaming': 'font-display text-16 font-semibold uppercase tracking-[0.18em]',
  'Relax Gaming': 'font-sans text-18 font-bold tracking-[-0.01em]',
  NetGaming: 'font-display text-18 font-bold uppercase tracking-[0.08em]',
  Habanero: 'font-sans text-20 font-bold italic',
  Fugaso: 'font-display text-20 font-bold uppercase tracking-[0.2em]',
};
const markOf = (name: string) => MARK[name] ?? 'font-display text-18 font-bold uppercase tracking-[0.06em]';

// HugeWin's providers row, boxed wordmark tiles on one scrolling line. Picking a studio sets the
// provider filter and scrolls to the grid, picking it again lifts the filter.
export function Providers({ provider, onPick }: { provider: string; onPick: (name: string) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const move = (d: 1 | -1) => ref.current?.scrollBy({ left: d * 432, behavior: 'smooth' });
  return (
    <section aria-labelledby="providers-title" className={cn(WRAP, 'flex flex-col gap-4 pb-12 pt-16')}>
      <SectionHead id="providers-title" icon={<Buildings weight="fill" className="text-[#3DDC84]" />} title="Providers" sub={`${PROVIDER_LIST.length} studios on the floor`}>
        <RailControls label="Providers" onPrev={() => move(-1)} onNext={() => move(1)} />
      </SectionHead>
      <ul ref={ref} className="k-no-scrollbar flex gap-3 overflow-x-auto [mask-image:linear-gradient(90deg,#000_calc(100%-48px),transparent)]">
        {PROVIDER_LIST.map((p) => {
          const on = provider === p.name;
          return (
            <li key={p.name} className="shrink-0">
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${p.name}, ${p.count} ${p.count === 1 ? 'game' : 'games'}`}
                onClick={() => onPick(p.name)}
                className={cn(
                  'relative flex h-[84px] w-[200px] flex-col items-center justify-center gap-1 rounded-[16px] border-2 transition-colors',
                  on ? 'border-[#B47CFF] bg-[rgb(var(--k-item-hover))]' : 'border-transparent bg-[rgb(var(--k-item))] hover:bg-[rgb(var(--k-item-hover))]',
                )}
              >
                <span aria-hidden className={cn('max-w-[176px] truncate leading-6 text-ink', markOf(p.name))}>
                  {p.name}
                </span>
                <span aria-hidden className="num text-12 font-semibold text-[rgb(var(--k-dim))]">
                  {p.count} {p.count === 1 ? 'game' : 'games'}
                </span>
                {on && (
                  <span aria-hidden className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#B47CFF] text-page">
                    <Check weight="bold" className="h-4 w-4" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
