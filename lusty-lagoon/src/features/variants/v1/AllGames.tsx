import { useMemo, useState } from 'react';
import { Check, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { GameTile } from '../../../components/ui/GameTile';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CATEGORIES, GAMES, gameById, type CatalogueGame, type Category } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { EXPLORE_ORDER } from '../../lobby/data';
import { SectionHead } from './parts';

const PAGE = 18;
const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3';

export function AllGames({
  state,
  query,
  category,
  onCategory,
  onClear,
  onPlay,
}: {
  state: string | null;
  query: string;
  category: 'all' | Category;
  onCategory: (c: 'all' | Category) => void;
  onClear: () => void;
  onPlay: (g: CatalogueGame) => void;
}) {
  const [shown, setShown] = useState(PAGE);
  const [failed, setFailed] = useState(state === 'error');

  const ordered = useMemo(() => {
    const first = EXPLORE_ORDER.map((id) => gameById(id)!);
    const rest = GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id));
    return [...first, ...rest];
  }, []);

  const q = query.trim().toLowerCase();
  const matchesQuery = (g: CatalogueGame) => !q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q);
  const countFor = (c: 'all' | Category) => ordered.filter((g) => matchesQuery(g) && (c === 'all' || g.category === c)).length;
  const list = ordered.filter((g) => matchesQuery(g) && (category === 'all' || g.category === category));
  const clearAll = () => {
    onClear();
    onCategory('all');
  };

  return (
    <section id="v1-games" aria-labelledby="v1-games-title" className="min-w-0 scroll-mt-[88px]">
      <SectionHead id="v1-games-title" title={q ? `Results for "${query.trim()}"` : 'All games'} hint={state === 'loading' || failed ? undefined : <span className="num" aria-live="polite">{list.length} games</span>}>
        {(q || category !== 'all') && !failed && (
          <Button variant="tertiary" size="sm" onClick={clearAll}>
            Clear filters
          </Button>
        )}
      </SectionHead>

      <div role="group" aria-label="Game category" className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const on = category === c.value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={on}
              onClick={() => {
                onCategory(c.value);
                setShown(PAGE);
              }}
              className={cn(
                'flex h-[36px] items-center gap-2 rounded-full border px-4 text-14 font-medium transition-colors duration-150',
                on ? 'border-accent bg-raised text-ink' : 'border-line text-ink2 hover:border-field hover:text-ink',
              )}
            >
              {on && <Check weight="bold" className="h-4 w-4 text-accent" aria-hidden />}
              {c.label}
              <span className="num text-12 text-ink3">{countFor(c.value)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {state === 'loading' ? (
          <div className={GRID}>
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="aspect-[134/200] w-full" />
            ))}
          </div>
        ) : failed ? (
          <div className="rounded-xl border border-line bg-panel">
            <Message
              icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
              title="We could not load the games"
              body="Your balance and wagers are safe. Try again in a moment."
              action={
                <Button variant="secondary" onClick={() => setFailed(false)}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-line bg-panel">
            <Message
              icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
              title={q ? `No games match "${query.trim()}"` : 'No games in this room yet'}
              body="Check the spelling, or search by provider, such as Pragmatic Play."
              action={
                <Button variant="secondary" onClick={clearAll}>
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <ul className={GRID}>
              {list.slice(0, shown).map((g) => (
                <li key={g.id}>
                  <GameTile game={g} onPlay={() => onPlay(g)} />
                </li>
              ))}
            </ul>
            {list.length > shown && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <p className="num text-14 text-ink2">
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
}
