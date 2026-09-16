import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { EASE, REDUCED, revealUp, useSectionMotion, type SectionMotion } from '../../lib/motion';
import dot from '../../assets/icons/live-dot.svg';
import { HeroLogo } from '../HeroLogo';
import seal from '../../assets/faq/seal.svg';
import './Faq.css';

type Chip = { label: string; value: string } | { verify: string };

type Item = { q: string; a: string; chips?: Chip[] };

const ITEMS: Item[] = [
  {
    q: 'What markets can I trade on Phorecast?',
    a: 'Crypto, forex, stocks, commodities and indices sit behind one account and one balance. You move between them without opening a second venue or funding a second wallet.',
  },
  {
    q: 'How quickly can I start trading?',
    a: 'Registration takes about a minute. Create the account with an email or a wallet, fund it, and the markets are open to you straight away.',
  },
  {
    q: 'Does Phorecast hold my funds?',
    a: 'No. Collateral sits in smart contracts we never touch, so a withdrawal is something you execute rather than something you request.',
  },
  {
    q: 'How does on-chain trading work?',
    a: 'Execution happens off-chain, settlement happens on-chain. Positions, P&L, liquidations and settlement are all independently verifiable — you never have to take our word for the number.',
    chips: [
      { label: 'Execution', value: 'Off-chain' },
      { label: 'Settlement', value: 'On-chain' },
      { verify: 'Verifiable on-chain' },
    ],
  },
  {
    q: 'How do deposits and withdrawals work?',
    a: 'Fund with crypto, card, Apple Pay, Google Pay or bank transfer. Withdrawals settle on-chain to the address you control, with no queue and no approval step.',
  },
  {
    q: 'Do I need to complete KYC?',
    a: 'Not to open an account or to trade. Some fiat rails ask for identity checks of their own, and we tell you before you start one rather than after.',
  },
  {
    q: 'What happens when a position is liquidated?',
    a: 'The liquidation runs against the same on-chain collateral you can inspect yourself. Every step, from the mark price to the close, is written where you can check it.',
  },
];

const pad = (n: number) => String(n + 1).padStart(2, '0');

/* Entrance ------------------------------------------------------------------
   The rail reads top to bottom while the rows cascade alongside it, so the two
   columns arrive as one movement rather than as two separate lists. */
function buildFaq({ q, tl }: SectionMotion) {
  revealUp(tl, q('.faq__rail .eyebrow, .faq__title, .faq__lede'), {
    y: 22,
    stagger: 0.08,
    duration: 0.62,
    at: 0,
  });
  revealUp(tl, q('.faq__row'), { y: 20, stagger: 0.055, duration: 0.6, at: 0.12 });
  revealUp(tl, q('.faq__counter'), { y: 14, duration: 0.5, at: 0.3 });

  const segs = q('.faq__ladder span');
  if (segs.length) {
    tl.from(
      segs,
      {
        scaleX: 0,
        duration: 0.45,
        stagger: 0.035,
        ease: 'power3.out',
        transformOrigin: '0% 50%',
        clearProps: 'transform',
      },
      0.34,
    );
  }

  // The mark is a live WebGL canvas: fade and lift the host only. A scale would
  // resample the canvas, and the scene sizes itself from clientWidth/Height,
  // which a transform does not disturb.
  const mark = q('.faq__mark');
  if (mark.length) tl.from(mark, { y: 18, opacity: 0, duration: 0.7, clearProps: 'transform' }, 0.42);
}

/* Open / close --------------------------------------------------------------
   The resting open and closed states are pure CSS driven by `.is-open`, so if
   these tweens never run (or are reverted) the accordion still works — it just
   snaps, exactly as it did before. GSAP only owns the in-between. */
const OPEN_S = 0.42;
const CLOSE_S = 0.34;

const settle = (el: HTMLElement | null) => el && gsap.set(el, { clearProps: 'all' });

function expand(el: HTMLElement, inner: HTMLElement) {
  gsap.killTweensOf([el, inner]);
  const start = el.offsetHeight; // 0 at rest; mid-height if a close was interrupted
  const end = inner.offsetHeight; // measured every time — answers differ and reflow
  gsap.set(el, { height: start, overflow: 'hidden', visibility: 'visible' });
  const tl = gsap.timeline({
    onComplete: () => {
      settle(el);
      settle(inner);
    },
  });
  tl.to(el, { height: end, duration: OPEN_S, ease: 'power3.out' }, 0);
  if (start === 0) tl.fromTo(inner, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: EASE }, 0.06);
  else tl.to(inner, { opacity: 1, y: 0, duration: 0.3, ease: EASE }, 0);
  return tl;
}

function collapse(el: HTMLElement, inner: HTMLElement) {
  gsap.killTweensOf([el, inner]);
  // `.is-open` is already gone by now, so the CSS height is 0; fall back to the
  // content's own height, which the collapsed wrapper does not constrain.
  const start = el.offsetHeight || inner.offsetHeight;
  gsap.set(el, { height: start, overflow: 'hidden', visibility: 'visible' });
  const tl = gsap.timeline({
    onComplete: () => {
      settle(el);
      settle(inner);
    },
  });
  tl.to(inner, { opacity: 0, y: -6, duration: 0.22, ease: 'power2.in' }, 0);
  tl.to(el, { height: 0, duration: CLOSE_S, ease: 'power3.inOut' }, 0.03);
  return tl;
}

/** The vertical stroke of the plus rotates onto the horizontal one and fades. */
function turnToggle(bar: HTMLElement, opening: boolean) {
  gsap.killTweensOf(bar);
  return gsap.fromTo(
    bar,
    { rotate: opening ? 0 : 90, opacity: opening ? 1 : 0 },
    {
      rotate: opening ? 90 : 0,
      opacity: opening ? 0 : 1,
      duration: 0.3,
      ease: EASE,
      onComplete: () => settle(bar),
    },
  );
}

export function Faq() {
  const [open, setOpen] = useState(3);
  const sectionRef = useSectionMotion<HTMLElement>(buildFaq);
  const markRef = useRef<HTMLDivElement>(null);
  const answers = useRef<Array<HTMLDivElement | null>>([]);
  const inners = useRef<Array<HTMLDivElement | null>>([]);
  const bars = useRef<Array<HTMLElement | null>>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const previous = useRef(open);
  // Centred in its own square box, so it needs its own placement rather than the hero's.
  const markPlacement = useMemo(() => ({ heightFraction: 0.86, widthFraction: 0.86, cx: 0.5, cy: 0.5 }), []);

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = open;
    // First commit: the CSS resting state is already correct, nothing to move.
    if (from === open) return;

    const run = (i: number, opening: boolean) => {
      const el = answers.current[i];
      const inner = inners.current[i];
      const bar = bars.current[i];
      if (REDUCED) {
        // Land on the finished state; the class swap has already done the work.
        gsap.killTweensOf([el, inner, bar].filter(Boolean) as HTMLElement[]);
        settle(el);
        settle(inner);
        settle(bar);
        return;
      }
      if (el && inner) (opening ? expand : collapse)(el, inner);
      if (bar) turnToggle(bar, opening);
    };

    if (from >= 0) run(from, false);
    if (open >= 0) run(open, true);

    if (REDUCED) return;
    // The rail is the section's index: nudge it so it reads as the same event.
    if (counterRef.current) {
      gsap.fromTo(
        counterRef.current,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: EASE, clearProps: 'all' },
      );
    }
    const seg = sectionRef.current?.querySelectorAll<HTMLElement>('.faq__ladder span')[open];
    if (seg) gsap.fromTo(seg, { scaleY: 2.6 }, { scaleY: 1, duration: 0.4, ease: 'power3.out', clearProps: 'transform' });
  }, [open, sectionRef]);

  // These tweens live outside the section's gsap context, so kill them by hand.
  useLayoutEffect(() => {
    const tracked = [answers, inners, bars];
    return () => {
      const els = tracked.flatMap((r) => r.current).filter(Boolean) as HTMLElement[];
      if (els.length) gsap.killTweensOf(els);
    };
  }, []);

  return (
    <section className="faq" id="faq" aria-labelledby="faq-title" ref={sectionRef}>
      <div className="container faq__inner">
        <div className="faq__rail">
          <p className="eyebrow">
            <img src={dot} alt="" className="eyebrow__dot" width={12} height={12} />
            Frequently asked
          </p>
          <h2 id="faq-title" className="faq__title">Answers<br />you can verify</h2>
          <p className="faq__lede">
            Everything below is how Phorecast actually works.<br />
            Where a claim can be checked on-chain, we show<br />
            you where to check it.
          </p>
          <div className="faq__position">
            <p className="faq__counter">
              <span className="faq__counter-now" ref={counterRef}>{pad(open)}</span>
              <span>/</span>
              <span>{pad(ITEMS.length - 1)}</span>
            </p>
            <div className="faq__ladder" aria-hidden="true">
              {ITEMS.map((_, i) => <span key={i} className={i === open ? 'is-active' : ''} />)}
            </div>
          </div>
          <div className="faq__mark" ref={markRef} aria-hidden="true">
            <HeroLogo hostRef={markRef} variant="lined" placement={markPlacement} scroll={false} />
          </div>
        </div>

        <ul className="faq__list">
          {ITEMS.map((item, i) => {
            const isOpen = i === open;
            return (
              <li key={item.q} className={`faq__row${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span className="faq__index">{pad(i)}</span>
                    <span className="faq__question">{item.q}</span>
                    <span className="faq__toggle" aria-hidden="true">
                      <i />
                      <i ref={(n) => { bars.current[i] = n; }} />
                    </span>
                  </button>
                </h3>
                {/* Collapsed rather than `hidden`: `display: none` cannot be
                    tweened. `inert` + `aria-hidden` keep a closed answer out of
                    the tab order and out of the accessibility tree even during
                    the few hundred ms it is still painted while closing. */}
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className="faq__answer"
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                  ref={(n) => { answers.current[i] = n; }}
                >
                  <div className="faq__answer-inner" ref={(n) => { inners.current[i] = n; }}>
                    <p className="faq__a-text">{item.a}</p>
                    {item.chips && (
                      <div className="faq__chips">
                        {item.chips.map((c, ci) =>
                          'verify' in c ? (
                            <span key={ci} className="faq__chip faq__chip--verify">
                              <img src={seal} alt="" width={16} height={16} />{c.verify}
                            </span>
                          ) : (
                            <span key={ci} className="faq__chip">
                              <span className="faq__chip-label">{c.label}</span>
                              <span className="faq__chip-value">{c.value}</span>
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
