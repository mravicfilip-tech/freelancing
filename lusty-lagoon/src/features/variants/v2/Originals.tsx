import type { ReactNode } from 'react';
import { ArrowDown, Sparkle } from '@phosphor-icons/react';
import { gameById, type Category } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { countOf, playersIn } from './data';
import { SectionTitle, Skel } from './ui';
import { ONLINE_NOW } from '../shared/data';

// The originals row after Betsera, Gamdom and Player 145. Six tall tiles, one hue each, very heavy
// capitals and one 3D object, the lead Slots tile taller so it rises to the heading line. Each tile
// is a column, the capitals on top, a stage for the object, and the live count on a chip at the foot,
// so a two line title never runs into its object.

type Tile = { key: Category | 'live'; title: ReactNode; label: string; hue: string; count: number; countLabel: string; art: ReactNode };

/** Covers stood up as cards, the way Betsera's poker tile stands its cards. */
function CardFan({ ids }: { ids: string[] }) {
  const three = ids.length === 3;
  const turn = three
    ? ['-rotate-[13deg] translate-x-[38px] translate-y-[8px] w1920:translate-x-[54px]', 'z-10', 'rotate-[13deg] -translate-x-[38px] translate-y-[8px] w1920:-translate-x-[54px]']
    : ['-rotate-[11deg] translate-x-[22px] translate-y-[6px] w1920:translate-x-[30px]', 'z-10 rotate-[7deg] -translate-x-[18px] w1920:-translate-x-[26px]'];
  return (
    <span className="m2-obj absolute inset-x-0 bottom-0 top-2 flex items-end justify-center">
      {ids.map((id, i) => (
        <img
          key={id}
          src={gameById(id)!.image}
          alt=""
          className={cn('m2-card aspect-[3/4] shrink-0 rounded-[12px] object-cover', three ? 'w-[70px] w1920:w-[104px]' : 'w-[92px] w1920:w-[120px]', turn[i])}
        />
      ))}
    </span>
  );
}

const TILES: Tile[] = [
  {
    key: 'slots',
    title: 'SLOTS',
    label: 'Slots',
    hue: 'm2-hue-pink',
    count: playersIn('slots'),
    countLabel: 'playing',
    art: (
      <span className="m2-obj absolute inset-0 flex items-end justify-center">
        <img src="/art/landing/slot-machine.webp" alt="" className="h-[212px] w-auto w1920:h-[268px]" />
      </span>
    ),
  },
  {
    key: 'megaways',
    title: (
      <>
        MEGA<wbr />
        WAYS
      </>
    ),
    label: 'Megaways',
    hue: 'm2-hue-blue',
    count: playersIn('megaways'),
    countLabel: 'playing',
    // Two reel towers leaning apart, more reels being the point of Megaways.
    art: (
      <span className="m2-obj absolute inset-x-0 -bottom-[14px] top-0 flex items-end justify-center">
        <img src="/art/landing/pillar-gems-a.webp" alt="" className="h-[132px] w-auto translate-x-[10px] rotate-[-11deg] w1920:h-[224px] w1920:translate-x-[16px]" />
        <img src="/art/landing/pillar-gems-a.webp" alt="" className="h-[132px] w-auto -translate-x-[10px] rotate-[11deg] -scale-x-100 w1920:h-[224px] w1920:-translate-x-[16px]" />
      </span>
    ),
  },
  {
    key: 'hold-and-win',
    title: (
      <>
        HOLD &amp;<wbr /> WIN
      </>
    ),
    label: 'Hold and win',
    hue: 'm2-hue-amber',
    count: playersIn('hold-and-win'),
    countLabel: 'playing',
    art: <CardFan ids={['coins-of-alkemor', 'boom-boom-gold', 'diamond-king-gold']} />,
  },
  {
    key: 'fish',
    title: 'FISH',
    label: 'Fish games',
    hue: 'm2-hue-teal',
    count: playersIn('fish'),
    countLabel: 'playing',
    art: <CardFan ids={['big-bass-splash', 'beware-the-deep']} />,
  },
  {
    key: 'new',
    title: 'NEW',
    label: 'New games',
    hue: 'm2-hue-violet',
    count: countOf('new'),
    countLabel: 'this week',
    // The neon machine stood up as a card, crisp, in the same card language as the cover fans.
    art: (
      <span className="m2-obj absolute inset-0 flex items-center justify-center">
        <img src="/art/kit/neon-reels.webp" alt="" className="m2-card aspect-square w-[124px] -rotate-[8deg] rounded-[20px] object-cover w1920:w-[172px]" />
      </span>
    ),
  },
  {
    key: 'live',
    title: 'LIVE',
    label: 'Live bets',
    hue: 'm2-hue-green',
    count: ONLINE_NOW,
    countLabel: 'online',
    art: (
      <span className="m2-obj absolute inset-x-0 top-0 flex justify-center">
        <img src="/art/auth/register-player.webp" alt="" className="h-[300px] w-auto max-w-none translate-x-[4%] w1920:h-[380px]" />
      </span>
    ),
  },
];

export function Originals({ onPick, onLive, onAll, loading }: { onPick: (c: Category) => void; onLive: () => void; onAll: () => void; loading?: boolean }) {
  return (
    <section aria-labelledby="m2-originals" className="relative">
      <div className="grid grid-cols-6 items-end gap-4">
        {TILES.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => (t.key === 'live' ? onLive() : onPick(t.key))}
            aria-label={`${t.label}, ${formatAmount(t.count, 0)} ${t.countLabel}${t.key === 'live' ? ', jump to live bets' : ''}`}
            className={cn(
              'm2-tile group flex w-full flex-col overflow-hidden rounded-[24px] text-center outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--m2-ground))]',
              'm2-hue',
              t.hue,
              i === 0 ? 'h-[320px] w1920:h-[372px]' : 'h-[260px] w1920:h-[312px]',
            )}
          >
            <span aria-hidden className="relative z-10 block px-3 pt-4 text-[40px] font-black leading-[36px] tracking-[-0.02em] text-ink [text-wrap:balance]">
              {t.title}
            </span>
            <span aria-hidden className="relative mb-[40px] mt-2 block w-full flex-1">
              {t.art}
            </span>
            <span aria-hidden className="absolute bottom-3 left-1/2 z-20 flex h-6 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-black/45 px-3 text-12 font-bold text-ink backdrop-blur-sm">
              {loading ? (
                <Skel className="h-[8px] w-12 rounded-full opacity-60" />
              ) : (
                <>
                  {t.key === 'new' ? <Sparkle weight="fill" className="h-[12px] w-[12px] text-gold" /> : <span className="k-live" />}
                  <span className="num">{formatAmount(t.count, 0)}</span>
                  <span className="font-semibold text-ink/80">{t.countLabel}</span>
                </>
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="absolute left-[calc((100%-80px)/6+16px)] right-0 top-0 flex h-11 items-center justify-between gap-4">
        <SectionTitle id="m2-originals" icon={<Sparkle weight="fill" className="text-[#C9A2FF]" />}>
          Lagoon originals
        </SectionTitle>
        <button
          type="button"
          onClick={onAll}
          className="m2-box m2-hover flex h-10 items-center gap-2 rounded-full px-4 text-14 font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
        >
          All games
          <ArrowDown weight="bold" className="h-4 w-4 text-[rgb(var(--m2-ink3))]" aria-hidden />
        </button>
      </div>
    </section>
  );
}
