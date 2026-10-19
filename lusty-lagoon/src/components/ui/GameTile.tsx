import { Play } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

export type Game = { id: string; name: string; provider: string; image: string; tag?: string };

// A game cover with its name under it. Hover and focus show a play mark on the art, never gold,
// because gold is the one primary action per view.
export function GameTile({ game, onPlay, className }: { game: Game; onPlay?: (g: Game) => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onPlay?.(game)}
      aria-label={`Play ${game.name}, ${game.provider}`}
      className={cn('group flex w-full flex-col gap-2 rounded-xl text-left', className)}
    >
      <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl border border-line bg-panel">
        <img src={game.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {game.tag && (
          <span className="absolute left-2 top-2 rounded-lg bg-page px-2 py-1 text-12 font-semibold uppercase tracking-[var(--bl-ls-label)] text-ink">{game.tag}</span>
        )}
        <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-page/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-page">
            <Play weight="fill" className="h-5 w-5" />
          </span>
        </span>
      </span>
      <span className="flex flex-col px-1">
        <span className="truncate text-14 font-semibold text-ink">{game.name}</span>
        <span className="truncate text-14 text-ink3">{game.provider}</span>
      </span>
    </button>
  );
}
