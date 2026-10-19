import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Check, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { GameTile } from '../../../components/ui/GameTile';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CATEGORIES, GAMES, gameById, type CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { EXPLORE_ORDER } from '../../lobby/data';

const PAGE = 18;
const GRID = 'grid gap-x-4 gap-y-6 [grid-template-columns:repeat(auto-fill,minmax(176px,1fr))]';

type Filter = (typeof CATEGORIES)[number]['value'];

// All games. Category chips with counts, a search that the top bar feeds, covers in a grid that adds
// columns at wider screens, and the game's name under each cover.
export const AllGames = forwardRef<HTMLElement, { state: string | null; query: string; onClear: () => void; failed: boolean; onRetry: () => void; onPlay: (g: CatalogueGame) => void }>(
  function AllGames({ state, query, onClear, failed, onRetry, onPlay }, ref) {
    const [filter, setFilter] = useState<Filter>('all');
    const [shown, setShown] = useState(PAGE);

    const ordered = useMemo(() => {
      const first = EXPLORE_ORDER.map((id) => gameById(id)!);
      const rest = GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id));
      return [...first, ...rest];
    }, []);

    const q = query.trim().toLowerCase();
    const searched = q ? ordered.filter((g) => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)) : ordered;
    const list = filter === 'all' ? searched : searched.filter((g) => g.category === filter);
    const count = (v: Filter) => (v === 'all' ? searched.length : searched.filter((g) => g.category === v).length);

    useEffect(() => setShown(PAGE), [filter, q]);

    return (
      <section ref={ref} id="all-games" aria-labelledby="all-games-title" className="mt-16 scroll-mt-[96px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="all-games-title" className="font-display text-28 font-bold leading-[1.2] text-ink">
            {q ? `Results for "${query.trim()}"` : 'All games'}
          </h2>
          {q && (
            <Button variant="tertiary" onClick={onClear}>
              Clear the search
            </Button>
          )}
        </div>

        <div role="group" aria-label="Game category" className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = filter === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(c.value)}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-lg border px-4 text-14 font-medium transition-colors duration-150',
                  on ? 'border-accent bg-raised text-ink' : 'border-line bg-panel text-ink2 hover:border-field hover:text-ink',
                )}
              >
                {on && <Check weight="bold" className="h-4 w-4 text-accent" aria-hidden />}
                {c.label}
                <span className="num text-ink3">{state === 'loading' || failed ? '' : count(c.value)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {state === 'loading' ? (
            <div className={GRID}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[134/200] w-full" />
                  <Skeleton className="mt-2 h-5 w-3/4" />
                </div>
              ))}
            </div>
          ) : failed ? (
            <div className="rounded-2xl border border-line bg-panel">
              <Message
                icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
                title="We could not load the games"
                body="Your balance and wagers are safe. Try again in a moment."
                action={
                  <Button variant="secondary" onClick={onRetry}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-line bg-panel">
              <Message
                icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
                title={q ? `No games match "${query.trim()}"` : 'No games in this category yet'}
                body={q ? 'Check the spelling, or search by provider, such as Pragmatic Play.' : 'Pick another category to see more games.'}
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      onClear();
                      setFilter('all');
                    }}
                  >
                    {q ? 'Clear the search' : 'Show all games'}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <ul className={GRID}>
                {list.slice(0, shown).map((g) => (
                  <li key={g.id} className="min-w-0">
                    <GameTile game={g} onPlay={() => onPlay(g)} />
                    <p className="mt-2 truncate text-14 font-semibold text-ink">{g.short ?? g.name}</p>
                    <p className="truncate text-12 text-ink3">{g.provider}</p>
                  </li>
                ))}
              </ul>
              {list.length > shown && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <p className="num text-14 text-ink2" aria-live="polite">
                    Showing {shown} of {list.length}
                  </p>
                  <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
                    Show {Math.min(PAGE, list.length - shown)} more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    );
  },
);
