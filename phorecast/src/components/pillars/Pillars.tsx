import dot from '../../assets/icons/live-dot.svg';
import markWhite from '../../assets/pillars/mark-white.svg';
import markOrange from '../../assets/pillars/mark-orange.svg';
import iconFee from '../../assets/pillars/icon-fee.svg';
import iconClock from '../../assets/pillars/icon-clock.svg';
import pill1 from '../../assets/pillars/pill-1.svg';
import pill2 from '../../assets/pillars/pill-2.svg';
import pill4 from '../../assets/pillars/pill-4.svg';
import { useSectionMotion } from '../../lib/motion';
import { buildPillars } from './Pillars.motion';
import './Pillars.css';

const chain = import.meta.glob('../../assets/pillars/chain-*.svg', { eager: true, import: 'default' }) as Record<string, string>;
const pill3 = import.meta.glob('../../assets/pillars/pill3-*.svg', { eager: true, import: 'default' }) as Record<string, string>;

const byName = (m: Record<string, string>, prefix: string, n: number) =>
  m[`../../assets/pillars/${prefix}-${n}.svg`];

/* Insets for the multi-path icons, straight from the Figma export. */
const CHAIN_INSETS = [
  '0 0 34.52% 31.97%', '34.52% 31.93% 0 0', '76.06% 13.89% 13.93% 76.1%',
  '13.89% 76.06% 76.1% 13.93%', '57.67% 1.76% 34.95% 86.72%', '34.91% 86.68% 57.71% 1.79%',
  '86.68% 34.91% 1.79% 57.71%', '1.75% 57.67% 86.72% 34.95%',
];
const PILL3_INSETS = [
  '0.02% 35.35% 72.48% 35.35%', '17.88% 0 54.61% 70.71%',
  '17.88% 70.7% 54.61% 0', '32.6% 23.63% 0.02% 23.64%',
];

function ChainIcon() {
  return (
    <span className="pillars__icon pillars__icon--multi">
      {CHAIN_INSETS.map((inset, i) => (
        <img key={i} src={byName(chain, 'chain', i + 1)} alt="" style={{ inset }} />
      ))}
    </span>
  );
}

function Pill3Icon() {
  return (
    <span className="pillars__icon pillars__icon--multi">
      {PILL3_INSETS.map((inset, i) => (
        <img key={i} src={byName(pill3, 'pill3', i + 1)} alt="" style={{ inset }} />
      ))}
    </span>
  );
}

const CARDS = [
  {
    eyebrow: '0.05%',
    icon: <img src={iconFee} alt="" className="pillars__icon" />,
    mark: markWhite,
    title: 'Trading Fee',
    body: 'A simple commission per side on every executed trade.',
  },
  {
    eyebrow: 'Seconds',
    icon: <img src={iconClock} alt="" className="pillars__icon" />,
    mark: markWhite,
    title: 'Fast Onboarding',
    body: 'Get started with just an email or wallet.',
  },
  {
    eyebrow: 'Instant withdrawals',
    icon: <ChainIcon />,
    mark: markOrange,
    title: 'On-Chain',
    body: 'A simple commission per side on every executed trade.',
    fixed: true,
  },
];

const ROWS = [
  { label: 'Fast Access', icon: <img src={pill1} alt="" className="pillars__icon" /> },
  { label: 'Full Control', icon: <img src={pill2} alt="" className="pillars__icon" /> },
  { label: 'Familiar Experience', icon: <Pill3Icon /> },
  { label: 'Transparent Execution', icon: <img src={pill4} alt="" className="pillars__icon" /> },
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
                <img src={c.mark} alt="" className="pcard__mark" />
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
