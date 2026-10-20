import type { CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../../../lib/cn';
import { ROOMS } from '../shared/data';
import type { Category } from '../../../data/games';
import { Live } from './ui';

// The four category cards, round 8 (notes 2 to 4). Three treatments on the same cards, the same art and
// the same click targets, picked with ?cards=1, 2 or 3 (1 when absent). Rules for all three, from the
// taste log of 2026-10-20. No coloured border or rim, no slide-in arrow or other hover icon, the hue
// only as light behind or under the art, the title in the page's one heading style at one size, the
// count as one line under it. No card face is taller than 360px (round 7).
//
// 1 Lit stage. The round 7 stage without its rim and arrow. A dark panel face, the art large and
//   breaking out of the top edge on a lit floor with a contact shadow, a soft hue light behind it. On
//   hover the art lifts 6px and one sheen band crosses the card.
// 2 Deep hue. A two stop face, the hue at the top falling to the panel colour at the bottom, no edge.
//   The title large on the left, the art large on the right, cut by the card. On hover the art lifts
//   and turns 3 degrees.
// 3 Compact tiles. About 160px tall, shortcuts under the games grid. A quiet face with the hue as a light
//   behind the art, the art on the right edge cut by the card, the title and count on the left. On
//   hover the face brightens and the art lifts.
//
// Under 768px wide, 1 runs as a side scrolling row with the next card peeking, 2 and 3 as a two by two
// grid. Placement lives in neon.css, keyed by data-cat and data-part.

export const CARD_TREATMENTS = [
  { value: '1', label: 'Lit stage' },
  { value: '2', label: 'Deep hue' },
  { value: '3', label: 'Compact tiles' },
] as const;
type Look = (typeof CARD_TREATMENTS)[number]['value'];

function useLook(): Look {
  const [params] = useSearchParams();
  const v = params.get('cards');
  return v === '2' || v === '3' ? v : '1';
}

const players = (c: Category) => ROOMS.find((r) => r.id === c)?.players ?? 0;

/** One piece of art. w and h are its source pixels, so it is never drawn larger. style places it on the lit stage. */
type Art = { src: string; w: number; h: number; style?: CSSProperties; className?: string };

type Tile = {
  id: 'slots' | 'megaways' | 'hold' | 'refer';
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
    id: 'slots',
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
    id: 'megaways',
    hue: 'blue',
    title: 'Megaways',
    count: players('megaways'),
    line: 'playing',
    countLabel: 'playing megaways',
    art: [
      { src: '/art/landing/pillar-gems-b.webp', w: 285, h: 800, className: 'n1-cat-back', style: { '--dx': '0.12', '--b': 'calc(var(--floor) + 6%)', '--top': '8%' } as CSSProperties },
      { src: '/art/landing/pillar-gems-a.webp', w: 267, h: 800, style: { '--dx': '-0.09' } as CSSProperties },
    ],
    filter: 'megaways',
  },
  {
    id: 'hold',
    hue: 'ember',
    title: 'Hold & win',
    count: players('hold-and-win'),
    line: 'playing',
    countLabel: 'playing hold and win',
    art: [{ src: '/art/lobby/giveaway-chest.webp', w: 420, h: 420, className: 'n1-cat-wide' }],
    filter: 'hold-and-win',
  },
  {
    // Cropped above the knee, so on the stage she sinks into the floor haze instead of standing on it.
    id: 'refer',
    hue: 'green',
    title: 'Refer',
    count: 12,
    line: 'joined this week',
    countLabel: 'friends joined this week',
    art: [{ src: '/art/money/refer-megaphone.webp', w: 452, h: 640, className: 'n1-cat-sink', style: { '--dx': '0.03', '--b': 'calc(var(--floor) - 34px)' } as CSSProperties }],
    to: '/refer',
  },
];

const artVars = (a: Art) => ({ '--ar': `${a.w} / ${a.h}`, '--mh': `${a.h}px`, '--src': `url('${a.src}')` }) as CSSProperties;

/** The art on the lit stage, treatment 1. It stands on its own pool of light with a contact shadow. */
function Figure({ a }: { a: Art }) {
  return (
    <span aria-hidden className={cn('n1-cat-fig', a.className)} style={{ ...artVars(a), ...a.style }}>
      <span className="n1-cat-pool" />
      <span className="n1-cat-shadow" />
      <span className="n1-cat-art">
        <img src={a.src} alt="" />
        <span className="n1-cat-wrap" />
      </span>
    </span>
  );
}

/** The art cut by the card's edges, treatments 2 and 3. */
function Cut({ a, part }: { a: Art; part: number }) {
  return (
    <span aria-hidden data-part={part} className="n1-cut" style={artVars(a)}>
      <span className="n1-cat-art">
        <img src={a.src} alt="" />
        <span className="n1-cat-wrap" />
      </span>
    </span>
  );
}

export function Tiles({ onPick }: { onPick: (c: Category) => void }) {
  const look = useLook();
  return (
    <ul aria-label="Categories" data-cards={look} className={cn('n1-cats', `n1-cats-${look}`)}>
      {TILES.map((t) => {
        const cls = cn('n1-cat n1-ring', `n1-hue-${t.hue}`);
        const inner = (
          <>
            <span aria-hidden className="n1-cat-face">
              <span className="n1-mark absolute inset-0" />
              {look === '1' && <span className="n1-cat-sheen" />}
            </span>
            {look === '1' ? (
              t.art.map((a) => <Figure key={a.src} a={a} />)
            ) : (
              <span aria-hidden className="n1-cat-clip">
                <span className="n1-cat-light" />
                {t.art.map((a, i) => (
                  <Cut key={a.src} a={a} part={i} />
                ))}
              </span>
            )}
            <span className="n1-cat-text">
              <span className="n1-cat-title font-display font-bold text-ink">{t.title}</span>
              <span className="n1-cat-count">
                <Live />
                <span>
                  <span className="num text-ink">{t.count.toLocaleString('en-US')}</span> {t.line}
                </span>
              </span>
            </span>
          </>
        );
        return (
          <li key={t.id} className="n1-cat-cell">
            {t.to ? (
              <Link to={t.to} data-cat={t.id} className={cls} aria-label={`Refer a friend, ${t.count} ${t.countLabel}`}>
                {inner}
              </Link>
            ) : (
              <button type="button" data-cat={t.id} onClick={() => onPick(t.filter!)} className={cls} aria-label={`${t.title} games, ${t.count} ${t.countLabel}`}>
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
