import type { ReactNode } from 'react';
import { Check, Users } from '@phosphor-icons/react';
import type { Category } from '../../../data/games';
import { cn } from '../../../lib/cn';
import type { Hue } from '../kit/parts';
import { ROOMS } from '../shared/data';
import { FLOOR, countIn, type CategoryFilter } from './data';
import { WRAP } from './icons';

// The rooms bento, the page's signature, built to NewBettie's Roulette, Mines, CoinFlip and Crush
// tiles. Each room is its own vivid hue with our art breaking out of it, a live player chip in the
// corner and the game count. The whole tile is one link that sets the room and scrolls to the grid.

const room = (id: Category) => ROOMS.find((r) => r.id === id)!;
const games = (n: number) => `${n} ${n === 1 ? 'game' : 'games'}`;
const label = (id: Category) => {
  const r = room(id);
  const n = countIn(id);
  return `${r.label}, ${r.blurb}. ${r.players} playing, ${games(n)}. Show this room`;
};

function PlayersChip({ n }: { n: number }) {
  return (
    <span className="flex h-9 items-center gap-2 rounded-[10px] bg-black/25 px-3 text-14 font-bold text-ink">
      <Users weight="fill" className="h-4 w-4" aria-hidden />
      <span className="num">{n.toLocaleString('en-US')}</span>
    </span>
  );
}

function Picked() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink text-[#3B1A7A]">
      <Check weight="bold" className="h-5 w-5" aria-hidden />
      <span className="sr-only">Selected</span>
    </span>
  );
}

function Tile({ id, hue, on, onPick, className, children }: { id: Category; hue: Hue; on: boolean; onPick: (c: CategoryFilter) => void; className?: string; children: ReactNode }) {
  return (
    <a
      href="#find"
      aria-current={on ? 'true' : undefined}
      aria-label={label(id)}
      onClick={(e) => {
        e.preventDefault();
        onPick(id);
      }}
      className={cn(
        'group relative isolate block h-full overflow-hidden rounded-[24px] outline-none ring-offset-4 ring-offset-page transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#B47CFF]',
        `k-hue-${hue}`,
        on && 'ring-4 ring-ink',
        className,
      )}
    >
      <span aria-hidden className="k-mark absolute right-0 top-0 -z-10 h-full w-2/3" />
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(165deg,rgb(0_0_0/0.26)_0%,rgb(0_0_0/0)_46%)]" />
      {children}
    </a>
  );
}

/** A small room, title and blurb top left, players top right, games bottom left, the art bottom right. */
function SmallRoom({ id, hue, on, onPick, art }: { id: Category; hue: Hue; on: boolean; onPick: (c: CategoryFilter) => void; art: ReactNode }) {
  const r = room(id);
  return (
    <Tile id={id} hue={hue} on={on} onPick={onPick}>
      {art}
      <span className="absolute left-6 top-6 z-10 flex max-w-[58%] flex-col gap-2">
        <span className="font-display text-32 font-bold uppercase leading-[32px] text-ink">{r.label}</span>
        <span className="text-14 font-semibold leading-5 text-ink">{r.blurb}</span>
      </span>
      <span className="absolute right-4 top-4 z-10">
        <PlayersChip n={r.players} />
      </span>
      <span className="absolute bottom-4 left-6 z-10 flex gap-2">
        {on && <Picked />}
        <span className="num flex h-9 items-center rounded-[10px] bg-black/30 px-3 text-14 font-bold text-ink">{games(countIn(id))}</span>
      </span>
    </Tile>
  );
}

const HOT_SLOTS = ['sugar-rush', 'gates-of-olympus', 'starlight-princess'].map((id) => FLOOR.find((g) => g.id === id)!);
const FISH = FLOOR.filter((g) => g.category === 'fish');
const TOP_RTP = Math.max(...FLOOR.filter((g) => g.category === 'slots').map((g) => g.rtp));

export function Rooms({ cat, onPick }: { cat: CategoryFilter; onPick: (c: CategoryFilter) => void }) {
  const slots = room('slots');
  const nSlots = countIn('slots');
  return (
    <section aria-labelledby="rooms-title" className={WRAP}>
      <h2 id="rooms-title" className="sr-only">
        Rooms
      </h2>
      <ul className="grid grid-cols-4 grid-rows-[292px_292px] gap-4 w1920:grid-rows-[340px_340px]">
        <li className="col-span-2 row-span-2">
          <Tile id="slots" hue="purple" on={cat === 'slots'} onPick={onPick}>
            <img src="/art/landing/pillar-flowers-right.webp" alt="" className="pointer-events-none absolute bottom-[-60px] right-[300px] -z-10 h-[480px] w-auto opacity-50 w1920:right-[400px] w1920:h-[580px]" />
            <img src="/art/landing/girl-lei.webp" alt="" className="pointer-events-none absolute bottom-[-170px] right-[-40px] h-[690px] w-auto max-w-none w1920:bottom-[-200px] w1920:right-[0px] w1920:h-[840px] transition-transform duration-500 group-hover:scale-[1.02]" />
            <img src="/art/landing/slot-machine.webp" alt="" className="pointer-events-none absolute bottom-[-36px] right-[188px] h-[380px] w-auto w1920:right-[300px] w1920:h-[480px] transition-transform duration-300 group-hover:-translate-y-1" />

            <span className="absolute left-8 top-8 z-10 flex w-[300px] flex-col gap-3">
              <span className="font-display text-[64px] font-bold uppercase leading-[60px] text-ink">{slots.label}</span>
              <span className="text-18 font-semibold leading-6 text-ink">{slots.blurb}</span>
              <span className="mt-1 flex gap-2">
                <span className="flex h-[60px] flex-col justify-center rounded-[14px] bg-black/25 px-4">
                  <span className="num font-display text-24 font-bold leading-7 text-ink">{nSlots}</span>
                  <span className="text-12 font-semibold leading-4 text-ink/90">games</span>
                </span>
                <span className="flex h-[60px] flex-col justify-center rounded-[14px] bg-black/25 px-4">
                  <span className="num font-display text-24 font-bold leading-7 text-ink">{TOP_RTP.toFixed(1)}%</span>
                  <span className="text-12 font-semibold leading-4 text-ink/90">best return</span>
                </span>
              </span>
            </span>
            <span className="absolute right-6 top-6 z-10 flex gap-2">
              {cat === 'slots' && <Picked />}
              <PlayersChip n={slots.players} />
            </span>

            <span className="absolute bottom-8 left-8 z-10 flex flex-col gap-4">
              <span className="flex flex-col gap-2">
                <span className="text-14 font-bold text-ink">Hot in slots right now</span>
                <span className="flex gap-2" aria-hidden>
                  {HOT_SLOTS.map((g) => (
                    <img key={g.id} src={g.image} alt="" className="aspect-[3/4] w-[76px] rounded-[12px] object-cover ring-2 ring-white/25" />
                  ))}
                </span>
              </span>
              <span className="flex h-[52px] w-fit items-center rounded-[14px] bg-ink px-6 text-16 font-bold text-[#3B1A7A] transition-colors group-hover:bg-ink/90">Browse {nSlots} slots</span>
            </span>
          </Tile>
        </li>
        <li>
          <SmallRoom
            id="megaways"
            hue="blue"
            on={cat === 'megaways'}
            onPick={onPick}
            art={<img src="/art/kit/neon-reels.webp" alt="" className="pointer-events-none absolute -bottom-8 -right-8 h-[88%] w-auto mix-blend-screen transition-transform duration-300 group-hover:scale-105" />}
          />
        </li>
        <li>
          <SmallRoom
            id="hold-and-win"
            hue="gold"
            on={cat === 'hold-and-win'}
            onPick={onPick}
            art={<img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -bottom-6 -right-8 h-[78%] w-auto transition-transform duration-300 group-hover:scale-105" />}
          />
        </li>
        <li>
          <SmallRoom
            id="fish"
            hue="teal"
            on={cat === 'fish'}
            onPick={onPick}
            art={
              <span aria-hidden className="pointer-events-none absolute -bottom-6 -right-3 h-[200px] w-[236px] w1920:-bottom-4 w1920:right-6 w1920:h-[240px] w1920:w-[290px]">
                {FISH.slice(0, 2).map((g, i) => (
                  <img
                    key={g.id}
                    src={g.image}
                    alt=""
                    className={cn(
                      'absolute bottom-0 aspect-[3/4] w-[120px] w1920:w-[148px] rounded-[16px] object-cover shadow-2 ring-2 ring-white/30 transition-transform duration-300',
                      i === 0 ? 'left-0 -rotate-[10deg] group-hover:-rotate-[14deg]' : 'right-0 rotate-[8deg] group-hover:rotate-[12deg]',
                    )}
                  />
                ))}
              </span>
            }
          />
        </li>
        <li>
          <SmallRoom
            id="new"
            hue="pink"
            on={cat === 'new'}
            onPick={onPick}
            art={<img src="/art/landing/girl-offshoulder.webp" alt="" className="pointer-events-none absolute -bottom-[140px] -right-6 h-[420px] w-auto max-w-none w1920:-bottom-[170px] w1920:right-4 w1920:h-[520px] transition-transform duration-300 group-hover:-translate-y-1" />}
          />
        </li>
      </ul>
    </section>
  );
}
