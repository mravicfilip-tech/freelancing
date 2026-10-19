import { Check } from '@phosphor-icons/react';
import { CATEGORIES } from '../../../data/games';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { cn } from '../../../lib/cn';
import { ALL_PROVIDERS, FLOOR, PROVIDER_LIST, SORTS, isFiltered, withoutCategory, type CategoryFilter, type Filters, type SortKey } from './data';
import { WRAP } from './TopBar4';

// The find a game bar. It sticks under the top bar while the grid scrolls. Category chips show a
// check and a border when picked, and their counts follow the provider and the search, so a chip
// never promises games the grid cannot show. Provider and sort use the Select part.
export function FindBar({ filters, onChange, shown, onClear }: { filters: Filters; onChange: (patch: Partial<Filters>) => void; shown: number; onClear: () => void }) {
  const base = withoutCategory(filters);
  const countFor = (c: CategoryFilter) => (c === 'all' ? base.length : base.filter((g) => g.category === c).length);
  const providerOptions = [{ value: ALL_PROVIDERS, label: 'All providers' }, ...PROVIDER_LIST.map((p) => ({ value: p.name, label: `${p.name} (${p.count})` }))];

  return (
    <div className="sticky top-[72px] z-10 border-y border-line bg-page">
      <div className={cn(WRAP, 'flex h-[68px] items-center gap-3')}>
        <h2 className="sr-only">Find a game</h2>
        <div role="group" aria-label="Room" className="flex items-center gap-2">
          {CATEGORIES.map((c) => {
            const on = filters.cat === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ cat: c.value })}
                className={cn(
                  'flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-14 font-semibold transition-colors',
                  on ? 'border-accent bg-raised text-ink' : 'border-line bg-panel text-ink2 hover:border-field hover:text-ink',
                )}
              >
                {on && <Check weight="bold" className="h-4 w-4 text-accent" aria-hidden />}
                {c.label}
                <span className={cn('num font-normal', on ? 'text-ink2' : 'text-ink3')}>{countFor(c.value)}</span>
              </button>
            );
          })}
        </div>

        <span aria-hidden className="mx-1 h-6 w-[1px] bg-line" />

        <Select label="Provider" className="w-[232px] [&>label]:sr-only" options={providerOptions} value={filters.provider} onValueChange={(provider) => onChange({ provider })} />
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-14 text-ink3">
            Sort
          </span>
          <Select label="Sort by" className="w-[168px] [&>label]:sr-only" options={SORTS} value={filters.sort} onValueChange={(sort) => onChange({ sort: sort as SortKey })} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isFiltered(filters) && (
            <Button variant="tertiary" onClick={onClear}>
              Clear filters
            </Button>
          )}
          <p aria-live="polite" className="whitespace-nowrap text-14 text-ink2">
            <span className="num font-display text-20 font-bold text-ink">{shown}</span> of {FLOOR.length} games
          </p>
        </div>
      </div>
    </div>
  );
}
