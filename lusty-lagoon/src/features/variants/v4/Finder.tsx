import { forwardRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Buildings, Check, MagnifyingGlass, Play, SortAscending, SquaresFour, WarningCircle, X } from '@phosphor-icons/react';
import { CATEGORIES, type CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { BoxSelect } from './BoxSelect';
import { ALL_PROVIDERS, FLOOR, PROVIDER_LIST, ROOM_RGB, ROOM_TEXT, SORTS, isFiltered, withoutCategory, type CategoryFilter, type Filters, type SortKey } from './data';
import { ROOM_ICON, WRAP } from './icons';
import { Face, Key, SectionTab, Skel, ValueChip } from './ui';

// Covers stay at about 140 wide at both widths, under the smallest cover's 152px source, and 36 is
// four whole rows of 9 at 1440 and three of 12 at 1920.
const PAGE = 36;
const COLS = 'grid grid-cols-9 gap-4 w1920:grid-cols-12';

/** The grid's column count, 12 from 1920 up, for the tile that closes the last row. */
function useCols() {
  const q = '(min-width: 1920px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide ? 12 : 9;
}

// Gold is for badges and prizes, so Hot takes it. New and Exclusive stay quiet, an edge and a tint.
const TAG: Record<string, string> = {
  Hot: 'bg-[#F4D543] text-[#1A0F2B]',
  New: 'border border-white/30 bg-black/50 text-ink',
  Exclusive: 'border border-[#B47CFF]/60 bg-[#2A1650]/80 text-[#E2CCFF]',
};

const ROOM_NAME = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * A game card after CS2's inventory cards. One flat slate card with a clipped corner holds the cover,
 * the room in its hue as a small caps label, the name and the provider, with a 2px line in the room's
 * hue along its floor. Hover keeps it in place, the edge turns accent, the line brightens, the art
 * scales inside and a Play chip shows.
 */
function Card({ game, onPlay }: { game: CatalogueGame; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play ${game.name}, ${game.provider}`}
      style={{ '--hue': ROOM_RGB[game.category] } as CSSProperties}
      className="v4-cut v4-card group flex w-full flex-col bg-[rgb(var(--v4-panel))] p-2 text-left outline-none [--cut:10px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B47CFF]"
    >
      <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-[3px] bg-[rgb(var(--v4-well))]">
        <img src={game.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]" />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0E0D14]/85 via-[#0E0D14]/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-1/2 z-[1] flex h-9 -translate-x-1/2 translate-y-1 items-center gap-2 px-4 text-14 font-extrabold text-[#1A0F2B] opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <span className="absolute inset-0 -z-10 skew-x-[-14deg] rounded-[3px] bg-white" />
          <Play weight="fill" className="h-4 w-4" />
          Play
        </span>
        {game.tag && TAG[game.tag] && (
          <span className={cn('absolute left-2 top-2 flex h-5 items-center rounded-[3px] px-[6px] text-12 font-extrabold uppercase leading-none tracking-[0.04em]', TAG[game.tag])}>{game.tag}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-col px-1 pb-2 pt-3">
        <span className={cn('truncate text-12 font-bold uppercase leading-4 tracking-[0.06em]', ROOM_TEXT[game.category])}>{ROOM_NAME[game.category]}</span>
        <span className="mt-1 line-clamp-2 h-[40px] text-14 font-bold leading-5 text-ink" title={game.name}>
          {game.short ?? game.name}
        </span>
        <span className="truncate text-12 font-medium leading-4 text-[rgb(var(--v4-label))]">{game.provider}</span>
      </span>
    </button>
  );
}

// The finder, CS2's Inventory. An angled tab head with the live result count, then a bar that sticks
// under the top bar while the grid scrolls, the rooms as parallelogram chips with counts, and the
// provider and sort selects. Every control on the bar is 40 tall.
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
  const providers = [{ value: ALL_PROVIDERS, label: 'All', hint: String(FLOOR.length) }, ...PROVIDER_LIST.map((p) => ({ value: p.name, label: p.name, hint: String(p.count) }))];
  const q = filters.query.trim();
  const cols = useCols();

  const [shown, setShown] = useState(PAGE);
  const key = `${filters.cat}|${filters.provider}|${filters.query}|${filters.sort}`;
  useEffect(() => setShown(PAGE), [key]);

  const list = games.slice(0, shown);
  const done = games.length <= shown;
  const rest = list.length % cols;
  const filtered = isFiltered(filters);
  const closer = done && rest > 0 && cols - rest >= 3 ? cols - rest : 0;

  return (
    <section id="find" ref={ref} aria-labelledby="find-title" className="mt-12 scroll-mt-[72px]">
      <div className={WRAP}>
        <SectionTab
          id="find-title"
          icon={<SquaresFour weight="fill" />}
          title="All games"
          meta={
            <p aria-live="polite" className="ml-2 text-14 font-medium text-[rgb(var(--v4-muted))]">
              {state === 'loading' ? (
                'Loading the floor'
              ) : q ? (
                <>
                  <span className="num font-bold text-ink">{games.length}</span> {games.length === 1 ? 'game matches' : 'games match'} "{q}"
                </>
              ) : filtered ? (
                <>
                  <span className="num font-bold text-ink">{games.length}</span> of <span className="num">{FLOOR.length}</span>
                </>
              ) : (
                <>
                  <span className="num font-bold text-ink">{games.length}</span> games
                </>
              )}
            </p>
          }
        >
          {filtered && (
            <Key tone="quiet" onClick={onClear} className="h-10 px-6 text-14">
              <X weight="bold" className="h-4 w-4" aria-hidden />
              Clear filters
            </Key>
          )}
          <p className="text-14 font-medium text-[rgb(var(--v4-muted))]">
            <span className="num font-bold text-ink">{PROVIDER_LIST.length}</span> providers
          </p>
        </SectionTab>
      </div>

      <div className="sticky top-[72px] z-10 border-b border-white/[0.06] bg-[rgb(var(--v4-ground)/0.92)] backdrop-blur-[16px]">
        <div className={cn(WRAP, 'flex h-[64px] items-center gap-3')}>
          <h3 className="sr-only">Filters</h3>
          <div role="group" aria-label="Room" className="-ml-1 flex items-center gap-1">
            {CATEGORIES.map((c) => {
              const on = filters.cat === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ cat: c.value })}
                  className={cn(
                    'v4-focus group relative flex h-10 shrink-0 items-center gap-2 px-4 text-14 font-semibold transition-colors duration-150',
                    on ? 'text-ink' : 'text-[rgb(var(--v4-muted))] hover:text-ink',
                  )}
                >
                  <Face on={on} className={on ? '' : 'border-white/[0.07] bg-[rgb(var(--v4-panel))]'} />
                  <span aria-hidden className={cn('relative flex h-[18px] w-[18px] items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]', on && 'text-[#C9A2FF]')}>
                    {on ? <Check weight="bold" /> : ROOM_ICON[c.value]}
                  </span>
                  <span className="relative">{c.label}</span>
                  <ValueChip on={on}>{countFor(c.value)}</ValueChip>
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <BoxSelect label="Provider" icon={<Buildings weight="fill" />} options={providers} value={filters.provider} onValueChange={(provider) => onChange({ provider })} className="w-[208px]" />
            <BoxSelect label="Sort" icon={<SortAscending weight="bold" />} options={SORTS} value={filters.sort} onValueChange={(sort) => onChange({ sort: sort as SortKey })} className="w-[232px]" />
          </div>
        </div>
      </div>

      <div className={cn(WRAP, 'pt-6')}>
        {state === 'loading' ? (
          <div className={COLS} aria-busy>
            {Array.from({ length: cols * 2 }, (_, i) => (
              <div key={i} className="v4-cut flex flex-col gap-2 bg-[rgb(var(--v4-panel))] p-2 pb-4 [--cut:10px]">
                <Skel className="aspect-[3/4] w-full" />
                <Skel className="mx-1 mt-2 h-[12px] w-1/2" />
                <Skel className="mx-1 h-4 w-3/4" />
                <Skel className="mx-1 h-4 w-1/3" />
                <Skel className="mx-1 h-[12px] w-2/3" />
              </div>
            ))}
          </div>
        ) : failed ? (
          <Notice
            icon={<WarningCircle weight="fill" className="h-8 w-8 text-[#FF7A88]" aria-hidden />}
            title="We could not load the games"
            body="Your balance and bets are safe. Try again in a moment."
            action={
              <Key tone="purple" onClick={onRetry}>
                Try again
              </Key>
            }
          />
        ) : games.length === 0 ? (
          <Notice
            icon={<MagnifyingGlass weight="bold" className="h-8 w-8 text-[rgb(var(--v4-label))]" aria-hidden />}
            title={q ? `No games match "${q}"` : 'No games in this mix'}
            body={q ? 'Check the spelling, search by provider such as Pragmatic Play, or clear the filters to see the whole floor.' : 'Another room or provider has games. Clear the filters to see the whole floor.'}
            action={
              <Key tone="purple" onClick={onClear}>
                Clear filters
              </Key>
            }
          />
        ) : (
          <>
            <ul className={COLS}>
              {list.map((g) => (
                <li key={g.id} className="min-w-0">
                  <Card game={g} onPlay={() => onPlay(g)} />
                </li>
              ))}
              {closer > 0 && (
                <li style={{ gridColumn: `span ${closer} / span ${closer}` }} className="min-w-0">
                  <div className={cn('v4-cut v4-well flex h-full gap-4 px-8 [--cut:10px]', closer < 5 ? 'flex-col justify-center' : 'items-center gap-6')}>
                    <div className="flex min-w-0 flex-col gap-2">
                      <span className="text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--v4-label))]">{filtered ? 'End of this mix' : 'End of the floor'}</span>
                      <span className="font-display text-20 font-bold uppercase leading-6 text-ink">
                        {filtered ? (
                          <>
                            <span className="num">{games.length}</span> of <span className="num">{FLOOR.length}</span> games on show
                          </>
                        ) : (
                          <>
                            All <span className="num">{FLOOR.length}</span> games on show
                          </>
                        )}
                      </span>
                      <span className="text-14 text-[rgb(var(--v4-muted))]">{filtered ? 'Clear the filters to see the whole floor.' : 'New games land every Friday.'}</span>
                    </div>
                    <Key tone="quiet" onClick={filtered ? onClear : () => onChange({ cat: 'new' })} className={cn('shrink-0', closer < 5 ? 'w-fit' : 'ml-auto')}>
                      {filtered ? 'Clear filters' : 'Open the New room'}
                    </Key>
                  </div>
                </li>
              )}
            </ul>
            {!done && (
              <div className="mt-8 flex items-center justify-center gap-6">
                <p className="num text-14 font-semibold text-[rgb(var(--v4-muted))]">
                  Showing <span className="text-ink">{shown}</span> of {games.length}
                </p>
                <Key tone="quiet" onClick={() => setShown((n) => n + PAGE)}>
                  Show {Math.min(PAGE, games.length - shown)} more
                </Key>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

/** An empty or error notice in an angular panel. */
function Notice({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action: ReactNode }) {
  return (
    <div role="status" className="v4-cut v4-panel flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-[56px] w-[56px] items-center justify-center rounded-[4px] border border-white/[0.07] bg-[rgb(var(--v4-well))]">{icon}</span>
      <p className="font-display text-20 font-bold text-ink">{title}</p>
      <p className="max-w-md text-16 text-[rgb(var(--v4-muted))]">{body}</p>
      <div className="mt-3">{action}</div>
    </div>
  );
}
