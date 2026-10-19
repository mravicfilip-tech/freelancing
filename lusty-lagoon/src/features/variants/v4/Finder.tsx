import { forwardRef, useEffect, useState } from 'react';
import { Buildings, Check, Fire, MagnifyingGlass, SortAscending, WarningCircle, X } from '@phosphor-icons/react';
import { CATEGORIES, type CatalogueGame } from '../../../data/games';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { cn } from '../../../lib/cn';
import { CoverCard, KitButton } from '../kit/parts';
import { BoxSelect } from './BoxSelect';
import { ALL_PROVIDERS, FLOOR, PROVIDER_LIST, SORTS, isFiltered, withoutCategory, type CategoryFilter, type Filters, type SortKey } from './data';
import { ROOM_ICON, WRAP } from './icons';

// 40 is five whole rows at both 8 and 10 columns, so the grid ends on whole rows at 1440 and 1920.
const PAGE = 40;
const COLS = 'grid grid-cols-8 gap-x-4 gap-y-6 w1920:grid-cols-10';

// Gold is for badges and prizes, so Hot takes it. New and Exclusive stay quiet, an edge and a tint.
const TAG: Record<string, string> = {
  Hot: 'bg-gold text-on-gold',
  New: 'border border-white/20 text-ink',
  Exclusive: 'border border-[#B47CFF]/50 bg-[#8D3BF0]/25 text-[#D9BFFF]',
};

// The finder, built to Turbo Bet's All games and finished in the round 4 chrome. A heading with the
// live result count, then a frosted bar that sticks under the top bar while the grid scrolls, chips
// with icons and counts, the provider and sort selects, all 44 tall on a 12 radius. A picked chip takes
// the purple selection tint, its own edge and a check.
export const Finder = forwardRef<HTMLElement, {
  filters: Filters;
  onChange: (p: Partial<Filters>) => void;
  onClear: () => void;
  games: CatalogueGame[];
  state: string | null;
  failed: boolean;
  onRetry: () => void;
  onPlay: (g: CatalogueGame) => void;
}>(function Finder({ filters, onChange, onClear, games, state, failed, onRetry, onPlay }, ref) {
  const base = withoutCategory(filters);
  const countFor = (c: CategoryFilter) => (c === 'all' ? base.length : base.filter((g) => g.category === c).length);
  const providers = [{ value: ALL_PROVIDERS, label: 'All providers', hint: String(FLOOR.length) }, ...PROVIDER_LIST.map((p) => ({ value: p.name, label: p.name, hint: String(p.count) }))];
  const q = filters.query.trim();

  const [shown, setShown] = useState(PAGE);
  const key = `${filters.cat}|${filters.provider}|${filters.query}|${filters.sort}`;
  useEffect(() => setShown(PAGE), [key]);

  return (
    <section id="find" ref={ref} aria-labelledby="find-title" className="mt-8 scroll-mt-[84px]">
      <div className={cn(WRAP, 'flex items-end justify-between gap-4')}>
        <div className="flex flex-col gap-1">
          <h2 id="find-title" className="flex items-center gap-3 text-20 font-bold tracking-[-0.01em] text-ink">
            <Fire weight="fill" className="h-6 w-6 text-[#C9A2FF]" aria-hidden />
            All games
          </h2>
          <p aria-live="polite" className="pl-[36px] text-14 text-[rgb(var(--k-muted))]">
            {q ? (
              <>
                <span className="num text-ink">{games.length}</span> {games.length === 1 ? 'game matches' : 'games match'} "{q}"
              </>
            ) : (
              <>
                <span className="num text-ink">{games.length}</span> of {FLOOR.length} games from {PROVIDER_LIST.length} providers
              </>
            )}
          </p>
        </div>
        {isFiltered(filters) && (
          <KitButton tone="dark" size="sm" onClick={onClear} className="h-11 rounded-[12px] px-4">
            <X weight="bold" className="h-4 w-4" aria-hidden />
            Clear filters
          </KitButton>
        )}
      </div>

      <div className="k-glass sticky top-[84px] z-10 mt-4">
        <div className={cn(WRAP, 'flex items-center gap-3 py-3')}>
          <h3 className="sr-only">Filters</h3>
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
                    'flex h-11 shrink-0 items-center gap-2 rounded-[12px] border px-4 text-14 font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#B47CFF] [&>svg]:h-[18px] [&>svg]:w-[18px]',
                    on ? 'border-[#B47CFF]/60 bg-[#8D3BF0]/25 text-ink [&>svg]:text-[#C9A2FF]' : 'border-white/[0.07] text-[rgb(var(--k-muted))] hover:border-white/[0.14] hover:bg-[rgb(var(--k-item))] hover:text-ink',
                  )}
                >
                  {on ? <Check weight="bold" aria-hidden /> : ROOM_ICON[c.value]}
                  {c.label}
                  <span className={cn('num text-12', on ? 'text-ink/80' : 'text-[rgb(var(--k-dim))]')}>{countFor(c.value)}</span>
                </button>
              );
            })}
          </div>
          <span aria-hidden className="mx-1 h-6 w-px bg-white/[0.1]" />
          <div className="ml-auto flex items-center gap-2">
            <BoxSelect label="Provider" icon={<Buildings weight="fill" />} options={providers} value={filters.provider} onValueChange={(provider) => onChange({ provider })} className="w-[216px]" />
            <BoxSelect label="Sort by" icon={<SortAscending weight="bold" />} options={SORTS} value={filters.sort} onValueChange={(sort) => onChange({ sort: sort as SortKey })} className="w-[188px]" />
          </div>
        </div>
      </div>

      <div className={cn(WRAP, 'pt-2')}>
        {state === 'loading' ? (
          <div className={COLS} aria-busy>
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[3/4] w-full rounded-[16px]" />
                <Skeleton className="h-5 w-3/4 rounded-[6px]" />
                <Skeleton className="h-4 w-1/2 rounded-[6px]" />
              </div>
            ))}
          </div>
        ) : failed ? (
          <div className="k-surface rounded-[20px] py-8">
            <Message
              icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
              title="We could not load the games"
              body="Your balance and bets are safe. Try again in a moment."
              action={
                <KitButton tone="purple" onClick={onRetry}>
                  Try again
                </KitButton>
              }
            />
          </div>
        ) : games.length === 0 ? (
          <div className="k-surface rounded-[20px] py-8">
            <Message
              icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />}
              title={q ? `No games match "${q}"` : 'No games in this mix'}
              body={q ? 'Check the spelling, search by provider such as Pragmatic Play, or clear the filters to see the whole floor.' : 'Another room or provider has games. Clear the filters to see the whole floor.'}
              action={
                <KitButton tone="purple" onClick={onClear}>
                  Clear filters
                </KitButton>
              }
            />
          </div>
        ) : (
          <>
            <ul className={COLS}>
              {games.slice(0, shown).map((g) => (
                <li key={g.id} className="min-w-0">
                  <CoverCard image={g.image} name={g.name} provider={g.provider} onPlay={() => onPlay(g)} />
                  <p className="mt-3 truncate text-14 font-bold text-ink" title={g.name}>
                    {g.short ?? g.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="truncate text-12 font-medium text-[rgb(var(--k-dim))]">{g.provider}</span>
                    {g.tag && TAG[g.tag] && <span className={cn('flex h-5 shrink-0 items-center rounded-[6px] px-[6px] text-12 font-bold leading-none', TAG[g.tag])}>{g.tag}</span>}
                  </p>
                </li>
              ))}
            </ul>
            {games.length > shown && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <p className="num text-14 font-semibold text-[rgb(var(--k-muted))]">
                  Showing {shown} of {games.length}
                </p>
                <KitButton tone="dark" onClick={() => setShown((n) => n + PAGE)}>
                  Show {Math.min(PAGE, games.length - shown)} more
                </KitButton>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});
