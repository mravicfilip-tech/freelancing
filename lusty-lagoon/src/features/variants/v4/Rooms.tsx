import { Check } from '@phosphor-icons/react';
import type { Category } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { ONLINE_NOW, ROOMS } from '../shared/data';
import { FLOOR, countIn, type CategoryFilter } from './data';
import { WRAP } from './TopBar4';

// Where each room sits in the 12 column bento, and which part of its scene stays in frame.
const LAYOUT: Record<Category, { span: string; focus: string }> = {
  slots: { span: 'col-span-6', focus: '50% 62%' },
  megaways: { span: 'col-span-3', focus: '50% 66%' },
  'hold-and-win': { span: 'col-span-3', focus: '50% 58%' },
  fish: { span: 'col-span-7', focus: '50% 64%' },
  new: { span: 'col-span-5', focus: '50% 50%' },
};

// The rooms bento, the page's signature. Each room is a scene from our art with a scrim only
// under its text, the room name in Bai Jamjuree, a blurb, who is playing and how many games it holds.
// The whole tile is one link. It sets the room filter and scrolls to the grid.
const NEWEST = FLOOR.filter((g) => g.tag === 'New').slice(0, 2);

export function Rooms({ cat, onPick }: { cat: CategoryFilter; onPick: (c: CategoryFilter) => void }) {
  return (
    <section aria-labelledby="rooms-title" className={cn(WRAP, 'pt-6')}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="rooms-title" className="ll-heading">
          Pick a room
        </h2>
        <p className="num text-14 text-ink2">{ONLINE_NOW.toLocaleString('en-US')} players on the floor right now</p>
      </div>
      <ul className="grid auto-rows-[196px] grid-cols-12 gap-3 w1600:auto-rows-[232px]">
        {ROOMS.map((room) => {
          const on = cat === room.id;
          const isNew = room.id === 'new';
          const count = countIn(room.id);
          return (
            <li key={room.id} className={LAYOUT[room.id].span}>
              <a
                href="#find"
                aria-current={on ? 'true' : undefined}
                aria-label={`${room.label}, ${room.blurb}. ${room.players} playing, ${count} ${count === 1 ? 'game' : 'games'}. Show this room`}
                onClick={(e) => {
                  e.preventDefault();
                  onPick(room.id);
                }}
                className={cn(
                  'group relative block h-full overflow-hidden rounded-2xl border-2 transition-colors',
                  isNew ? 'bg-tonal' : 'bg-sunken',
                  on ? 'border-accent' : isNew ? 'border-tonal-line hover:border-accent/70' : 'border-line hover:border-accent/70',
                )}
              >
                {isNew ? (
                  <>
                    <img
                      src={room.art}
                      alt=""
                      className="absolute bottom-[-12px] right-6 h-[calc(100%+8px)] w-auto max-w-none transition-transform duration-300 group-hover:-translate-y-1"
                    />
                    <span aria-hidden className="absolute bottom-4 right-[172px] flex gap-2">
                      {NEWEST.map((g) => (
                        <img key={g.id} src={g.image} alt="" className="aspect-[134/200] w-[72px] rounded-md border border-tonal-line object-cover" />
                      ))}
                    </span>
                  </>
                ) : (
                  <>
                    <img
                      src={room.art}
                      alt=""
                      loading="lazy"
                      style={{ objectPosition: LAYOUT[room.id].focus }}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-page/95 via-page/65 to-transparent" />
                  </>
                )}

                <span className="absolute left-4 top-4 flex h-8 items-center gap-2 rounded-full bg-page/85 px-3 text-14 text-ink">
                  <span aria-hidden className="h-[8px] w-[8px] rounded-full bg-success" />
                  <span>
                    <span className="num">{room.players}</span> playing
                  </span>
                </span>
                {on && (
                  <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-page">
                    <Check weight="bold" className="h-5 w-5" aria-hidden />
                    <span className="sr-only">Selected</span>
                  </span>
                )}

                <span className={cn('absolute inset-x-4 bottom-4 flex items-end gap-4', isNew ? 'justify-start' : 'justify-between')}>
                  <span className="min-w-0">
                    <span className="block font-display text-28 font-bold leading-9 text-ink">{room.label}</span>
                    <span className="block text-14 text-ink">{room.blurb}</span>
                  </span>
                  <span className={cn('shrink-0', isNew ? 'text-left' : 'text-right')}>
                    <span className="num block font-display text-40 font-bold leading-none text-ink">{count}</span>
                    <span className="block text-14 text-ink2">{count === 1 ? 'game' : 'games'}</span>
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
