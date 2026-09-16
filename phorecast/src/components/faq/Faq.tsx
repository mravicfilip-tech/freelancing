import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { REDUCED, revealUp, useSectionMotion, type SectionMotion } from '../../lib/motion';
import { clamp01, damp, scaleSetter, trackPointer, useLive, viewProgress, type LiveSetup } from './live';
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

const OPEN_INDEX = 3;
const pad = (n: number) => String(n + 1).padStart(2, '0');

/* Entrance -------------------------------------------------------------------
   Directed, not stacked. The eyebrow slides in from the rail edge as
   anticipation; the title is the lead; the row cascade *radiates from the row
   that is already open* rather than running top to bottom, so the eye is taken
   to the answer that is on screen; the ladder draws underneath; and the open
   row's chips are held back as the last accent, a beat after everything else
   has settled. */
function buildFaq({ q, tl }: SectionMotion) {
  const eyebrow = q('.faq__rail .eyebrow');
  if (eyebrow.length) {
    tl.from(eyebrow, { x: -18, opacity: 0, duration: 0.55, ease: 'expo.out', clearProps: 'transform' }, 0);
  }
  tl.from(q('.faq__title'), { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform' }, 0.06);
  revealUp(tl, q('.faq__lede'), { y: 20, duration: 0.62, at: 0.2 });

  const rows = q('.faq__row');
  if (rows.length) {
    tl.from(
      rows,
      {
        y: 26,
        x: -16,
        opacity: 0,
        duration: 0.7,
        ease: 'expo.out',
        stagger: { each: 0.06, from: OPEN_INDEX },
        clearProps: 'transform',
      },
      0.1,
    );
  }

  revealUp(tl, q('.faq__counter'), { y: 14, duration: 0.5, at: 0.34 });
  const segs = q('.faq__ladder span');
  if (segs.length) {
    tl.from(
      segs,
      {
        scaleX: 0,
        duration: 0.5,
        stagger: 0.03,
        ease: 'power3.out',
        transformOrigin: '0% 50%',
        clearProps: 'transform',
      },
      0.38,
    );
    const active = segs[OPEN_INDEX];
    if (active) tl.fromTo(active, { scaleY: 3 }, { scaleY: 1, duration: 0.5, ease: 'power3.out' }, 0.68);
  }

  // The mark is a live WebGL canvas: fade and lift the host only. The scene
  // sizes itself from clientWidth/Height, which a transform does not disturb,
  // but a scale would resample the canvas.
  // The entrance moves the logo *layer*; the live loop below owns the host box's
  // transform, so the two never write to the same element.
  const mark = q('.faq__mark .heroLogo');
  if (mark.length) tl.from(mark, { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out' }, 0.46);

  // Late accent, ~1s in: the chips inside the row that is already open.
  const chips = q('.faq__row.is-open .faq__chip');
  if (chips.length) {
    tl.from(
      chips,
      {
        y: 12,
        scale: 0.86,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'back.out(2)',
        transformOrigin: '0% 50%',
        clearProps: 'transform',
      },
      0.92,
    );
  }
}

/* Continuous motion ----------------------------------------------------------
   One tick: the rail drifts against the rows with scroll, the mark answers the
   pointer and breathes, and a warm highlight tracks the cursor down the row
   stack. Every offset passes through zero when the section is centred, so the
   frame a reader actually stops on is the design, untouched. */
function faqLive(el: HTMLElement): LiveSetup {
  const rail = el.querySelector<HTMLElement>('.faq__rail');
  const list = el.querySelector<HTMLElement>('.faq__list');
  const mark = el.querySelector<HTMLElement>('.faq__mark');
  const spot = el.querySelector<HTMLElement>('.faq__spot');
  const activeSeg = () => el.querySelector<HTMLElement>('.faq__ladder span.is-active');

  const setRail = rail ? gsap.quickSetter(rail, 'y', 'px') : null;
  const setList = list ? gsap.quickSetter(list, 'y', 'px') : null;
  const markX = mark ? gsap.quickSetter(mark, 'x', 'px') : null;
  const markY = mark ? gsap.quickSetter(mark, 'y', 'px') : null;
  const markS = mark ? scaleSetter(mark) : null;
  const spotX = spot ? gsap.quickSetter(spot, 'x', 'px') : null;
  const spotY = spot ? gsap.quickSetter(spot, 'y', 'px') : null;
  const spotO = spot ? gsap.quickSetter(spot, 'opacity') : null;
  const spotS = spot ? scaleSetter(spot) : null;

  const section = trackPointer(el);
  const rows = list ? trackPointer(list) : null;

  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let so = 0;
  let prog = 0.5;
  let segOpacity: ((v: number) => void) | null = null;
  let segEl: HTMLElement | null = null;

  const tick = (dt: number, time: number) => {
    // --- reads (all of them, before anything is written) -------------------
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    const target = viewProgress(r, vh);

    // --- integrate ---------------------------------------------------------
    prog = damp(prog, target, 8, dt);
    px = damp(px, section.state.x * section.state.inside, 4.5, dt);
    py = damp(py, section.state.y * section.state.inside, 4.5, dt);
    if (rows) {
      sx = damp(sx, rows.state.px, 9, dt);
      sy = damp(sy, rows.state.py, 9, dt);
      so = damp(so, rows.state.inside, 6, dt);
    }
    const off = prog - 0.5; // 0 with the section centred

    // --- writes ------------------------------------------------------------
    setRail?.(off * -34);
    setList?.(off * 12);
    if (markX && markY && markS) {
      markX(px * 11);
      markY(py * 9 + Math.sin(time * 0.17) * 5 + off * -14);
      // Exactly 1 with the section centred, so the frame a reader stops on is the design.
      markS(1 + clamp01(Math.abs(off) * 2) * 0.02);
    }
    if (spotX && spotY && spotO && spotS) {
      spotX(sx);
      spotY(sy);
      spotO(so * 0.9);
      spotS(0.88 + so * 0.12);
    }
    // The active ladder rung breathes, so the rail is never a frozen diagram.
    const seg = activeSeg();
    if (seg !== segEl) {
      if (segEl) gsap.set(segEl, { clearProps: 'opacity' });
      segEl = seg;
      segOpacity = seg ? gsap.quickSetter(seg, 'opacity') as (v: number) => void : null;
    }
    segOpacity?.(0.72 + 0.28 * (0.5 + 0.5 * Math.sin(time * 1.5)));
  };

  return {
    tick,
    stop() {
      section.stop();
      rows?.stop();
      const targets = [rail, list, mark, spot, segEl].filter(Boolean) as HTMLElement[];
      if (targets.length) gsap.set(targets, { clearProps: 'transform,opacity' });
    },
  };
}

/* The accordion --------------------------------------------------------------
   The resting open and closed states are pure CSS driven by `.is-open`, so if
   these tweens never run the accordion still works — it just snaps, exactly as
   it did before. GSAP owns only the in-between. */
function runToggle(section: HTMLElement, from: number, to: number) {
  const rows = Array.from(section.querySelectorAll<HTMLElement>('.faq__row'));
  const pick = <T extends HTMLElement>(i: number, sel: string) =>
    (rows[i]?.querySelector<T>(sel) ?? null);

  const closing = from >= 0 ? rows[from] : null;
  const opening = to >= 0 ? rows[to] : null;

  // ---- every measurement first, so the frame has one layout pass ----------
  const outFrom = from >= 0 ? pick<HTMLElement>(from, '.faq__answer') : null;
  const inFrom = from >= 0 ? pick<HTMLElement>(from, '.faq__answer-inner') : null;
  const outTo = to >= 0 ? pick<HTMLElement>(to, '.faq__answer') : null;
  const inTo = to >= 0 ? pick<HTMLElement>(to, '.faq__answer-inner') : null;

  // `.is-open` has already been swapped by React, so the wrapper's CSS height is
  // whatever the new resting state says. The content's own height is never
  // constrained by it, which is what makes it measurable in both directions.
  // React has *already* swapped `.is-open`, so the wrapper's computed height is
  // the new resting state and useless as a starting point. The inline height is
  // not: GSAP writes it only while a transition is in flight, so an empty string
  // means "at rest" and a value means "interrupted, resume from here".
  const flying = (el: HTMLElement | null) => (el && el.style.height ? parseFloat(el.style.height) : null);
  const closeFrom = closing && outFrom && inFrom ? flying(outFrom) ?? inFrom.offsetHeight : 0;
  const openTo = opening && inTo ? inTo.offsetHeight : 0;
  const startTo = opening && outTo ? flying(outTo) ?? 0 : 0;

  // A toggle that lands mid-flight inherits whatever offsets the last one left
  // on the stack; clear them once, before anything is measured.
  gsap.killTweensOf(rows);
  gsap.set(rows, { clearProps: 'transform' });

  const tl = gsap.timeline();

  // ---- the row closing ----------------------------------------------------
  if (closing && outFrom && inFrom) {
    gsap.killTweensOf([outFrom, inFrom]);
    gsap.set(outFrom, { height: closeFrom, overflow: 'hidden', visibility: 'visible' });
    tl.to(inFrom, { opacity: 0, y: -8, duration: 0.2, ease: 'power2.in' }, 0);
    tl.to(
      outFrom,
      {
        height: 0,
        duration: 0.38,
        ease: 'power3.inOut',
        onComplete: () => {
          gsap.set(outFrom, { clearProps: 'all' });
          gsap.set(inFrom, { clearProps: 'all' });
        },
      },
      0.03,
    );
  }

  // ---- the row opening ----------------------------------------------------
  if (opening && outTo && inTo) {
    gsap.killTweensOf([outTo, inTo]);
    gsap.set(inTo, { opacity: 1, y: 0 });
    gsap.set(outTo, { height: startTo, overflow: 'hidden', visibility: 'visible' });
    tl.to(
      outTo,
      {
        height: openTo,
        duration: 0.52,
        ease: 'expo.out',
        onComplete: () => {
          gsap.set(outTo, { clearProps: 'all' });
          gsap.set(inTo, { clearProps: 'all' });
        },
      },
      0.02,
    );
    const text = inTo.querySelector<HTMLElement>('.faq__a-text');
    if (text) tl.fromTo(text, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 0.12);
    const chips = Array.from(inTo.querySelectorAll<HTMLElement>('.faq__chip'));
    if (chips.length) {
      tl.fromTo(
        chips,
        { opacity: 0, y: 14, scale: 0.86 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.46,
          stagger: 0.055,
          ease: 'back.out(2)',
          transformOrigin: '0% 50%',
          clearProps: 'transform',
        },
        0.22,
      );
    }
  }

  // ---- the indicator ------------------------------------------------------
  const turn = (i: number, opens: boolean, at: number) => {
    const bar = pick<HTMLElement>(i, '.faq__toggle i:last-child');
    const box = pick<HTMLElement>(i, '.faq__toggle');
    if (bar) {
      gsap.killTweensOf(bar);
      tl.fromTo(
        bar,
        { rotate: opens ? 0 : 90, opacity: opens ? 1 : 0 },
        {
          rotate: opens ? 90 : 0,
          opacity: opens ? 0 : 1,
          duration: 0.42,
          ease: 'expo.out',
          onComplete: () => gsap.set(bar, { clearProps: 'all' }),
        },
        at,
      );
    }
    if (box) {
      gsap.killTweensOf(box);
      tl.fromTo(
        box,
        { scale: 1 },
        { scale: 1.22, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'transform' },
        at,
      );
    }
  };
  if (from >= 0) turn(from, false, 0);
  if (to >= 0) turn(to, true, 0.02);

  // ---- the rows below acknowledge the shift -------------------------------
  // Layout moves them instantly; this lets them arrive a beat late instead, so
  // the stack reads as elastic rather than as a jump cut.
  const topChanged = Math.min(from >= 0 ? from : rows.length, to >= 0 ? to : rows.length);
  rows.forEach((row, i) => {
    if (i <= topChanged) return;
    let shift = 0;
    if (from >= 0 && i > from) shift -= closeFrom;
    if (to >= 0 && i > to) shift += openTo - startTo;
    if (!shift) return;
    const lag = Math.max(-20, Math.min(20, -shift * 0.16));
    gsap.killTweensOf(row);
    tl.fromTo(
      row,
      { y: lag },
      { y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform' },
      0.03 + (i - topChanged) * 0.022,
    );
  });

  // ---- the rail keeps score ----------------------------------------------
  const counter = section.querySelector<HTMLElement>('.faq__counter-now');
  if (counter) {
    tl.fromTo(
      counter,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.36, ease: 'expo.out', clearProps: 'all' },
      0.04,
    );
  }
  const segs = Array.from(section.querySelectorAll<HTMLElement>('.faq__ladder span'));
  const nextSeg = segs[to];
  if (nextSeg) tl.fromTo(nextSeg, { scaleY: 3.2 }, { scaleY: 1, duration: 0.5, ease: 'power3.out', clearProps: 'transform' }, 0.04);
  const prevSeg = segs[from];
  if (prevSeg && prevSeg !== nextSeg) {
    tl.fromTo(prevSeg, { scaleY: 1.8 }, { scaleY: 1, duration: 0.4, ease: 'power3.out', clearProps: 'transform' }, 0);
  }

  return tl;
}

export function Faq() {
  const [open, setOpen] = useState(OPEN_INDEX);
  const sectionRef = useSectionMotion<HTMLElement>(buildFaq);
  useLive(sectionRef, faqLive);
  const markRef = useRef<HTMLDivElement>(null);
  const previous = useRef(open);
  // Centred in its own square box, so it needs its own placement rather than the hero's.
  const markPlacement = useMemo(() => ({ heightFraction: 0.86, widthFraction: 0.86, cx: 0.5, cy: 0.5 }), []);

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = open;
    const section = sectionRef.current;
    // First commit: the CSS resting state is already correct, nothing to move.
    if (from === open || !section) return;

    if (REDUCED) {
      // Land on the finished state; the class swap has already done the work.
      const stray = Array.from(
        section.querySelectorAll<HTMLElement>('.faq__answer, .faq__answer-inner, .faq__toggle, .faq__toggle i, .faq__row'),
      );
      gsap.killTweensOf(stray);
      gsap.set(stray, { clearProps: 'all' });
      return;
    }

    runToggle(section, from, open);
  }, [open, sectionRef]);

  // These tweens live outside the section's gsap context; clear them by hand.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    return () => {
      if (section) gsap.killTweensOf(Array.from(section.querySelectorAll<HTMLElement>('*')));
    };
  }, [sectionRef]);

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
              <span className="faq__counter-now">{pad(open)}</span>
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
                    <span className="faq__toggle" aria-hidden="true"><i /><i /></span>
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
                >
                  <div className="faq__answer-inner">
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
          {/* Out of flow, so it adds neither a row nor a gap to the flex stack. */}
          <li className="faq__spot" role="presentation" aria-hidden="true" />
        </ul>
      </div>
    </section>
  );
}
