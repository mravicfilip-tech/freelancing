import { Check } from '@phosphor-icons/react';
import { GAMES, type Category } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { ROOMS } from '../shared/data';
import { LiveDot, SectionHead } from './parts';

// Four rooms, one scene each. A dark tone sits only under the text. A room is one button, it sets
// the category filter and the page scrolls to the games. The picked room keeps a border and a check.
export function Rooms({ category, onPick }: { category: 'all' | Category; onPick: (c: Category) => void }) {
  const rooms = ROOMS.slice(0, 4);
  return (
    <section aria-labelledby="v1-rooms" className="min-w-0">
      <SectionHead id="v1-rooms" title="Rooms" hint="Pick one to see its games" />
      <ul className="mt-3 grid grid-cols-4 gap-3">
        {rooms.map((r) => {
          const on = category === r.id;
          const games = GAMES.filter((g) => g.category === r.id).length;
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onPick(r.id)}
                className={cn(
                  'group relative block h-[116px] w-full overflow-hidden rounded-xl border-2 text-left transition-colors duration-150',
                  on ? 'border-accent' : 'border-transparent hover:border-field',
                )}
              >
                <img src={r.art} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-[96px] bg-[linear-gradient(180deg,transparent,rgb(var(--ll-page)/0.95)_70%)]" />
                {on && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-gold">
                    <Check weight="bold" className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Picked</span>
                  </span>
                )}
                <span className="absolute inset-x-3 bottom-2 flex flex-col">
                  <span className="truncate font-display text-18 font-bold leading-6 text-ink">{r.label}</span>
                  <span className="flex items-center justify-between gap-2 text-14 text-ink">
                    <span className="num flex items-center gap-2">
                      <LiveDot />
                      {r.players} playing
                    </span>
                    <span className="num text-ink">{games} games</span>
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
