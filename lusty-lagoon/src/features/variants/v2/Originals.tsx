import type { CSSProperties, ReactNode } from 'react';
import { ArrowDown, ArrowRight, Sparkle } from '@phosphor-icons/react';
import { gameById, type Category } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { countOf, playersIn } from './data';
import { SectionTitle, Skel } from './ui';
import { ONLINE_NOW } from '../shared/data';

// The originals row, round 7, plan line J, read against Betsera's Originals row. Six portrait cards at
// 3 to 4, all one size. The face is dark purple and the category hue comes in only as light, a glow
// behind the art, a lit floor under it and a tint at the top, so six hues sit together. The art is the
// card, standing on the floor with a contact shadow and a hue rim, about 120 percent of the card high
// so it breaks out of the top edge. Under the floor the title in the heading face at one size, and the
// live count as one line. Sizes live in v2.css under Originals cards, per width.

type Card = { key: Category | 'live'; title: string; label: string; hue: string; count: number; countLabel: string; art: ReactNode };

/** A game cover stood up on the floor, lit from below in the card's hue. */
function Cover({ id, className, position }: { id: string; className: string; position?: string }) {
  const g = gameById(id)!;
  return (
    <span className={cn('m2-oc-cover absolute', className)}>
      <img src={g.image} alt="" className="h-full w-full rounded-[12px] object-cover" style={position ? { objectPosition: position } : undefined} />
    </span>
  );
}

/** Three covers on the floor, the lead one tall in front, two further back leaning out at its sides. */
function Trio({ lead, left, right, leftPosition, small }: { lead: string; left: string; right: string; leftPosition?: string; small?: boolean }) {
  return (
    <>
      <Cover id={left} className={cn('m2-oc-side m2-oc-side-l', small && 'm2-oc-side-sm')} position={leftPosition} />
      <Cover id={right} className={cn('m2-oc-side m2-oc-side-r', small && 'm2-oc-side-sm')} />
      <Cover id={lead} className="m2-oc-lead" />
    </>
  );
}

const CARDS: Card[] = [
  {
    key: 'slots',
    title: 'Slots',
    label: 'Slots',
    hue: '255 92 176',
    count: playersIn('slots'),
    countLabel: 'playing',
    art: <img src="/art/landing/slot-machine.webp" alt="" width={531} height={900} className="m2-oc-cut m2-oc-full absolute left-1/2 -translate-x-1/2" />,
  },
  {
    key: 'megaways',
    title: 'Megaways',
    label: 'Megaways',
    hue: '92 148 255',
    count: playersIn('megaways'),
    countLabel: 'playing',
    // Two reel towers leaning apart, more reels being the point of Megaways. The far one stands back.
    art: (
      <>
        <img src="/art/landing/pillar-gems-b.webp" alt="" width={285} height={800} className="m2-oc-cut m2-oc-tower-back absolute" />
        <img src="/art/landing/pillar-gems-a.webp" alt="" width={267} height={800} className="m2-oc-cut m2-oc-tower absolute" />
      </>
    ),
  },
  {
    key: 'hold-and-win',
    title: 'Hold & win',
    label: 'Hold and win',
    hue: '255 132 56',
    count: playersIn('hold-and-win'),
    countLabel: 'playing',
    art: <Trio lead="diamond-king-gold" left="coins-of-alkemor" right="boom-boom-gold" />,
  },
  {
    key: 'fish',
    title: 'Fish',
    label: 'Fish games',
    hue: '40 206 222',
    count: playersIn('fish'),
    countLabel: 'playing',
    // The landscape Lucky Bass cover stands up on its fish, which sits left of centre.
    art: <Trio lead="big-bass-splash" left="lucky-bass" right="beware-the-deep" leftPosition="40% 50%" small />,
  },
  {
    key: 'new',
    title: 'New',
    label: 'New games',
    hue: '176 120 255',
    count: countOf('new'),
    countLabel: 'this week',
    // The neon machine keyed out of its own dark ground by its light, so only the neon stands on the floor.
    art: <img src="/art/kit/neon-reels.webp" alt="" width={512} height={512} className="m2-oc-neon absolute left-1/2 -translate-x-1/2" />,
  },
  {
    key: 'live',
    title: 'Live',
    label: 'Live bets',
    hue: '72 214 128',
    count: ONLINE_NOW,
    countLabel: 'online',
    art: <img src="/art/auth/register-player.webp" alt="" width={601} height={1000} className="m2-oc-cut m2-oc-host absolute left-1/2 -translate-x-1/2" />,
  },
];

export function Originals({ onPick, onLive, onAll, loading }: { onPick: (c: Category) => void; onLive: () => void; onAll: () => void; loading?: boolean }) {
  return (
    <section aria-labelledby="m2-originals" className="m2-oc-sec relative">
      <div className="flex h-11 items-center justify-between gap-4">
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
      <div className="m2-oc-row grid grid-cols-6 gap-4">
        {CARDS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => (c.key === 'live' ? onLive() : onPick(c.key))}
            aria-label={`${c.label}, ${formatAmount(c.count, 0)} ${c.countLabel}${c.key === 'live' ? ', jump to live bets' : ''}`}
            style={{ '--oc': c.hue } as CSSProperties}
            className="m2-oc group relative block h-full w-full rounded-[24px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--m2-ground))]"
          >
            <span aria-hidden className="m2-oc-face absolute inset-0 overflow-hidden rounded-[24px]">
              <span className="m2-oc-glow absolute inset-0" />
              <span className="m2-oc-floor absolute" />
            </span>
            <span aria-hidden className="m2-oc-art absolute inset-x-0 bottom-0">
              <span className="m2-oc-shadow absolute" />
              <span className="m2-oc-obj absolute inset-0">{c.art}</span>
            </span>
            <span aria-hidden className="m2-oc-fade absolute inset-x-0 bottom-0 rounded-b-[24px]" />
            <span aria-hidden className="m2-oc-text absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2">
              <span className="flex min-w-0 flex-col">
                <span className="m2-oc-title truncate font-display font-bold tracking-[-0.01em] text-ink">{c.title}</span>
                <span className="m2-oc-count mt-1 flex items-center gap-2 whitespace-nowrap font-semibold text-[rgb(var(--m2-ink2))]">
                  {loading ? (
                    <Skel className="h-[8px] w-16 rounded-full opacity-60" />
                  ) : (
                    <>
                      {c.key === 'new' ? <Sparkle weight="fill" className="h-[12px] w-[12px] text-[#C9A2FF]" /> : <span className="k-live" />}
                      <span>
                        <span className="num text-ink">{formatAmount(c.count, 0)}</span> {c.countLabel}
                      </span>
                    </>
                  )}
                </span>
              </span>
              <span className="m2-oc-go flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <ArrowRight weight="bold" className="h-4 w-4 text-ink" />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
