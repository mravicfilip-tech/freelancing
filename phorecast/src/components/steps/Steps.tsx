import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LiveDot } from '../LiveDot';
import { PanelRegister } from './panels/PanelRegister';
import { PanelFund } from './panels/PanelFund';
import { PanelTrade } from './panels/PanelTrade';
import { useSectionMotion } from '../../lib/motion';
import { buildSteps } from './Steps.motion';
import './Steps.css';

/* `tab` is the phone switcher's label: one distinguishing word per step, so
   three tabs read at a glance. The full title and body stay with the slide. */
const STEPS = [
  { tab: 'Register', title: 'Create Your Account', body: 'Sign up with your email or connect a wallet. No mandatory KYC.', panel: <PanelRegister /> },
  { tab: 'Fund', title: 'Add Funds Your Way', body: 'Deposit using crypto, card, Apple Pay, Google Pay, or bank transfer.', panel: <PanelFund /> },
  { tab: 'Forecast', title: 'Make Your First Forecast', body: 'Explore live markets, choose an outcome, and take a position on what happens next.', panel: <PanelTrade /> },
];

const DWELL_MS = 6000;

/* The phone layout breakpoint. 700 rather than the band's 720: down to about
 * 700 the stacked layout (panel above a list of three cards) still reads well;
 * below it the panel gets too small and the section too tall, so the phone
 * switches to tabs and a swipeable track. Keep in step with Steps.css,
 * Steps.motion.ts and the panels' phone blocks.
 *
 * Read in JS as well as CSS because the two layouts are different MARKUP: the
 * phone mounts all three slides so a swipe has somewhere to go, while the
 * desktop mounts only the active panel. */
const PHONE = '(max-width: 700px)';
const REDUCE = '(prefers-reduced-motion: reduce)';

function usePhone() {
  const [phone, setPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PHONE).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const onChange = () => setPhone(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return phone;
}

export function Steps() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(
    () => !(typeof window !== 'undefined' && window.matchMedia(REDUCE).matches),
  );
  const reduced = useRef(false);
  const phone = usePhone();

  // The band arrives when it is scrolled to; see Steps.motion.ts.
  const ref = useSectionMotion<HTMLElement>(buildSteps);

  // The stepper does not start counting until the band has finished arriving
  // (`motion:done`), so the first card lands with its progress bar at zero
  // rather than part-spent after a long wait off screen. Once armed, the timer
  // runs continuously.
  //
  // `data-motion-done` is checked before listening because the event fires
  // only once: under reduced motion, or if a build throws, it has already
  // fired during the layout effect above.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.dataset.motionDone) { setArmed(true); return; }
    const onDone = () => setArmed(true);
    el.addEventListener('motion:done', onDone);
    return () => el.removeEventListener('motion:done', onDone);
  }, [ref]);

  useEffect(() => {
    // `playing` already starts false under reduced motion; this follows changes.
    const mq = window.matchMedia(REDUCE);
    reduced.current = mq.matches;
    const onChange = () => { reduced.current = mq.matches; setPlaying(!mq.matches); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!playing || !armed || reduced.current) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % STEPS.length), DWELL_MS);
    return () => window.clearTimeout(id);
  }, [playing, armed, active]);

  // Choosing a step jumps to it and gives it a full dwell: the timer effect is
  // keyed on `active`, so it restarts rather than stops. `playing` only
  // reflects whether motion is allowed (reduced motion).
  const select = useCallback((i: number) => { setActive(i); }, []);

  /* The phone slider, in two halves that must not chase each other.
   *
   * OUT: a change to `active` (timer, tab, arrow key or swipe) scrolls the
   * track to it, so `active` is the single source of truth.
   *
   * IN: the track reports where a swipe settled. Scroll-snap does the
   * physics; only the scroll offset is read (every slide is one track width).
   *
   * `driving` keeps them apart: a programmed scroll from slide 3 to slide 1
   * passes slide 2, which must not select itself mid-flight. The reader
   * ignores scrolls until the track reaches `active`, or for at most 700ms in
   * case a touch interrupts the smooth scroll. */
  const trackRef = useRef<HTMLDivElement>(null);
  const driving = useRef(0);
  const activeRef = useRef(active);
  // Synced at commit, before any frame the scroll reader below could run in.
  useLayoutEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !phone) return;
    const target = el.clientWidth * active;
    if (Math.abs(el.scrollLeft - target) < 2) return;
    driving.current = window.setTimeout(() => { driving.current = 0; }, 700);
    el.scrollTo({ left: target, behavior: reduced.current ? 'auto' : 'smooth' });
    return () => { if (driving.current) { window.clearTimeout(driving.current); driving.current = 0; } };
  }, [active, phone]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !phone) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const w = el.clientWidth;
      if (!w) return;
      const i = Math.max(0, Math.min(STEPS.length - 1, Math.round(el.scrollLeft / w)));
      if (i === activeRef.current) {
        if (driving.current) { window.clearTimeout(driving.current); driving.current = 0; }
        return;
      }
      if (driving.current) return;
      setActive(i);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [phone]);

  const onKey = (e: React.KeyboardEvent) => {
    const go = (i: number) => {
      select(i);
      // Focus follows the selection only when a tab had focus; arrows pressed
      // elsewhere in the band step the carousel without moving focus.
      const from = (e.target as HTMLElement | null)?.closest?.('[role="tab"]');
      if (from) {
        const next = ref.current?.querySelector<HTMLElement>(`#steps-tab-${i}`);
        requestAnimationFrame(() => next?.focus());
      }
    };
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go((active + 1) % STEPS.length); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go((active - 1 + STEPS.length) % STEPS.length); }
    if (phone && e.key === 'Home') { e.preventDefault(); go(0); }
    if (phone && e.key === 'End') { e.preventDefault(); go(STEPS.length - 1); }
  };

  return (
    <section
      ref={ref}
      className="steps"
      id="how"
      aria-labelledby="steps-title"
      aria-roledescription="carousel"
      data-motion="pending"
      onKeyDown={onKey}
    >
      <div className="container steps__inner">
        <p className="eyebrow">
          <LiveDot />
          GET STARTED
        </p>
        <h2 id="steps-title" className="steps__title">Make Your First Forecast in 3 Simple Steps</h2>

        {phone ? (
          /* THE PHONE LAYOUT: a tablist and three slides (the APG carousel
             with a tablist picker). `role="tab"` rather than the desktop
             cards' `aria-expanded`, because on screen it is one control with
             three positions. Unselected slides stay in the accessibility tree
             (a swipe reaches them, so `aria-hidden` would be wrong) but leave
             the tab order via a roving tabindex. */
          <div className="steps__body">
            <div
              className="steps__tabs"
              role="tablist"
              aria-label="Account steps"
              style={{ ['--i' as string]: active }}
            >
              {STEPS.map((s, i) => (
                <button
                  key={s.tab}
                  type="button"
                  role="tab"
                  id={`steps-tab-${i}`}
                  className={`steps__tab${i === active ? ' is-active' : ''}`}
                  aria-selected={i === active}
                  aria-controls={`steps-slide-${i}`}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => select(i)}
                >
                  <span className="steps__tab-n">{i + 1}</span>
                  {s.tab}
                </button>
              ))}
              {/* The underline: one element that slides between positions, so
                  the row reads as one control. The dwell fill is keyed on
                  `active`, so each turn remounts it and its CSS animation
                  restarts; same `is-playing` mechanism as the desktop bar. */}
              <span className={`steps__ind${playing && armed ? ' is-playing' : ''}`} aria-hidden="true">
                <span className="steps__ind-fill" key={active} style={{ ['--dwell' as string]: `${DWELL_MS}ms` }} />
              </span>
            </div>

            <div className="steps__track" ref={trackRef}>
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className={`steps__slide${i === active ? ' is-active' : ''}`}
                  id={`steps-slide-${i}`}
                  role="tabpanel"
                  aria-roledescription="slide"
                  aria-labelledby={`steps-tab-${i}`}
                  tabIndex={i === active ? 0 : -1}
                >
                  <div className="steps__panels">
                    <div className="steps__panel-slot is-active">{s.panel}</div>
                  </div>
                  <div className="step">
                    <span className="step__title"><span className="step__n">{i + 1}.</span>{s.title}</span>
                    <span className="step__body">{s.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="steps__body">
            <ol className="steps__list">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <button
                    type="button"
                    className={`step${i === active ? ' is-active' : ''}${playing && armed ? ' is-playing' : ''}`}
                    style={{ ['--dwell' as string]: `${DWELL_MS}ms` }}
                    aria-expanded={i === active}
                    aria-controls="steps-panel"
                    onClick={() => select(i)}
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
              <div className="steps__panel-slot is-active" key={active}>{STEPS[active].panel}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
