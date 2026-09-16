import { useEffect } from 'react';
import { gsap } from 'gsap';
import { EASE, REDUCED, revealIn, revealUp, useSectionMotion } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import dot from '../../assets/icons/live-dot.svg';
import markWhite from '../../assets/pillars/mark-white.svg';
import markOrange from '../../assets/pillars/mark-orange.svg';
import iconFee from '../../assets/pillars/icon-fee.svg';
import iconClock from '../../assets/pillars/icon-clock.svg';
import pill1 from '../../assets/pillars/pill-1.svg';
import pill2 from '../../assets/pillars/pill-2.svg';
import pill4 from '../../assets/pillars/pill-4.svg';
import chevron from '../../assets/pillars/chevron.svg';
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


/* Entrance -------------------------------------------------------------------
   One timeline: the glow settles, the header rises, the three cards come in
   sequence with their own interiors trailing each shell, and the four bars
   below wipe open left to right. The bars are 72px of horizontal line, so they
   get a wipe rather than a fourth fade-up. Every tween is a `from`, so the
   resting markup is already the finished state — a failure to build leaves the
   section fully visible rather than blank. */
const CARDS_AT = 0.32;
const CARD_STEP = 0.09;
const ROWS_AT = 0.78;
const ROW_STEP = 0.075;

function buildPillars({ q, tl }: SectionMotion) {
  const glow = q('.pillars__glow')[0];
  const cards = q('.pcard');
  const rows = q('.prow');

  if (glow) {
    tl.from(
      glow,
      { opacity: 0, scale: 1.05, transformOrigin: '72% 0%', duration: 0.9, ease: 'power2.out', clearProps: 'transform' },
      0,
    );
  }

  revealUp(tl, q('.eyebrow'), { y: 12, duration: 0.5, at: 0.05 });
  revealUp(tl, q('.pillars__title'), { y: 22, duration: 0.65, at: 0.14 });

  revealIn(tl, cards, { y: 20, stagger: CARD_STEP, duration: 0.7, at: CARDS_AT });

  // Each card's contents trail its own shell, so the three cards read as three
  // arrivals rather than one block of text appearing at once.
  cards.forEach((card, i) => {
    const at = CARDS_AT + i * CARD_STEP + 0.14;
    const inner = Array.from(card.querySelectorAll<HTMLElement>('.pcard__eyebrow, .pcard__body > *'));
    const mark = card.querySelector<HTMLElement>('.pcard__mark');
    if (inner.length) {
      tl.from(inner, { y: 10, opacity: 0, duration: 0.45, stagger: 0.05, clearProps: 'transform' }, at);
    }
    if (mark) {
      tl.from(
        mark,
        { scale: 0.72, rotate: -10, opacity: 0, transformOrigin: '50% 50%', duration: 0.55, clearProps: 'transform' },
        at + 0.04,
      );
    }
  });

  if (rows.length) {
    // `clearProps` drops the inline clip-path on completion, so the settled row
    // is byte-for-byte the CSS resting state and nothing is clipped at rest.
    tl.fromTo(
      rows,
      { clipPath: 'inset(0 100% 0 0 round 10px)' },
      {
        clipPath: 'inset(0 0% 0 0 round 10px)',
        duration: 0.5,
        stagger: ROW_STEP,
        ease: 'expo.out',
        clearProps: 'clipPath',
      },
      ROWS_AT,
    );
    tl.from(
      q('.prow__label'),
      { x: -12, opacity: 0, duration: 0.45, stagger: ROW_STEP, clearProps: 'transform' },
      ROWS_AT + 0.06,
    );
    tl.from(
      q('.prow__chevron'),
      { y: -6, opacity: 0, duration: 0.4, stagger: ROW_STEP, clearProps: 'transform' },
      ROWS_AT + 0.1,
    );
  }
}

/* Hover ----------------------------------------------------------------------
   The four bars are buttons with a chevron but no panel and no toggle, so there
   is no open state to animate. What they do have is a pointer state, and that
   is driven here instead of by a CSS transition so the chevron, the label and
   its icon move together on one curve. */
function useRowHover(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || REDUCED) return;

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('.prow').forEach((row) => {
        const chevron = row.querySelector<HTMLElement>('.prow__chevron');
        const label = row.querySelector<HTMLElement>('.prow__label');
        const icon = row.querySelector<HTMLElement>('.pillars__icon');

        const enter = () => {
          if (chevron) gsap.to(chevron, { y: 3, duration: 0.3, ease: 'expo.out', overwrite: 'auto' });
          if (label) gsap.to(label, { x: 3, duration: 0.32, ease: 'expo.out', overwrite: 'auto' });
          if (icon) {
            gsap.to(icon, { scale: 1.12, transformOrigin: '50% 50%', duration: 0.32, ease: 'expo.out', overwrite: 'auto' });
          }
        };
        const leave = () => {
          if (chevron) gsap.to(chevron, { y: 0, duration: 0.4, ease: EASE, overwrite: 'auto' });
          if (label) gsap.to(label, { x: 0, duration: 0.4, ease: EASE, overwrite: 'auto' });
          if (icon) gsap.to(icon, { scale: 1, duration: 0.4, ease: EASE, overwrite: 'auto' });
        };

        row.addEventListener('pointerenter', enter);
        row.addEventListener('pointerleave', leave);
        row.addEventListener('focus', enter);
        row.addEventListener('blur', leave);
      });
    }, el);

    return () => ctx.revert();
  }, [root]);
}

export function Pillars() {
  const ref = useSectionMotion<HTMLElement>(buildPillars);
  useRowHover(ref);

  return (
    <section className="pillars" ref={ref} aria-labelledby="pillars-title">
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
                <img src={chevron} alt="" className="prow__chevron" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
