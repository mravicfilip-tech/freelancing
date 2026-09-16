import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { gsap } from 'gsap';
import dot from '../../assets/icons/live-dot.svg';
import { PanelRegister, PanelFund, PanelTrade } from './panels';
import { PanelStage } from './panelMotion';
import type { PanelHandle, PanelProps } from './panelMotion';
import { EASE, REDUCED, revealUp, useSectionMotion } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import './Steps.css';

const STEPS: { title: string; body: string; Panel: ComponentType<PanelProps> }[] = [
  { title: 'Register with email', body: 'Create your account with an email or wallet — no mandatory KYC.', Panel: PanelRegister },
  { title: 'Fund your account', body: 'Add funds with crypto, card, Apple Pay, Google Pay or bank transfer.', Panel: PanelFund },
  { title: 'Start trading', body: 'Access crypto, forex, stocks, commodities and indices from one simple platform.', Panel: PanelTrade },
];

const DWELL_MS = 6000;
/** Seconds the first panel waits, so the heading and the list land first. */
const INTRO_DELAY = 0.5;

/** Travel at the extremes of the section's pass through the viewport, in px. */
const DEPTH = { panels: -26, list: 16, mark: 34, glow: -20, art: -1.6 };

export function Steps() {
  // `active` is the step the visitor has chosen — the list, the progress bar
  // and the announcement follow it immediately. `shown` is the panel that is
  // mounted, and it lags by however long the outgoing panel needs to leave;
  // only one panel is ever in the DOM, which is what keeps `backdrop-filter`
  // from painting through a faded-out sibling.
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const reduced = useRef(false);
  const stage = useRef<PanelHandle | null>(null);
  const activeRef = useRef(0);
  const swapped = useRef(false);
  const swapTimer = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    if (mq.matches) setPlaying(false);
    const onChange = () => { reduced.current = mq.matches; setPlaying(!mq.matches); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const go = useCallback((i: number) => {
    if (i === activeRef.current) return;
    swapped.current = true;
    activeRef.current = i;
    setActive(i);
    // The live panel plays its departure first and says how long it needs; the
    // mount of the next one waits exactly that long.
    const ms = stage.current?.exit() ?? 0;
    window.clearTimeout(swapTimer.current);
    if (ms > 0) swapTimer.current = window.setTimeout(() => setShown(i), ms);
    else setShown(i);
  }, []);

  useEffect(() => () => window.clearTimeout(swapTimer.current), []);

  useEffect(() => {
    if (!playing || reduced.current) return;
    const id = window.setTimeout(() => go((activeRef.current + 1) % STEPS.length), DWELL_MS);
    return () => window.clearTimeout(id);
  }, [playing, active, go]);

  const select = useCallback((i: number) => { go(i); setPlaying(false); }, [go]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((active + 1) % STEPS.length); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((active - 1 + STEPS.length) % STEPS.length); }
  };

  // Entrance: eyebrow, heading, then the list cascading under them. The panel
  // column is deliberately left alone — the scroll driver owns its transform,
  // and the panel's own assembly is its entrance. `revealed` releases that
  // assembly, which holds for INTRO_DELAY so the two do not overlap.
  const build = useCallback(({ q, tl }: SectionMotion) => {
    revealUp(tl, q('.eyebrow'), { y: 14, duration: 0.5, at: 0 });
    revealUp(tl, q('.steps__title'), { y: 18, duration: 0.6, at: 0.08 });
    revealUp(tl, q('.steps__list .step'), { y: 26, duration: 0.6, stagger: 0.09, at: 0.2 });
    setRevealed(true);
  }, []);

  const sectionRef = useSectionMotion<HTMLElement>(build);

  // Scroll-linked depth. Progress is the section's own pass through the
  // viewport, -1 (entering from below) to 1 (leaving above), read from a
  // rAF-throttled scroll handler and pushed straight through quickSetters —
  // there is no ScrollTrigger here and no tween in the loop. The list and the
  // panel column move against each other; inside the live panel the blurred
  // mark, the glow and the line work sit on three different planes.
  //
  // Rebound on every swap, because the panel's internals are a new DOM tree.
  // `y` belongs to this driver alone: the pointer driver in panelMotion.ts only
  // ever writes `x` and the rotations, so the two never fight.
  useEffect(() => {
    const el = sectionRef.current;
    if (REDUCED || !el) return;

    const one = (selector: string) => el.querySelector<HTMLElement>(selector);
    const setter = (node: HTMLElement | null, prop: string, unit?: string) =>
      node ? gsap.quickSetter(node, prop, unit) : null;

    const panels = setter(one('.steps__panels'), 'y', 'px');
    const list = setter(one('.steps__list'), 'y', 'px');
    const mark = setter(one('.panel .steps__mark'), 'y', 'px');
    const glow = setter(one('.panel .steps__glow'), 'y', 'px');
    const art = setter(one('.panel .s1, .panel .s2, .panel .s3'), 'yPercent');

    let frame = 0;
    const apply = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const reach = window.innerHeight / 2 + r.height / 2;
      const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - window.innerHeight / 2) / reach));
      panels?.(k * DEPTH.panels);
      list?.(k * DEPTH.list);
      mark?.(k * DEPTH.mark);
      glow?.(k * DEPTH.glow);
      art?.(k * DEPTH.art);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sectionRef, shown, revealed]);

  // Each card answers the pointer on its own: the card leads, its text follows,
  // and the number lifts last. Killed by `overwrite` if a second card is
  // entered before the first has settled back.
  const accent = useCallback((el: HTMLElement | null, on: boolean) => {
    if (REDUCED || !el) return;
    const n = el.querySelector('.step__n');
    const text = [el.querySelector('.step__title'), el.querySelector('.step__body')].filter(Boolean);
    gsap.to(el, { x: on ? 7 : 0, duration: on ? 0.45 : 0.55, ease: EASE, overwrite: 'auto' });
    gsap.to(text, { x: on ? 4 : 0, duration: 0.5, stagger: on ? 0.035 : 0, ease: EASE, overwrite: 'auto' });
    if (n) {
      gsap.to(n, {
        y: on ? -2 : 0,
        scale: on ? 1.14 : 1,
        duration: 0.45,
        ease: on ? 'back.out(2)' : EASE,
        transformOrigin: '50% 60%',
        overwrite: 'auto',
      });
    }
  }, []);

  const { Panel } = STEPS[shown];

  return (
    <section
      ref={sectionRef}
      className="steps"
      id="how"
      aria-labelledby="steps-title"
      aria-roledescription="carousel"
      onMouseEnter={() => setPlaying(false)}
      onFocusCapture={() => setPlaying(false)}
      onKeyDown={onKey}
    >
      <div className="container steps__inner">
        <p className="eyebrow">
          <img src={dot} alt="" className="eyebrow__dot" width={12} height={12} />
          Registration
        </p>
        <h2 id="steps-title" className="steps__title">Open an account in 3 simple steps</h2>

        <div className="steps__body">
          <ol className="steps__list">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  className={`step${i === active ? ' is-active' : ''}${playing ? ' is-playing' : ''}`}
                  style={{ ['--dwell' as string]: `${DWELL_MS}ms` }}
                  aria-expanded={i === active}
                  aria-controls="steps-panel"
                  onClick={() => select(i)}
                  onMouseEnter={(e) => { accent(e.currentTarget, true); select(i); }}
                  onMouseLeave={(e) => accent(e.currentTarget, false)}
                  onFocus={(e) => accent(e.currentTarget, true)}
                  onBlur={(e) => accent(e.currentTarget, false)}
                >
                  <span className="step__title"><span className="step__n">{i + 1}.</span>{s.title}</span>
                  <span className="step__body">{s.body}</span>
                </button>
              </li>
            ))}
          </ol>

          <div
            className="steps__panels"
            id="steps-panel"
            role="group"
            aria-roledescription="slide"
            aria-label={`${active + 1} of ${STEPS.length}`}
          >
            <PanelStage.Provider value={stage}>
              <div className="steps__panel-slot is-active" key={shown}>
                <Panel ready={revealed} delay={swapped.current ? 0 : INTRO_DELAY} />
              </div>
            </PanelStage.Provider>
          </div>
        </div>
      </div>
    </section>
  );
}
