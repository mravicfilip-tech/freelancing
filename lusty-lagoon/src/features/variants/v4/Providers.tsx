import { useRef } from 'react';
import { Buildings, Check } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { RailControls, SectionHead } from '../kit/parts';
import { PROVIDER_LIST } from './data';
import { WRAP } from './icons';

// Each studio set as its own wordmark, so the tiles read like HugeWin's logo row and not a list.
const MARK: Record<string, string> = {
  'Pragmatic Play': 'text-16 font-extrabold uppercase tracking-[0.04em]',
  Rotativka: 'text-20 font-bold italic tracking-[0.02em]',
  Gamzix: 'text-20 font-bold lowercase tracking-[-0.02em]',
  '3 Oaks Gaming': 'text-14 font-semibold uppercase tracking-[0.18em]',
  'Relax Gaming': 'text-16 font-bold tracking-[-0.01em]',
  NetGaming: 'text-16 font-extrabold uppercase tracking-[0.08em]',
  Habanero: 'text-20 font-bold italic',
  Fugaso: 'text-16 font-extrabold uppercase tracking-[0.2em]',
};
const markOf = (name: string) => MARK[name] ?? 'text-16 font-extrabold uppercase tracking-[0.06em]';

// HugeWin's providers row, edged wordmark tiles on one scrolling line, in the sans face since the
// display face is kept for the 40 and 64 headlines. Picking a studio sets the
// provider filter and scrolls to the grid, picking it again lifts the filter.
export function Providers({ provider, onPick }: { provider: string; onPick: (name: string) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const move = (d: 1 | -1) => ref.current?.scrollBy({ left: d * 432, behavior: 'smooth' });
  return (
    <section aria-labelledby="providers-title" className={cn(WRAP, 'flex flex-col gap-4 pb-12 pt-16')}>
      <SectionHead id="providers-title" icon={<Buildings weight="fill" className="text-[#C9A2FF]" />} title="Providers" sub={`${PROVIDER_LIST.length} studios on the floor`}>
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
                  'relative flex h-[84px] w-[200px] flex-col items-center justify-center gap-1 rounded-[16px] border outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#B47CFF]',
                  on ? 'border-[#B47CFF]/70 bg-[#8D3BF0]/20' : 'border-white/[0.07] bg-[rgb(var(--k-item))] hover:border-white/[0.16] hover:bg-[rgb(var(--k-item-hover))]',
                )}
              >
                <span aria-hidden className={cn('max-w-[176px] truncate font-sans leading-6 text-ink', markOf(p.name))}>
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
