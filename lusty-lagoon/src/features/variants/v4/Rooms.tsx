import type { CSSProperties, ReactNode } from 'react';
import { CaretDoubleDown, CaretRight, Check } from '@phosphor-icons/react';
import { gameById, type CatalogueGame, type Category } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { LIVE_WINS, ROOMS } from '../shared/data';
import { FLOOR, WIN_MULT, countIn, formatMult, type CategoryFilter } from './data';
import { WRAP } from './icons';
import { Caps, Dial, Key } from './ui';

// The rooms bento, the floor's signature, in CS2's frames. Each room keeps its hue as the art layer,
// a deep base of the hue with a strong light where the art stands, a tick dial behind the art like
// CS2's WIN dial, and a 2px line in the room's hue along the floor. One clipped corner, top right.
// Every character stands whole on the frame floor, with its head clear of the top edge, and nothing
// renders over its source size. Hover keeps the frame in place, the edge lights in the room's hue,
// the dial turns and the art scales 1.04 inside.

const room = (id: Category) => ROOMS.find((r) => r.id === id)!;
const games = (n: number) => `${n} ${n === 1 ? 'game' : 'games'}`;
const handle = (name: string) => name.replace(/\s|\./g, '').toLowerCase();

const HOT_SLOTS = ['sugar-rush', 'gates-of-olympus', 'starlight-princess'].map((id) => FLOOR.find((g) => g.id === id)!);
const FISH = FLOOR.filter((g) => g.category === 'fish');
const TOP_RTP = Math.max(...FLOOR.filter((g) => g.category === 'slots').map((g) => g.rtp));

/** Today's biggest USDT win in a slot, from the live feed, for the lead room. */
const TOP_SLOT_WIN = LIVE_WINS.filter((w) => w.coin === 'usdt' && gameById(w.gameId)?.category === 'slots').sort((a, b) => b.amount - a.amount)[0];

/** The live count in an angled chip, green dot, tabular number. */
function LiveChip({ players, on }: { players: number; on: boolean }) {
  return (
    <span className="relative z-10 flex h-[28px] w-fit items-center gap-2 px-3 text-12 font-bold uppercase tracking-[0.08em] text-ink">
      <span aria-hidden className="absolute inset-0 -z-10 skew-x-[-14deg] rounded-[3px] border border-white/[0.14] bg-black/35" />
      {on ? <Check weight="bold" className="h-[12px] w-[12px] text-[#C9A2FF]" aria-hidden /> : <span aria-hidden className="v4-live" />}
      <span className="num">{players.toLocaleString('en-US')}</span> {on ? 'playing, showing' : 'playing'}
    </span>
  );
}

/** Two large faint chevrons pointing at the art, CS2's marks either side of its dial. */
function Chevrons({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 200" className={cn('pointer-events-none absolute', className)}>
      <path d="M0 0 L46 0 L106 100 L46 200 L0 200 L60 100 Z" fill="white" fillOpacity="0.05" />
      <path d="M52 40 L74 40 L110 100 L74 160 L52 160 L88 100 Z" fill="white" fillOpacity="0.07" />
    </svg>
  );
}

/**
 * A small room. The whole frame is one button that sets the room and scrolls to the finder. Title
 * top left, the art standing on a sunken strip along the floor that holds the room's numbers, CS2's
 * Wager Amount strip.
 */
function SmallRoom({ id, tone, on, onPick, dial, art, artAt }: { id: Category; tone: string; on: boolean; onPick: (c: CategoryFilter) => void; dial: { hue: string }; art: ReactNode; artAt?: string }) {
  const r = room(id);
  const n = countIn(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${r.label}, ${r.blurb}. ${r.players} playing, ${games(n)}. Show this room`}
      onClick={() => onPick(id)}
      style={artAt ? ({ '--lx': artAt, '--ly': '52%' } as CSSProperties) : undefined}
      className={cn('v4-cut v4-room group block h-full w-full overflow-hidden text-left outline-none [--cut:20px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white', tone, on && '[--edge:rgb(180_124_255)] shadow-[inset_0_0_0_2px_rgb(180_124_255)]')}
    >
      <span aria-hidden className="v4-hatch absolute inset-0" />
      <Dial hue={dial.hue} className="right-0 top-[52px] h-[176px] w-[176px] w1920:right-[16px] w1920:top-[24px] w1920:h-[256px] w1920:w-[256px]" />
      {art}
      <span className="absolute left-6 top-6 z-10 flex flex-col gap-2">
        <span className="whitespace-nowrap font-display text-28 font-bold uppercase leading-[30px] tracking-[0.01em] text-ink">{r.label}</span>
        <span className="max-w-[148px] text-14 font-medium leading-5 text-[rgb(var(--v4-soft))] [text-wrap:balance] w1920:max-w-[220px]">{r.blurb}</span>
      </span>
      <span className="absolute inset-x-0 bottom-0 z-10 flex h-[60px] items-center gap-4 border-t border-white/[0.08] bg-[#0E0D14]/55 pl-6 pr-4 backdrop-blur-[8px]">
        <dl className="flex items-center gap-4">
          <div className="flex flex-col">
            <dt className="text-12 font-bold uppercase leading-4 tracking-[0.08em] text-[rgb(var(--v4-soft))]">{on ? 'Showing' : 'Playing'}</dt>
            <dd className="num flex items-center gap-2 text-20 font-bold leading-6 text-ink">
              {on ? <Check weight="bold" className="h-4 w-4 text-[#C9A2FF]" aria-hidden /> : <span aria-hidden className="v4-live" />}
              {r.players.toLocaleString('en-US')}
            </dd>
          </div>
          <span aria-hidden className="h-8 w-[1px] bg-white/[0.12]" />
          <div className="flex flex-col">
            <dt className="text-12 font-bold uppercase leading-4 tracking-[0.08em] text-[rgb(var(--v4-soft))]">Games</dt>
            <dd className="num text-20 font-bold leading-6 text-ink">{n}</dd>
          </div>
        </dl>
        <span aria-hidden className="relative ml-auto flex h-8 w-10 items-center justify-center text-ink transition-transform duration-200 group-hover:translate-x-[2px]">
          <span className="absolute inset-0 skew-x-[-14deg] rounded-[3px] border border-white/[0.14] bg-white/[0.06] transition-colors duration-200 group-hover:bg-white/[0.14]" />
          <CaretRight weight="bold" className="relative h-4 w-4" />
        </span>
      </span>
    </button>
  );
}

/** A cover in a small angular frame, a button when it can open the game. */
function MiniCover({ game, className, onPlay }: { game: CatalogueGame; className?: string; onPlay?: (g: CatalogueGame) => void }) {
  const img = <img src={game.image} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/c:scale-[1.06]" />;
  if (!onPlay)
    return (
      <span aria-hidden className={cn('v4-cut block overflow-hidden bg-[rgb(var(--v4-well))] [--cut:10px] [--edge:rgb(255_255_255/0.24)]', className)}>
        {img}
      </span>
    );
  return (
    <button
      type="button"
      onClick={() => onPlay(game)}
      aria-label={`Play ${game.name}, ${game.provider}`}
      className={cn('v4-cut v4-cover group/c block overflow-hidden bg-[rgb(var(--v4-well))] outline-none [--edge:rgb(255_255_255/0.22)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white', className)}
    >
      {img}
    </button>
  );
}

export function Rooms({ cat, onPick, onPlay }: { cat: CategoryFilter; onPick: (c: CategoryFilter) => void; onPlay: (g: CatalogueGame) => void }) {
  const slots = room('slots');
  const nSlots = countIn('slots');
  const on = cat === 'slots';
  const top = TOP_SLOT_WIN;
  const topGame = gameById(top.gameId)!;
  return (
    <section aria-labelledby="rooms-title" className={cn(WRAP, 'pt-4')}>
      <h2 id="rooms-title" className="sr-only">
        Rooms
      </h2>
      <ul className="grid grid-cols-4 grid-rows-[292px_292px] gap-4 w1920:grid-rows-[340px_340px]">
        <li className="col-span-2 row-span-2">
          <article aria-labelledby="room-slots" className={cn('v4-cut v4-room v4-room-slots group h-full overflow-hidden [--cut:28px] [--lx:72%] [--ly:56%]', on && '[--edge:rgb(180_124_255)] shadow-[inset_0_0_0_2px_rgb(180_124_255)]')}>
            <span aria-hidden className="v4-hatch absolute inset-0" />
            <Chevrons className="left-[300px] top-[230px] h-[150px] w-[90px] w1920:left-[392px] w1920:top-[262px] w1920:h-[180px] w1920:w-[108px]" />
            <Dial hue="#B47CFF" className="left-[290px] top-[40px] h-[500px] w-[500px] w1920:left-[420px] w1920:top-[40px] w1920:h-[600px] w1920:w-[600px]" />
            <img src="/art/landing/slot-machine.webp" alt="" className="v4-art pointer-events-none absolute bottom-0 right-[176px] h-[330px] w-auto w1920:right-[250px] w1920:h-[400px]" />
            <img src="/art/landing/girl-lei.webp" alt="" className="v4-art pointer-events-none absolute bottom-0 right-[8px] h-[572px] w-auto max-w-none w1920:right-[40px] w1920:h-[668px]" />

            <div className="absolute left-8 top-[28px] z-10 flex w-[300px] flex-col w1920:top-8 w1920:w-[360px]">
              <LiveChip players={slots.players} on={on} />
              <h3 id="room-slots" className="mt-3 font-display text-[64px] font-bold uppercase leading-[60px] tracking-[-0.01em] text-ink">
                {slots.label}
              </h3>
              <p className="mt-1 text-16 font-medium leading-6 text-[rgb(var(--v4-soft))]">{slots.blurb}</p>
              <dl className="relative mt-4 flex w-fit gap-6 py-3 pl-4 pr-12 w1920:mt-6">
                <span aria-hidden className="absolute inset-0 bg-[#0E0D14]/45 [clip-path:polygon(0_0,100%_0,calc(100%-24px)_100%,0_100%)]" />
                <div className="relative flex flex-col gap-1">
                  <Caps as="dt" className="text-[rgb(var(--v4-soft))]">Games</Caps>
                  <dd className="num text-28 font-bold leading-8 text-ink">{nSlots}</dd>
                </div>
                <span aria-hidden className="relative w-[1px] self-stretch bg-white/[0.14]" />
                <div className="relative flex flex-col gap-1">
                  <Caps as="dt" className="text-[rgb(var(--v4-soft))]">Best return</Caps>
                  <dd className="num text-28 font-bold leading-8 text-ink">{TOP_RTP.toFixed(1)}%</dd>
                </div>
              </dl>
              <dl className="mt-4 flex flex-col gap-1 border-l-2 border-[#F4D543] pl-4 w1920:mt-6">
                <Caps as="dt" className="text-[rgb(var(--v4-soft))]">Top win today</Caps>
                <dd className="num flex items-center gap-3 text-28 font-bold leading-8 text-[#F4D543]">
                  <span>
                    {formatAmount(top.amount, 0)} <span className="text-14 font-bold">USDT</span>
                  </span>
                  <span className="flex h-6 items-center rounded-[3px] bg-[#F4D543]/[0.16] px-2 text-12 font-bold leading-none">{formatMult(WIN_MULT[top.id] ?? 1)}</span>
                </dd>
                <dd className="truncate text-12 font-semibold leading-4 text-[rgb(var(--v4-soft))]">
                  {handle(top.player)} on {topGame.name}
                </dd>
              </dl>
            </div>

            <div className="absolute bottom-[28px] left-8 z-10 flex flex-col gap-[20px] w1920:bottom-8 w1920:gap-6">
              <div className="flex flex-col gap-2">
                <Caps className="text-[rgb(var(--v4-soft))]">Hot in slots</Caps>
                <div className="flex gap-2">
                  {HOT_SLOTS.map((g) => (
                    <MiniCover key={g.id} game={g} onPlay={onPlay} className="h-[100px] w-[75px] w1920:h-[128px] w1920:w-[96px]" />
                  ))}
                </div>
              </div>
              <Key tone="orange" shape="trap" size="lg" onClick={() => onPick('slots')} className="w-fit">
                Browse {nSlots} slots
                <CaretDoubleDown weight="bold" className="h-5 w-5" aria-hidden />
              </Key>
            </div>
          </article>
        </li>
        <li>
          <SmallRoom
            id="megaways"
            tone="v4-room-blue"
            on={cat === 'megaways'}
            onPick={onPick}
            artAt="72%"
            dial={{ hue: '#5AA9FF' }}
            art={<img src="/art/kit/neon-reels.webp" alt="" className="v4-art pointer-events-none absolute bottom-[60px] right-[-4px] h-[184px] w-auto mix-blend-screen [mask-image:radial-gradient(closest-side,#000_80%,transparent_100%)] w1920:bottom-[60px] w1920:right-[16px] w1920:h-[256px]" />}
          />
        </li>
        <li>
          <SmallRoom
            id="hold-and-win"
            tone="v4-room-gold"
            on={cat === 'hold-and-win'}
            onPick={onPick}
            artAt="74%"
            dial={{ hue: '#F4D543' }}
            art={<img src="/art/lobby/giveaway-chest.webp" alt="" className="v4-art pointer-events-none absolute bottom-[58px] right-[8px] h-[160px] w-auto w1920:bottom-[60px] w1920:right-[26px] w1920:h-[236px]" />}
          />
        </li>
        <li>
          <SmallRoom
            id="fish"
            tone="v4-room-teal"
            on={cat === 'fish'}
            onPick={onPick}
            artAt="72%"
            dial={{ hue: '#3BC9DB' }}
            art={
              <span aria-hidden className="v4-art pointer-events-none absolute bottom-[72px] right-[13px] h-[150px] w-[150px] w1920:bottom-[78px] w1920:right-[34px] w1920:h-[220px] w1920:w-[220px]">
                <MiniCover game={FISH[1]} className="absolute right-0 top-0 h-[112px] w-[84px] w1920:h-[165px] w1920:w-[124px]" />
                <MiniCover game={FISH[0]} className="absolute bottom-0 left-0 h-[112px] w-[84px] shadow-[0_12px_24px_rgb(0_0_0/0.45)] w1920:h-[165px] w1920:w-[124px]" />
              </span>
            }
          />
        </li>
        <li>
          <SmallRoom
            id="new"
            tone="v4-room-pink"
            on={cat === 'new'}
            onPick={onPick}
            artAt="74%"
            dial={{ hue: '#FF7AAE' }}
            art={<img src="/art/landing/girl-offshoulder.webp" alt="" className="v4-art pointer-events-none absolute bottom-0 right-[7px] h-[272px] w-auto max-w-none w1920:right-[33px] w1920:h-[320px]" />}
          />
        </li>
      </ul>
    </section>
  );
}
