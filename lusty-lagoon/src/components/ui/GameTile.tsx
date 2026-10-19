import { cn } from '../../lib/cn';

export type Game = { id: string; name: string; provider: string; image: string; tag?: string };

// The Figma game tile, a cover in a 2px frame, 134 by 200 in the lobby grid. The cover carries the
// game's own name and badges, so nothing is printed under it. Hover and focus turn the frame gold,
// flat, with no glow (note 1).
export function GameTile({ game, onPlay, shape = 'tall', className }: { game: Game; onPlay?: (g: Game) => void; shape?: 'tall' | 'wide'; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onPlay?.(game)}
      aria-label={`Play ${game.name}, ${game.provider}`}
      className={cn(
        'll-tile group block w-full p-0.5 transition-colors duration-150 hover:border-gold focus-visible:border-gold',
        shape === 'wide' ? 'aspect-[3/2]' : 'aspect-[134/200]',
        className,
      )}
    >
      <img src={game.image} alt="" loading="lazy" className="h-full w-full rounded-md object-cover" />
    </button>
  );
}
