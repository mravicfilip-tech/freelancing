import { LiveDot } from '../LiveDot';
import markWhite from '../../assets/pillars/mark-white.svg';
import markOrange from '../../assets/pillars/mark-orange.svg';
import iconFee from '../../assets/pillars/icon-fee.svg';
import iconClock from '../../assets/pillars/icon-clock.svg';
import pill1 from '../../assets/pillars/pill-1.svg';
import pill2 from '../../assets/pillars/pill-2.svg';
import pill4 from '../../assets/pillars/pill-4.svg';
import { Icon } from '../Icon';
import { useSectionMotion } from '../../lib/motion';
import { buildPillars } from './Pillars.motion';
import './Pillars.css';

const chain = import.meta.glob('../../assets/pillars/chain-*.svg', { eager: true, import: 'default' }) as Record<string, string>;
const pill3 = import.meta.glob('../../assets/pillars/pill3-*.svg', { eager: true, import: 'default' }) as Record<string, string>;

const byName = (m: Record<string, string>, prefix: string, n: number) =>
  m[`../../assets/pillars/${prefix}-${n}.svg`];

/* Every glyph in this band is one flat colour on transparent (#FFFBF8 for
   the card icons, the chain and the white mark, #9D9D9D for the pill rows,
   #e5331e for the on-chain mark), so each is an <Icon>: the file becomes a
   CSS mask and the paint becomes `color`, set in Pillars.css to the token
   that matches the baked hex (see src/components/Icon.tsx). The eyebrow dot
   is three tinted ellipses, which a mask would flatten, so it is <LiveDot>
   instead (see src/components/LiveDot.tsx).

   Sizing. <Icon> writes width/height inline from `w`/`h`. The single-file
   glyphs and the marks are sized by the stylesheet (.pillars__icon 20x20,
   .pcard__mark 31.13x36.29), so they pass `cssBox`, which removes the inline
   size again.

   The chain and pill3 parts are absolutely positioned in a 20x20 wrapper
   with all four insets set. A <span> would solve its box from those insets
   and land up to 1/30px away from the box an <img> of the export occupies
   (an <img> sizes from the file, quantised to 1/64px), which is enough to
   cross a rounding boundary on the star points. The w/h values below are
   those <img> boxes, measured to 1/64px, so the geometry is stated rather
   than derived. */
const cssBox = { width: undefined, height: undefined };

/* Inset from the Figma export, then the used width and height in px. */
const CHAIN_PARTS: [string, number, number][] = [
  ['0 0 34.52% 31.97%', 13.59375, 13.09375],
  ['34.52% 31.93% 0 0', 13.59375, 13.078125],
  ['76.06% 13.89% 13.93% 76.1%', 1.984375, 2],
  ['13.89% 76.06% 76.1% 13.93%', 1.984375, 1.984375],
  ['57.67% 1.76% 34.95% 86.72%', 2.28125, 1.46875],
  ['34.91% 86.68% 57.71% 1.79%', 2.28125, 1.46875],
  ['86.68% 34.91% 1.79% 57.71%', 1.453125, 2.28125],
  ['1.75% 57.67% 86.72% 34.95%', 1.453125, 2.28125],
];
const PILL3_PARTS: [string, number, number][] = [
  ['0.02% 35.35% 72.48% 35.35%', 5.84375, 5.5],
  ['17.88% 0 54.61% 70.71%', 5.84375, 5.5],
  ['17.88% 70.7% 54.61% 0', 5.84375, 5.5],
  ['32.6% 23.63% 0.02% 23.64%', 10.53125, 13.46875],
];

function MultiIcon({ parts, map, prefix }: {
  parts: [string, number, number][];
  map: Record<string, string>;
  prefix: string;
}) {
  return (
    <span className="pillars__icon pillars__icon--multi">
      {parts.map(([inset, w, h], i) => (
        <Icon key={i} src={byName(map, prefix, i + 1)} w={w} h={h} style={{ inset }} />
      ))}
    </span>
  );
}

const CARDS = [
  {
    eyebrow: '0.05%',
    icon: <Icon src={iconFee} w={20} h={20} className="pillars__icon" style={cssBox} />,
    mark: markWhite,
    title: 'Low, Transparent Fees',
    body: 'One clear fee whenever you take a position. No hidden costs.',
  },
  {
    eyebrow: 'Seconds',
    icon: <Icon src={iconClock} w={20} h={20} className="pillars__icon" style={cssBox} />,
    mark: markWhite,
    title: 'Start Forecasting Fast',
    body: 'Join with an email or wallet and go straight to the markets.',
  },
  {
    eyebrow: 'Instant withdrawals',
    icon: <MultiIcon parts={CHAIN_PARTS} map={chain} prefix="chain" />,
    mark: markOrange,
    /* The one accent mark in the band: #e5331e in the file, --accent on the
       element, so it follows the brand red on paper while its two siblings
       follow --ink. This is why two exports of the same path exist. */
    markAccent: true,
    title: 'On-Chain Settlement',
    // U+2011, a non-breaking hyphen: "on-chain" is one word and must not split.
    body: 'Outcomes settle transparently on\u2011chain, with your funds available whenever you need them.',
    fixed: true,
  },
];

const ROWS = [
  { label: 'Fast Access', icon: <Icon src={pill1} w={20} h={20} className="pillars__icon" style={cssBox} /> },
  { label: 'Full Control', icon: <Icon src={pill2} w={20} h={20} className="pillars__icon" style={cssBox} /> },
  { label: 'Intuitive Markets', icon: <MultiIcon parts={PILL3_PARTS} map={pill3} prefix="pill3" /> },
  { label: 'Transparent Settlement', icon: <Icon src={pill4} w={20} h={20} className="pillars__icon" style={cssBox} /> },
];

export function Pillars() {
  // Scroll-gated on the default margin: the band has to climb a quarter of the
  // screen before it opens, so the sliver showing under the section above is
  // not enough to spend the entrance on.
  const ref = useSectionMotion<HTMLElement>(buildPillars);

  return (
    <section ref={ref} className="pillars" aria-labelledby="pillars-title" data-motion="pending">
      <div className="pillars__glow glow-fade" aria-hidden="true">
        <span className="pillars__g pillars__g--red" />
        <span className="pillars__g pillars__g--orange" />
        <span className="pillars__g pillars__g--peach" />
        <span className="pillars__g pillars__g--cream" />
      </div>

      <div className="pillars__inner">
        <p className="eyebrow">
          <LiveDot />
          BUILT FOR BETTER PREDICTION MARKETS
        </p>
        <h2 id="pillars-title" className="pillars__title">
          Fast to enter. Clear to follow. Yours to control.
        </h2>

        <ul className="pillars__cards">
          {CARDS.map((c) => (
            <li key={c.title} className={`pcard${c.fixed ? ' pcard--fixed' : ''}`}>
              <div className="pcard__top">
                <span className="pcard__eyebrow">{c.eyebrow}</span>
                <Icon
                  src={c.mark}
                  w={31.13}
                  h={36.29}
                  className={`pcard__mark${c.markAccent ? ' pcard__mark--accent' : ''}`}
                  style={cssBox}
                />
              </div>
              <div className="pcard__body">
                {c.icon}
                <h3 className="pcard__title">{c.title}</h3>
                <p className="pcard__text">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <ul className="pillars__rows">
          {ROWS.map((r) => (
            <li key={r.label}>
              <button type="button" className="prow">
                <span className="prow__label">{r.icon}{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
