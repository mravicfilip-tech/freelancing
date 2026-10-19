import { Buildings, Check } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { PROVIDER_LIST } from './data';
import { WRAP } from './icons';
import { SectionTab } from './ui';

// Each studio set as its own wordmark, so the cells read like a logo row and not a list.
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

// The providers, under an angled tab head, as two whole rows of six sunken cells with nothing cut
// off at either width. Picking a studio sets the provider filter and scrolls to the grid, picking it
// again lifts the filter. The picked cell takes the accent line along its floor, the way a live cell
// carries its rarity line.
export function Providers({ provider, onPick }: { provider: string; onPick: (name: string) => void }) {
  return (
    <section aria-labelledby="providers-title" className={cn(WRAP, 'pb-12 pt-16')}>
      <SectionTab
        id="providers-title"
        icon={<Buildings weight="fill" />}
        title="Providers"
        meta={
          <p className="ml-2 text-14 font-medium text-[rgb(var(--v4-muted))]">
            <span className="num font-bold text-ink">{PROVIDER_LIST.length}</span> studios on the floor
          </p>
        }
      />
      <ul className="mt-6 grid grid-cols-6 gap-[1px] overflow-hidden rounded-[4px] border border-white/[0.05] bg-white/[0.05]">
        {PROVIDER_LIST.map((p) => {
          const on = provider === p.name;
          return (
            <li key={p.name}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${p.name}, ${p.count} ${p.count === 1 ? 'game' : 'games'}`}
                onClick={() => onPick(p.name)}
                className={cn(
                  'v4-cell group flex h-[88px] w-full flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B47CFF]',
                  on ? 'v4-r-purple' : '[--hue:150_147_171] after:opacity-0 hover:after:opacity-60',
                )}
              >
                <span aria-hidden className={cn('max-w-[90%] truncate font-sans leading-6', on ? 'text-ink' : 'text-[rgb(var(--v4-soft))] group-hover:text-ink', markOf(p.name))}>
                  {p.name}
                </span>
                <span aria-hidden className="num flex items-center gap-1 text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--v4-label))]">
                  {on && <Check weight="bold" className="h-[12px] w-[12px] text-[#C9A2FF]" />}
                  {p.count} {p.count === 1 ? 'game' : 'games'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
