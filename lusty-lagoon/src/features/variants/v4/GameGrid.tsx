import { useEffect, useState } from 'react';
import { MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { GameTile } from '../../../components/ui/GameTile';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { WRAP } from './TopBar4';

const PAGE = 40;
const COLS = 'grid grid-cols-8 gap-x-3 gap-y-6 w1600:grid-cols-10';

// The grid, eight covers across at 1440 and ten at 1600 and up, with the name and provider under each
// cover. Loading, failed and empty each get their own message, and the empty one says what to do next.
export function GameGrid({
  games,
  state,
  query,
  resetKey,
  failed,
  onRetry,
  onClear,
  onPlay,
}: {
  games: CatalogueGame[];
  state: string | null;
  query: string;
  resetKey: string;
  failed: boolean;
  onRetry: () => void;
  onClear: () => void;
  onPlay: (g: CatalogueGame) => void;
}) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [resetKey]);
  const q = query.trim();

  return (
    <div className={cn(WRAP, 'pb-2 pt-6')}>
      {state === 'loading' ? (
        <div className={COLS} aria-busy>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[134/200] w-full" />
              <Skeleton className="mt-2 h-5 w-3/4" />
              <Skeleton className="mt-1 h-4 w-1/2" />
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
      ) : games.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel">
          <Message
            icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
            title={q ? `No games match "${q}"` : 'No games in this mix'}
            body={q ? 'Check the spelling, search by provider such as Pragmatic Play, or clear the filters to see the whole floor.' : 'Another room or provider has games. Clear the filters to see the whole floor.'}
            action={
              <Button variant="secondary" onClick={onClear}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <ul className={COLS}>
            {games.slice(0, shown).map((g) => (
              <li key={g.id} className="min-w-0">
                <GameTile game={g} onPlay={() => onPlay(g)} />
                <p className="mt-2 truncate text-14 font-semibold text-ink" title={g.name}>
                  {g.name}
                </p>
                <p className="truncate text-12 text-ink3">{g.provider}</p>
              </li>
            ))}
          </ul>
          {games.length > shown && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <p className="num text-14 text-ink2" aria-live="polite">
                Showing {shown} of {games.length}
              </p>
              <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
                Show {Math.min(PAGE, games.length - shown)} more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
