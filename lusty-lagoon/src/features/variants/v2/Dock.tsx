import { Skeleton } from '../../../components/ui/Skeleton';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatUsd } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { CONTINUE_PLAYING } from '../shared/data';

// The continue playing dock. Four cards that straddle the stage's bottom edge, each a cover, the
// game, when it was last played and the session result, signed and coloured.
export function Dock({ loading, onPlay }: { loading: boolean; onPlay: (g: CatalogueGame) => void }) {
  return (
    <section aria-labelledby="dock-title" className="relative z-10 -mt-[92px]">
      <h2 id="dock-title" className="mb-3 font-display text-18 font-bold text-ink">
        Continue playing
      </h2>
      <ul className="grid grid-cols-4 gap-3 pr-[380px]">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-[96px] w-full rounded-xl" />
              </li>
            ))
          : CONTINUE_PLAYING.map((c) => {
              const g = gameById(c.gameId)!;
              const win = c.session > 0;
              return (
                <li key={c.gameId}>
                  <button
                    type="button"
                    onClick={() => onPlay(g)}
                    aria-label={`Play ${g.name}, last played ${c.lastPlayed}`}
                    className="flex h-[96px] w-full items-center gap-3 rounded-xl border border-line bg-panel p-3 text-left transition-colors duration-150 hover:border-accent"
                  >
                    <img src={g.image} alt="" className="h-full w-auto shrink-0 rounded-lg object-cover" style={{ aspectRatio: '134 / 200' }} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-14 font-semibold text-ink">{g.short ?? g.name}</span>
                      <span className="text-12 text-ink3">{c.lastPlayed}</span>
                      <span className={cn('num mt-1 font-display text-18 font-bold leading-none', win ? 'text-win' : 'text-ink3')}>
                        {win ? '+' : '-'}
                        {formatUsd(Math.abs(c.session))}
                        <span className="sr-only"> this session</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
      </ul>
    </section>
  );
}
