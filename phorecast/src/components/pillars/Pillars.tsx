import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { EASE, REDUCED, countTo, useSectionMotion } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { mountGlow } from './glow';
import type { GlowHandle } from './glow';
import { startLife } from './life';
import type { LifeHandle } from './life';
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
    /** The one figure on the card that is a number, so the one that can re-tick. */
    tick: { to: 0.05, decimals: 2, suffix: '%' },
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

/* The four bars are buttons with a chevron, which is a promise of something
   underneath. The copy below is the matching answer from the FAQ section's own
   text rather than anything new — see the note in the section header comment. */
const ROWS = [
  {
    label: 'Fast Access',
    icon: <img src={pill1} alt="" className="pillars__icon" />,
    body: 'Open the account with an email or a wallet, fund it, and the markets are open to you straight away.',
  },
  {
    label: 'Full Control',
    icon: <img src={pill2} alt="" className="pillars__icon" />,
    body: 'Collateral sits in smart contracts we never touch, so a withdrawal is something you execute rather than something you request.',
  },
  {
    label: 'Familiar Experience',
    icon: <Pill3Icon />,
    body: 'Crypto, forex, stocks, commodities and indices sit behind one account and one balance.',
  },
  {
    label: 'Transparent Execution',
    icon: <img src={pill4} alt="" className="pillars__icon" />,
    body: 'Execution off-chain, settlement on-chain. Positions, P&L and liquidations are all independently verifiable.',
  },
];

/* Entrance ---------------------------------------------------------------------
   One object arrives, lands, and only then do the rest follow.

   The lead is the headline: it is the whole claim the section makes, and it has
   the stage to itself for a second and a half. The glow behind it is context and
   barely moves. After the headline lands there is a beat, then the three cards
   come in one at a time, far enough apart to count, each one's interior trailing
   its own shell so they read as three arrivals rather than one block of text.
   On-Chain is the accent — the only card with the orange mark — so it lands last
   and its mark is the one thing allowed a little overshoot. The four bars wipe
   open left to right underneath while the last card is still settling, and the
   chevrons are the final, quietest beat. End to end: about 3.9s.

   Every tween is a `from` off the rendered markup, so the resting DOM is already
   the finished state and a build that never runs leaves the section whole. */

/** Arrive: position over a long curve, opacity finishing earlier underneath it. */
function arrive(
  tl: gsap.core.Timeline,
  targets: HTMLElement[],
  at: number,
  { y = 22, scale, duration = 1.1, stagger = 0, ease = 'power3.out', rotate }:
    { y?: number; scale?: number; duration?: number; stagger?: number; ease?: string; rotate?: number } = {},
) {
  if (!targets.length) return;
  const from: gsap.TweenVars = { y, duration, stagger, ease, clearProps: 'transform' };
  if (scale !== undefined) { from.scale = scale; from.transformOrigin = '50% 60%'; }
  if (rotate !== undefined) from.rotate = rotate;
  tl.from(targets, from, at);
  tl.from(targets, { opacity: 0, duration: duration * 0.62, stagger, ease: 'power2.out' }, at);
}

const T = {
  glow: 0.0,
  dot: 0.12,
  eyebrow: 0.2,
  title: 0.45,     // the lead, 1.45s, alone until 1.9
  cards: 1.9,      // 0.45 + ~1.15 landed + 0.3 beat
  cardStep: 0.2,
  bars: 2.4,
  barStep: 0.15,
};

function buildPillars({ el, q, tl }: SectionMotion) {
  const glow = q('.pillars__glow')[0];
  const cards = q('.pcard');
  const slots = q('.prow-slot');

  // Context. Two and a bit seconds of almost nothing, which is the point.
  if (glow) {
    tl.from(glow, { scale: 1.04, transformOrigin: '72% 0%', duration: 2.2, ease: 'power2.out', clearProps: 'transform' }, T.glow);
    tl.from(glow, { opacity: 0, duration: 1.5, ease: 'power2.out' }, T.glow);
  }

  // The live dot is the one place an overshoot belongs: 12px across, ~6px of
  // travel, and it is an accent rather than anything structural.
  tl.from(q('.eyebrow__dot'), {
    scale: 0.45, opacity: 0, transformOrigin: '50% 50%',
    duration: 0.6, ease: 'back.out(1.6)', clearProps: 'transform',
  }, T.dot);
  arrive(tl, q('.eyebrow'), T.eyebrow, { y: 10, duration: 0.95, ease: 'power2.out' });

  // ---- the lead -------------------------------------------------------------
  arrive(tl, q('.pillars__title'), T.title, { y: 24, duration: 1.45, ease: 'expo.out' });

  // ---- the cards, one at a time ---------------------------------------------
  cards.forEach((card, i) => {
    const accent = i === 2;
    const at = T.cards + i * T.cardStep;
    arrive(tl, [card], at, { y: 22, scale: 0.975, duration: accent ? 1.25 : 1.1 });

    const inner = Array.from(card.querySelectorAll<HTMLElement>('.pcard__eyebrow, .pcard__body > *'));
    arrive(tl, inner, at + 0.3, { y: 14, duration: 0.9, stagger: 0.1, ease: 'power2.out' });

    const mark = card.querySelector<HTMLElement>('.pcard__mark');
    if (mark) {
      // ~5px of travel on the accent card's mark, so `back` stays an accent.
      tl.from(mark, {
        y: 10, scale: accent ? 0.86 : 0.92, opacity: 0, transformOrigin: '50% 50%',
        duration: accent ? 1.0 : 0.9, ease: accent ? 'back.out(1.5)' : 'power3.out',
      }, at + 0.42);
    }
  });

  // ---- the bars -------------------------------------------------------------
  if (slots.length) {
    // A long horizontal travel, so expo. `clearProps` drops the inline clip-path
    // on completion, leaving a settled bar in exactly its CSS resting state.
    tl.fromTo(slots,
      { clipPath: 'inset(0 100% 0 0 round 10px)' },
      { clipPath: 'inset(0 0% 0 0 round 10px)', duration: 1.0, stagger: T.barStep, ease: 'expo.out', clearProps: 'clipPath' },
      T.bars);
    arrive(tl, slots, T.bars, { y: 14, duration: 0.95, stagger: T.barStep, ease: 'power2.out' });
    arrive(tl, q('.prow__label'), T.bars + 0.18, { y: 0, duration: 0.85, stagger: T.barStep, ease: 'power2.out' });
    tl.from(q('.prow__label'), { x: -12, duration: 0.85, stagger: T.barStep, ease: 'power2.out', clearProps: 'transform' }, T.bars + 0.18);
    arrive(tl, q('.prow__chevron'), T.bars + 0.26, { y: -7, duration: 0.75, stagger: T.barStep, ease: 'power2.out' });
  }

  const figure = el.querySelector<HTMLElement>('.pcard__eyebrow[data-tick]');
  if (figure) {
    countTo(tl, figure, Number(figure.dataset.tick), {
      duration: 1.3, decimals: Number(figure.dataset.decimals ?? 0),
      suffix: figure.dataset.suffix ?? '', at: T.cards + 0.3,
    });
  }
}

/* Resting state, scroll and pointer --------------------------------------------
   Started only once the entrance has finished, because several of these targets
   are ones the entrance is still clearing props off. */
function useLife(root: RefObject<HTMLElement | null>, visible: boolean, settled: boolean) {
  const handle = useRef<LifeHandle | null>(null);

  // The loop and the shader start as soon as the section is on screen, so the
  // swap from CSS discs to GLSL happens underneath the entrance's own glow fade
  // rather than as a visible change a second after everything has landed.
  useEffect(() => {
    const el = root.current;
    if (!el || !visible || REDUCED) return;

    let glow: GlowHandle | null = null;
    let cancelled = false;

    const life = startLife(el, (t, rect) => glow?.render(t, rect));
    handle.current = life;

    const canvas = el.querySelector<HTMLCanvasElement>('.pillars__shader');
    const discs = Array.from(el.querySelectorAll<HTMLElement>('.pillars__g'));
    const host = el.querySelector<HTMLElement>('.pillars__glow');
    if (canvas && host) {
      mountGlow(host, discs, canvas).then((h) => {
        if (cancelled) { h?.dispose(); return; }
        glow = h;
      });
    }

    return () => {
      cancelled = true;
      handle.current = null;
      glow?.dispose();
      life.dispose();
    };
  }, [root, visible]);

  // Element writes wait for the entrance to let go of the transforms.
  useEffect(() => {
    if (settled) handle.current?.activate();
  }, [settled]);

  // The fee figure re-prints itself every so often, the way a terminal redraws a
  // quote. It always lands back on the real number.
  useEffect(() => {
    const el = root.current;
    if (!el || !settled || REDUCED) return;
    const figure = el.querySelector<HTMLElement>('.pcard__eyebrow[data-tick]');
    if (!figure) return;

    const to = Number(figure.dataset.tick);
    const decimals = Number(figure.dataset.decimals ?? 0);
    const suffix = figure.dataset.suffix ?? '';
    const settledText = `${to.toFixed(decimals)}${suffix}`;
    let tween: gsap.core.Tween | null = null;
    const loop = () => {
      const obj = { v: to * 0.15 };
      tween = gsap.to(obj, {
        v: to, duration: 0.55, ease: 'power2.out', delay: 9 + Math.random() * 5,
        onUpdate: () => { figure.textContent = `${obj.v.toFixed(decimals)}${suffix}`; },
        onComplete: () => { figure.textContent = settledText; loop(); },
      });
    };
    loop();
    return () => {
      tween?.kill();
      figure.textContent = settledText;
    };
  }, [root, settled]);
}

/* The bars ---------------------------------------------------------------------
   One open at a time. The height is measured every time it is needed rather than
   remembered, so a reflow — a narrower viewport, a different font, longer copy —
   cannot leave a panel clipped or gapped. The bar being opened, the bar being
   closed and the bars either side all move, on three different curves. */
function useAccordion(root: RefObject<HTMLElement | null>, open: number) {
  const prev = useRef(-1);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const slots = Array.from(el.querySelectorAll<HTMLElement>('.prow-slot'));
    if (!slots.length) return;

    const was = prev.current;
    prev.current = open;
    const first = was === -1 && open === -1;
    const d = REDUCED || first ? 0 : 1;

    {
      slots.forEach((slot, i) => {
        const panel = slot.querySelector<HTMLElement>('.prow__panel');
        const inner = slot.querySelector<HTMLElement>('.prow__text');
        const chev = slot.querySelector<HTMLElement>('.prow__chevron');
        const isOpen = i === open;
        const changed = i === open || i === was;

        if (panel) {
          // gsap measures 'auto' itself, so this is the live content height at
          // the moment the tween starts, not a number baked in at build time.
          gsap.to(panel, {
            height: isOpen ? 'auto' : 0,
            duration: d * (isOpen ? 0.52 : 0.42),
            ease: isOpen ? 'expo.out' : 'power3.inOut',
            overwrite: 'auto',
          });
        }
        if (inner) {
          gsap.to(inner, {
            opacity: isOpen ? 1 : 0,
            y: isOpen ? 0 : -8,
            duration: d * (isOpen ? 0.45 : 0.22),
            delay: d * (isOpen ? 0.12 : 0),
            ease: isOpen ? 'power3.out' : 'power2.in',
            overwrite: 'auto',
          });
        }
        if (chev) {
          gsap.to(chev, {
            rotate: isOpen ? 180 : 0,
            y: 0,
            transformOrigin: '50% 50%',
            duration: d * 0.5,
            ease: 'back.out(1.4)',
            overwrite: 'auto',
          });
        }
        // Neighbours acknowledge the change instead of sitting there: the ones
        // that are not moving dip back a little and come home.
        if (d && !changed && open !== -1) {
          gsap.fromTo(slot, { opacity: 1 }, { opacity: 0.72, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 });
        }
      });
    }
    // No cleanup on `open` changing: reverting here would snap the panel that is
    // mid-tween back to where it started. Teardown happens on unmount instead.
  }, [root, open]);

  useEffect(() => {
    const el = root.current;
    return () => {
      if (!el) return;
      gsap.killTweensOf(el.querySelectorAll('.prow__panel, .prow__text, .prow__chevron, .prow-slot'));
    };
  }, [root]);
}

/* Per-bar pointer state --------------------------------------------------------
   Driven here rather than by a CSS transition so the chevron, the label and its
   icon move together on one curve. Each bar answers for itself. */
function useRowPointer(root: RefObject<HTMLElement | null>, open: number) {
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const el = root.current;
    if (!el || REDUCED) return;

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('.prow-slot').forEach((slot, i) => {
        const row = slot.querySelector<HTMLElement>('.prow');
        const chev = slot.querySelector<HTMLElement>('.prow__chevron');
        const label = slot.querySelector<HTMLElement>('.prow__label');
        const icon = slot.querySelector<HTMLElement>('.pillars__icon');
        if (!row) return;

        // The entrance leaves an inline clip-path on the slot until it finishes
        // and clears it, so this doubles as "is this bar still wiping in?". If
        // the entrance never runs the property is empty and hover works anyway.
        const wiping = () => slot.style.clipPath !== '';
        let waiting = 0;

        const on = () => {
          const isOpen = openRef.current === i;
          if (chev && !isOpen) gsap.to(chev, { y: 3, duration: 0.26, ease: EASE, overwrite: 'auto' });
          if (label) gsap.to(label, { x: 3, duration: 0.28, ease: EASE, overwrite: 'auto' });
          if (icon) gsap.to(icon, { scale: 1.12, transformOrigin: '50% 50%', duration: 0.28, ease: EASE, overwrite: 'auto' });
        };
        const off = () => {
          if (chev && openRef.current !== i) gsap.to(chev, { y: 0, duration: 0.38, ease: EASE, overwrite: 'auto' });
          if (label) gsap.to(label, { x: 0, duration: 0.38, ease: EASE, overwrite: 'auto' });
          if (icon) gsap.to(icon, { scale: 1, duration: 0.38, ease: EASE, overwrite: 'auto' });
        };

        const enter = () => {
          cancelAnimationFrame(waiting);
          if (!wiping()) return on();
          // Pointer landed mid-wipe: hold, then catch up once the bar is its own
          // again. The loop ends with the wipe, so nothing idles.
          const catchUp = () => {
            if (wiping()) { waiting = requestAnimationFrame(catchUp); return; }
            if (row.matches(':hover') || row.matches(':focus-visible')) on();
          };
          waiting = requestAnimationFrame(catchUp);
        };
        const leave = () => {
          cancelAnimationFrame(waiting);
          if (!wiping()) off();
        };
        // A mouse click focuses the button too; only keyboard focus should leave
        // a bar looking held, so gate the focus half on :focus-visible.
        const focusIn = () => { if (row.matches(':focus-visible')) enter(); };

        row.addEventListener('pointerenter', enter);
        row.addEventListener('pointerleave', leave);
        row.addEventListener('focus', focusIn);
        row.addEventListener('blur', leave);
      });
    }, el);

    return () => ctx.revert();
  }, [root]);
}

export function Pillars() {
  const [visible, setVisible] = useState(false);
  const [settled, setSettled] = useState(false);
  const [open, setOpen] = useState(-1);

  const build = useCallback((m: SectionMotion) => {
    buildPillars(m);
    setVisible(true);
    m.tl.eventCallback('onComplete', () => setSettled(true));
    if (REDUCED) setSettled(true);
  }, []);

  const ref = useSectionMotion<HTMLElement>(build);
  useLife(ref, visible, settled);
  useAccordion(ref, open);
  useRowPointer(ref, open);

  return (
    <section className="pillars" ref={ref} aria-labelledby="pillars-title">
      <div className="pillars__glow glow-fade" aria-hidden="true">
        <span className="pillars__g pillars__g--red" />
        <span className="pillars__g pillars__g--orange" />
        <span className="pillars__g pillars__g--peach" />
        <span className="pillars__g pillars__g--cream" />
        <canvas className="pillars__shader" />
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
            <li key={c.title} className={`pcard-slot${c.fixed ? ' pcard-slot--fixed' : ''}`}>
              <article className="pcard">
                <span className="pcard__glint" aria-hidden="true" />
                <div className="pcard__top">
                  <span
                    className="pcard__eyebrow"
                    data-tick={c.tick?.to}
                    data-decimals={c.tick?.decimals}
                    data-suffix={c.tick?.suffix}
                  >
                    {c.eyebrow}
                  </span>
                  <img src={c.mark} alt="" className="pcard__mark" />
                </div>
                <div className="pcard__body">
                  {c.icon}
                  <h3 className="pcard__title">{c.title}</h3>
                  <p className="pcard__text">{c.body}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <ul className="pillars__rows">
          {ROWS.map((r, i) => (
            <li key={r.label} className={`prow-slot${open === i ? ' is-open' : ''}`}>
              <button
                type="button"
                className="prow"
                aria-expanded={open === i}
                aria-controls={`pillar-panel-${i}`}
                id={`pillar-row-${i}`}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="prow__label">{r.icon}{r.label}</span>
                <img src={chevron} alt="" className="prow__chevron" />
              </button>
              <div
                className="prow__panel"
                id={`pillar-panel-${i}`}
                role="region"
                aria-labelledby={`pillar-row-${i}`}
              >
                <p className="prow__text">{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
