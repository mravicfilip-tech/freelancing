import type { ReactNode } from 'react';
import { Check } from '@phosphor-icons/react';
import type { Category } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { LiveDot, spotlight, type Hue } from '../kit/parts';
import { ROOMS } from '../shared/data';
import { FLOOR, countIn, type CategoryFilter } from './data';
import { WRAP } from './icons';

// The rooms bento, the page's signature, built to NewBettie's Roulette, Mines, CoinFlip and Crush
// tiles and finished to the round 4 rules. Each room keeps its own hue as art, now one calm two stop
// fill with a 1px light edge. The art sits inside the clip and never past its source size, a
// character's head stays clear of the top edge, and the players pill sits bottom left so nothing
// covers a face. Hover stays in place, the edge lights and the art scales 1.05 inside the tile over
// 500ms. The whole tile is one link that sets the room and scrolls to the grid.

const room = (id: Category) => ROOMS.find((r) => r.id === id)!;
const games = (n: number) => `${n} ${n === 1 ? 'game' : 'games'}`;
const label = (id: Category) => {
  const r = room(id);
  const n = countIn(id);
  return `${r.label}, ${r.blurb}. ${r.players} playing, ${games(n)}. Show this room`;
};

/** Art scales inside the clip on hover. Origin is the bottom, so nothing drifts off its anchor. */
const ART = 'pointer-events-none absolute origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]';

/** The live count and the game count in one quiet pill. The picked room turns it white with a check. */
function Pill({ players, count, on, className }: { players: number; count?: number; on: boolean; className?: string }) {
  return (
    <span className={cn('z-10 flex h-9 items-center gap-2 rounded-[12px] border px-3 text-14 font-bold backdrop-blur-sm', on ? 'border-white bg-ink text-[#3B1A7A]' : 'border-white/15 bg-black/30 text-ink', className)}>
      {on && <Check weight="bold" className="h-4 w-4" aria-hidden />}
      <LiveDot />
      <span className="num">{players.toLocaleString('en-US')}</span>
      <span className="sr-only"> playing</span>
      {count !== undefined && (
        <>
          <span aria-hidden className={cn('h-4 w-[1px]', on ? 'bg-[#3B1A7A]/25' : 'bg-white/25')} />
          <span className="num">{count}</span>
          <span>{count === 1 ? 'game' : 'games'}</span>
        </>
      )}
      {on && <span className="sr-only"> Selected</span>}
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
      onPointerMove={spotlight}
      className={cn(
        'k-tile k-spot group relative block h-full overflow-hidden outline-none transition-[border-color] duration-200 hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--ll-page))]',
        `k-tile-${hue}`,
        on && 'outline outline-2 outline-offset-[3px] outline-[#B47CFF]',
        className,
      )}
    >
      <span aria-hidden className="k-mark absolute right-0 top-0 -z-10 h-full w-2/3" />
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(165deg,rgb(0_0_0/0.18)_0%,rgb(0_0_0/0)_50%)]" />
      {children}
    </a>
  );
}

/** A small room. Title and blurb top left, the pill bottom left, the art bottom right. */
function SmallRoom({ id, hue, on, onPick, art }: { id: Category; hue: Hue; on: boolean; onPick: (c: CategoryFilter) => void; art: ReactNode }) {
  const r = room(id);
  return (
    <Tile id={id} hue={hue} on={on} onPick={onPick} className="rounded-[20px]">
      {art}
      <span className="absolute left-6 top-6 z-10 flex max-w-[60%] flex-col gap-2">
        <span className="text-28 font-extrabold uppercase leading-[30px] tracking-[-0.01em] text-ink">{r.label}</span>
        <span className="text-14 font-semibold leading-5 text-ink/90">{r.blurb}</span>
      </span>
      <Pill players={r.players} count={countIn(id)} on={on} className="absolute bottom-6 left-6" />
    </Tile>
  );
}

const HOT_SLOTS = ['sugar-rush', 'gates-of-olympus', 'starlight-princess'].map((id) => FLOOR.find((g) => g.id === id)!);
const FISH = FLOOR.filter((g) => g.category === 'fish');
const TOP_RTP = Math.max(...FLOOR.filter((g) => g.category === 'slots').map((g) => g.rtp));

/** A stat in the lead room, a loud number over a quiet 12 caps label. */
function Stat({ value, label: text }: { value: string; label: string }) {
  return (
    <span className="flex h-[72px] flex-col justify-center rounded-[16px] border border-white/10 bg-black/25 px-4">
      <span className="num text-28 font-bold leading-8 tracking-[-0.01em] text-ink">{value}</span>
      <span className="text-12 font-semibold uppercase leading-4 tracking-[0.08em] text-ink/80">{text}</span>
    </span>
  );
}

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
          <Tile id="slots" hue="purple" on={cat === 'slots'} onPick={onPick} className="rounded-[24px]">
            <span aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_66%_62%,rgb(255_255_255/0.14),transparent_70%)]" />
            <img src="/art/landing/girl-lei.webp" alt="" className={cn(ART, 'bottom-[-170px] right-[-24px] h-[690px] w-auto max-w-none w1920:bottom-[-200px] w1920:right-[0px] w1920:h-[840px]')} />
            <img src="/art/landing/slot-machine.webp" alt="" className={cn(ART, 'bottom-[-36px] right-[196px] h-[380px] w-auto w1920:right-[300px] w1920:h-[480px]')} />

            <span className="absolute left-8 top-8 z-10 flex w-[300px] flex-col gap-3">
              <span className="font-display text-[64px] font-bold uppercase leading-[60px] tracking-[-0.02em] text-ink">{slots.label}</span>
              <span className="text-20 font-semibold leading-7 text-ink">{slots.blurb}</span>
              <span className="mt-2 flex gap-2">
                <Stat value={String(nSlots)} label="games" />
                <Stat value={`${TOP_RTP.toFixed(1)}%`} label="best return" />
              </span>
            </span>
            <Pill players={slots.players} on={cat === 'slots'} className="absolute right-6 top-6" />

            <span className="absolute bottom-8 left-8 z-10 flex flex-col gap-4">
              <span className="flex flex-col gap-2">
                <span className="text-12 font-semibold uppercase tracking-[0.08em] text-ink/80">Hot in slots right now</span>
                <span className="flex gap-2" aria-hidden>
                  {HOT_SLOTS.map((g) => (
                    <img key={g.id} src={g.image} alt="" className="aspect-[3/4] w-[76px] rounded-[12px] object-cover ring-1 ring-white/25" />
                  ))}
                </span>
              </span>
              <span className="flex h-11 w-fit items-center rounded-[12px] bg-ink px-6 text-16 font-bold text-[#3B1A7A] transition-[filter] duration-200 group-hover:brightness-95">Browse {nSlots} slots</span>
            </span>
          </Tile>
        </li>
        <li>
          <SmallRoom
            id="megaways"
            hue="blue"
            on={cat === 'megaways'}
            onPick={onPick}
            art={<img src="/art/kit/neon-reels.webp" alt="" className={cn(ART, '-bottom-6 -right-6 h-[88%] w-auto mix-blend-screen [mask-image:radial-gradient(closest-side,#000_84%,transparent_100%)]')} />}
          />
        </li>
        <li>
          <SmallRoom
            id="hold-and-win"
            hue="gold"
            on={cat === 'hold-and-win'}
            onPick={onPick}
            art={<img src="/art/lobby/giveaway-chest.webp" alt="" className={cn(ART, '-bottom-4 -right-6 h-[78%] w-auto')} />}
          />
        </li>
        <li>
          <SmallRoom
            id="fish"
            hue="teal"
            on={cat === 'fish'}
            onPick={onPick}
            art={
              <span aria-hidden className={cn(ART, '-bottom-6 -right-3 h-[190px] w-[176px] w1920:-bottom-6 w1920:right-2 w1920:h-[240px] w1920:w-[236px]')}>
                {FISH.slice(0, 2).map((g, i) => (
                  <img
                    key={g.id}
                    src={g.image}
                    alt=""
                    className={cn('absolute bottom-0 aspect-[3/4] w-[104px] rounded-[16px] object-cover shadow-2 ring-1 ring-white/30 w1920:w-[140px]', i === 0 ? 'left-0 -rotate-[8deg]' : 'right-0 rotate-[6deg]')}
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
            art={<img src="/art/landing/girl-offshoulder.webp" alt="" className={cn(ART, 'bottom-[-36%] right-[-4px] h-[128%] w-auto max-w-none')} />}
          />
        </li>
      </ul>
    </section>
  );
}
