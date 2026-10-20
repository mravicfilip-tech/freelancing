import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { ROOMS } from '../shared/data';
import type { Category } from '../../../data/games';
import { Live } from './ui';

// The four category cards, round 7 (note 21, plan line J), after Betsera's Originals row. Portrait
// 3 to 4 on a dark purple face, the category hue as light (a top tint, a glow behind and under the
// art, a lit pool on the floor, a rim on the art). The art is the card, it stands on the floor above
// the title and breaks out of the top edge. The title keeps the page's one heading style at one size,
// with the live count under it as one line, both on the 16px inset set this morning (notes 2 and 4).
// Hover lifts the art 6px and grows it 4 percent, brightens the glow and slides an arrow in.

const players = (c: Category) => ROOMS.find((r) => r.id === c)?.players ?? 0;

/** One piece of art. w and h are its source pixels, so it is never drawn larger. */
type Art = { src: string; w: number; h: number; style?: CSSProperties; className?: string };

type Tile = {
  hue: 'purple' | 'blue' | 'ember' | 'green';
  title: string;
  count: number;
  line: string;
  countLabel: string;
  art: Art[];
  filter?: Category;
  to?: string;
};

const TILES: Tile[] = [
  {
    hue: 'purple',
    title: 'Slots',
    count: players('slots'),
    line: 'playing',
    countLabel: 'playing slots',
    art: [{ src: '/art/landing/slot-machine.webp', w: 531, h: 900 }],
    filter: 'slots',
  },
  {
    // Two reel columns of different heights, the way a Megaways reel set reads. The back one stands
    // further away, smaller and darker.
    hue: 'blue',
    title: 'Megaways',
    count: players('megaways'),
    line: 'playing',
    countLabel: 'playing megaways',
    art: [
      { src: '/art/landing/pillar-gems-b.webp', w: 285, h: 800, className: 'n1-cat-back', style: { '--x': '66%', '--b': 'calc(var(--floor) + 6%)', '--top': '8%' } as CSSProperties },
      { src: '/art/landing/pillar-gems-a.webp', w: 267, h: 800, style: { '--x': '38%' } as CSSProperties },
    ],
    filter: 'megaways',
  },
  {
    hue: 'ember',
    title: 'Hold & win',
    count: players('hold-and-win'),
    line: 'playing',
    countLabel: 'playing hold and win',
    art: [{ src: '/art/lobby/giveaway-chest.webp', w: 420, h: 420, className: 'n1-cat-wide', style: { '--b': 'calc(var(--floor) - 2%)' } as CSSProperties }],
    filter: 'hold-and-win',
  },
  {
    // Cropped above the knee, so she sinks into the floor haze instead of standing on it.
    hue: 'green',
    title: 'Refer',
    count: 12,
    line: 'joined this week',
    countLabel: 'friends joined this week',
    art: [{ src: '/art/money/refer-megaphone.webp', w: 452, h: 640, className: 'n1-cat-sink', style: { '--x': '54%', '--b': 'calc(var(--floor) - 34px)' } as CSSProperties }],
    to: '/refer',
  },
];

function Figure({ a }: { a: Art }) {
  const style = { '--ar': `${a.w} / ${a.h}`, '--mh': `${a.h}px`, '--src': `url('${a.src}')`, ...a.style } as CSSProperties;
  return (
    <span aria-hidden className={cn('n1-cat-fig', a.className)} style={style}>
      <span className="n1-cat-pool" />
      <span className="n1-cat-shadow" />
      <span className="n1-cat-art">
        <img src={a.src} alt="" />
        <span className="n1-cat-wrap" />
      </span>
    </span>
  );
}

export function Tiles({ onPick }: { onPick: (c: Category) => void }) {
  return (
    <ul aria-label="Categories" className="n1-cats grid grid-cols-4 gap-4">
      {TILES.map((t) => {
        const cls = cn('n1-cat n1-ring group', `n1-hue-${t.hue}`);
        const inner = (
          <>
            <span aria-hidden className="n1-cat-face">
              <span className="n1-mark absolute inset-0" />
            </span>
            {t.art.map((a) => (
              <Figure key={a.src} a={a} />
            ))}
            <span className="absolute inset-x-4 bottom-4 z-10 flex flex-col gap-1">
              <span className="whitespace-nowrap font-display text-28 font-bold leading-[28px] tracking-[-0.01em] text-ink">{t.title}</span>
              <span className="flex items-center gap-2 whitespace-nowrap text-14 font-semibold leading-5 text-[rgb(var(--n-muted))]">
                <Live />
                <span>
                  <span className="num text-ink">{t.count.toLocaleString('en-US')}</span> {t.line}
                </span>
                <span aria-hidden className="n1-cat-arrow ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink">
                  <ArrowRight weight="bold" className="h-3 w-3" />
                </span>
              </span>
            </span>
          </>
        );
        return (
          <li key={t.title} className="n1-cat-cell">
            {t.to ? (
              <Link to={t.to} className={cls} aria-label={`Refer a friend, ${t.count} ${t.countLabel}`}>
                {inner}
              </Link>
            ) : (
              <button type="button" onClick={() => onPick(t.filter!)} className={cls} aria-label={`${t.title} games, ${t.count} ${t.countLabel}`}>
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
