import { Check } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { PROVIDER_LIST } from './data';
import { WRAP } from './TopBar4';

const monogram = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w, _, all) => (all.length > 1 ? w[0] : w.slice(0, 2)))
    .join('')
    .slice(0, 2)
    .toUpperCase();

// The providers row. One flat tile each, a monogram, the studio and its game count. Picking one sets
// the provider filter and scrolls to the grid, picking it again lifts the filter.
export function Providers({ provider, onPick }: { provider: string; onPick: (name: string) => void }) {
  return (
    <section aria-labelledby="providers-title" className={cn(WRAP, 'pb-12 pt-12')}>
      <h2 id="providers-title" className="ll-heading mb-4">
        Providers
      </h2>
      <ul className="grid grid-cols-6 gap-3">
        {PROVIDER_LIST.map((p) => {
          const on = provider === p.name;
          return (
            <li key={p.name}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onPick(p.name)}
                className={cn(
                  'flex h-[64px] w-full items-center gap-3 rounded-xl border bg-panel pl-3 pr-4 text-left transition-colors',
                  on ? 'border-accent' : 'border-line hover:border-field',
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tonal font-display text-14 font-bold text-ink">
                  {on ? <Check weight="bold" className="h-5 w-5 text-accent" aria-hidden /> : monogram(p.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-16 font-bold leading-6 text-ink">{p.name}</span>
                  <span className="num block text-14 text-ink2">{p.count} {p.count === 1 ? 'game' : 'games'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
