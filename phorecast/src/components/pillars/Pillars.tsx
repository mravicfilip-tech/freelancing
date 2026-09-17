import dot from '../../assets/icons/live-dot.svg';
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

/* Every glyph in this band is one flat colour on transparent -- #FFFBF8 for
   the card icons, the chain and the white mark, #9D9D9D for the four pill
   rows, #e5331e for the on-chain mark -- so they are <Icon>s rather than
   <img>s: the file becomes a CSS mask and the paint becomes `color`, set in
   Pillars.css against the token that matches the hex the file bakes. See
   src/components/Icon.tsx. The eyebrow dot is deliberately NOT converted; it
   is three tinted ellipses, and a mask would flatten it to one disc.

   THE BOX. <Icon> writes width/height inline from `w`/`h`, but every glyph
   here is sized by the stylesheet instead -- .pillars__icon is 20x20 and
   .pcard__mark is 31.13x36.29 -- so those two get `cssBox`, which hands the
   box back by writing the inline values away again. The chain and pill3 parts
   are the opposite case: they are absolutely positioned inside a 20x20
   wrapper and their size comes from the export, not from a rule, so they get
   their intrinsic numbers. That distinction is not cosmetic. An <img> is a
   replaced element, so with `width: auto` and all four insets set it takes its
   intrinsic width and drops the over-constrained inset; a <span> is not
   replaced and would solve its box from the insets alone. The two agree here
   to within a thousandth of a pixel because Figma exported both consistently,
   but only one of them is the size the artwork was drawn at. */
const cssBox = { width: undefined, height: undefined };

/* Inset, then intrinsic width and height, straight from the Figma export. */
const CHAIN_PARTS: [string, number, number][] = [
  ['0 0 34.52% 31.97%', 13.6054, 13.0963],
  ['34.52% 31.93% 0 0', 13.613, 13.096],
  ['76.06% 13.89% 13.93% 76.1%', 2.00151, 2.00154],
  ['13.89% 76.06% 76.1% 13.93%', 2.00158, 2.00154],
  ['57.67% 1.76% 34.95% 86.72%', 2.30492, 1.4764],
  ['34.91% 86.68% 57.71% 1.79%', 2.305, 1.4764],
  ['86.68% 34.91% 1.79% 57.71%', 1.47636, 2.3053],
  ['1.75% 57.67% 86.72% 34.95%', 1.47639, 2.30497],
];
const PILL3_PARTS: [string, number, number][] = [
  ['0.02% 35.35% 72.48% 35.35%', 5.85943, 5.50106],
  ['17.88% 0 54.61% 70.71%', 5.85942, 5.50048],
  ['17.88% 70.7% 54.61% 0', 5.85943, 5.50059],
  ['32.6% 23.63% 0.02% 23.64%', 10.5469, 13.4765],
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
    title: 'Trading Fee',
    body: 'A simple commission per side on every executed trade.',
  },
  {
    eyebrow: 'Seconds',
    icon: <Icon src={iconClock} w={20} h={20} className="pillars__icon" style={cssBox} />,
    mark: markWhite,
    title: 'Fast Onboarding',
    body: 'Get started with just an email or wallet.',
  },
  {
    eyebrow: 'Instant withdrawals',
    icon: <MultiIcon parts={CHAIN_PARTS} map={chain} prefix="chain" />,
    mark: markOrange,
    /* The one accent mark in the band: #e5331e in the file, --accent on the
       element, so it follows the brand red to #a21605 on paper while its two
       siblings follow --ink. The distinction between the three cards is the
       whole reason two near-identical exports of the same path exist. */
    markAccent: true,
    title: 'On-Chain',
    body: 'A simple commission per side on every executed trade.',
    fixed: true,
  },
];

const ROWS = [
  { label: 'Fast Access', icon: <Icon src={pill1} w={20} h={20} className="pillars__icon" style={cssBox} /> },
  { label: 'Full Control', icon: <Icon src={pill2} w={20} h={20} className="pillars__icon" style={cssBox} /> },
  { label: 'Familiar Experience', icon: <MultiIcon parts={PILL3_PARTS} map={pill3} prefix="pill3" /> },
  { label: 'Transparent Execution', icon: <Icon src={pill4} w={20} h={20} className="pillars__icon" style={cssBox} /> },
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
          <img src={dot} alt="" className="eyebrow__dot" width={12} height={12} />
          Built for Better Trading
        </p>
        <h2 id="pillars-title" className="pillars__title">
          Modern infrastructure designed around speed, transparency and trader control.
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
