import { forwardRef, useMemo, useState } from 'react';
import { MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { GameTile } from '../../../components/ui/GameTile';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CATEGORIES, GAMES, gameById, type CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { EXPLORE_ORDER } from '../../lobby/data';
import { SectionHead } from './parts';

// All games, small tiles, ten across at 1440, twelve at 1600 and fourteen at 1920.
const GRID = 'grid grid-cols-10 gap-2 w1600:grid-cols-12 w1920:grid-cols-[repeat(14,minmax(0,1fr))]';
const PAGE = 70;

export const AllGames = forwardRef<HTMLElement, { state: string | null; query: string; clearQuery: () => void; onPlay: (g: CatalogueGame) => void }>(function AllGames(
  { state, query, clearQuery, onPlay },
  ref,
) {
  const [cat, setCat] = useState<string>('all');
  const [shown, setShown] = useState(PAGE);
  const [failed, setFailed] = useState(state === 'error');

  const ordered = useMemo(() => {
    const first = EXPLORE_ORDER.map((id) => gameById(id)!);
    const rest = GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id));
    return [...first, ...rest];
  }, []);
  const q = query.trim().toLowerCase();
  const byCat = ordered.filter((g) => cat === 'all' || g.category === cat);
  const list = q ? byCat.filter((g) => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)) : byCat;
  const count = (c: string) => ordered.filter((g) => c === 'all' || g.category === c).length;

  return (
    <section ref={ref} id="all-games" aria-labelledby="v5-games" className="mt-16 scroll-mt-[96px]">
      <SectionHead id="v5-games" title={q ? `Results for "${query.trim()}"` : 'All games'}>
        <div role="group" aria-label="Game category" className="flex flex-wrap justify-end gap-2">
          {CATEGORIES.map((c) => {
            const on = cat === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setCat(c.value);
                  setShown(PAGE);
                }}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-full border px-4 text-14 font-medium transition-colors',
                  on ? 'border-accent bg-menu-active text-ink' : 'border-line text-ink2 hover:border-field hover:text-ink',
                )}
              >
                {c.label}
                <span className="num text-12 text-ink3">{count(c.value)}</span>
              </button>
            );
          })}
        </div>
      </SectionHead>

      <div className="mt-6">
        {state === 'loading' ? (
          <div aria-busy className={GRID}>
            {Array.from({ length: 30 }, (_, i) => (
              <Skeleton key={i} className="aspect-[134/200] w-full" />
            ))}
          </div>
        ) : failed ? (
          <div className="rounded-2xl border border-line bg-panel">
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
          <div className="rounded-2xl border border-line bg-panel">
            <Message
              icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
              title={q ? `No games match "${query.trim()}"` : 'No games in this category yet'}
              body="Check the spelling, or search by provider, such as Pragmatic Play."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearQuery();
                    setCat('all');
                  }}
                >
                  Clear the search
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
              <div className="mt-8 flex items-center justify-center gap-4">
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
});
