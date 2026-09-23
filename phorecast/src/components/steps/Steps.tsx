import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveDot } from '../LiveDot';
import { PanelRegister } from './panels/PanelRegister';
import { PanelFund } from './panels/PanelFund';
import { PanelTrade } from './panels/PanelTrade';
import { useSectionMotion } from '../../lib/motion';
import { buildSteps } from './Steps.motion';
import './Steps.css';

/* `tab` is the switcher's label, and it is not the title abbreviated for want
   of room: three tabs across 350px have to be read at a glance and in parallel,
   so each is the one verb that separates it from the other two. The full title
   and the body stay with the slide, where they are read one at a time. */
const STEPS = [
  { tab: 'Register', title: 'Register with email', body: 'Create your account with an email or wallet. No mandatory KYC.', panel: <PanelRegister /> },
  { tab: 'Fund', title: 'Fund your account', body: 'Add funds with crypto, card, Apple Pay, Google Pay or bank transfer.', panel: <PanelFund /> },
  { tab: 'Trade', title: 'Start trading', body: 'Access crypto, forex, stocks, commodities and indices from one simple platform.', panel: <PanelTrade /> },
];

const DWELL_MS = 6000;

/* The phone layout, and the one place its width is written.
 *
 * 700 rather than the band's own 720. Above it the stacked layout still works:
 * at 720 the panel is 672 wide, which is 0.76 of a design pixel per CSS pixel,
 * and the three cards under it are a readable list. Below 700 that falls away
 * fast -- at 390 the panel was 350 wide, 0.40 of a design pixel, with the whole
 * section 900px tall because all three cards are listed under one graphic. The
 * switcher is a phone control, not a tablet one, so it starts where the phone
 * does. It also leaves every width the shipped gates fingerprint -- 1600, 1100
 * and 720 -- provably untouched, so what those report is only the desktop this
 * change is not allowed to move.
 *
 * Read in JS as well as in CSS because the two layouts are different MARKUP,
 * not one markup restyled: the phone needs three slides mounted at once for a
 * swipe to have anywhere to go, and the desktop must not pay for two panels it
 * never shows -- nor have its DOM disturbed at all. */
const PHONE = '(max-width: 700px)';

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
  const [playing, setPlaying] = useState(true);
  const reduced = useRef(false);
  const phone = usePhone();

  // The band arrives when it is scrolled to; see Steps.motion.ts.
  const ref = useSectionMotion<HTMLElement>(buildSteps);

  // The stepper does not start counting until the band has finished arriving.
  //
  // It is not a pause -- once armed the timer runs continuously, exactly as
  // before, and selection stays click-only. It is about where the first dwell
  // begins: the entrance can be waited on for minutes, and a stepper counting
  // through that wait meant the band could arrive on step three with step one's
  // progress bar already spent, or worse, arrive with that bar frozen half
  // drawn. Arming on `motion:done` starts the first dwell, the `is-playing`
  // class and therefore the bar's CSS animation in the same frame the entrance
  // hands over, so the first card lands and its bar starts from zero.
  //
  // The flag is read before the listener is attached because the hook fires the
  // event once and only once: when motion is reduced, or a build throws, it has
  // already fired during the layout effect above this one.
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
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    if (mq.matches) setPlaying(false);
    const onChange = () => { reduced.current = mq.matches; setPlaying(!mq.matches); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!playing || !armed || reduced.current) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % STEPS.length), DWELL_MS);
    return () => window.clearTimeout(id);
  }, [playing, armed, active]);

  // Choosing a step jumps to it and hands it a full turn -- the dwell effect is
  // keyed on `active`, so changing it restarts the timer rather than stopping
  // it. The carousel keeps progressing either way; `playing` now answers only
  // "is motion allowed", which is reduced-motion's business alone.
  const select = useCallback((i: number) => { setActive(i); }, []);

  /* The slider, in two halves that must not chase each other.
   *
   * OUT: the step changing scrolls the track to it -- the timer, a tab, an
   * arrow key and a swipe all arrive as a change to `active`, so there is one
   * way in and the track is never a second source of truth.
   *
   * IN: the track reports where a swipe left it. No pointer maths and no
   * listeners on the pointer at all -- scroll-snap does the physics, and what
   * is read here is the scroll offset the browser settled on. The rounding is
   * exact because every slide is the width of the track.
   *
   * `driving` is what keeps the two apart. A programmed scroll from slide 3 to
   * slide 1 passes over slide 2, and slide 2 reported mid-flight would select
   * itself, restart the dwell and re-aim the scroll it is standing in. So the
   * reader is deaf while a scroll of ours is in flight, and hears again the
   * moment the track is where `active` says it should be -- or after 700ms, in
   * case a thumb interrupted the smooth scroll and it never arrives. */
  const trackRef = useRef<HTMLDivElement>(null);
  const driving = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

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
      // Keyboard selection moves focus with it, but only when a tab is what was
      // being driven: an arrow pressed anywhere else in the band still steps the
      // carousel, exactly as it did, and does not snatch focus.
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
          Registration
        </p>
        <h2 id="steps-title" className="steps__title">Open an account in 3 simple steps</h2>

        {phone ? (
          /* THE PHONE LAYOUT. A tablist, and three slides under it.
             `role="tab"` rather than the desktop cards' `aria-expanded`: what is
             on screen is one control with three positions and a moving
             underline, and "tab 2 of 3, selected" is that in one hop, where
             three separate expandable buttons is three. The section keeps
             `aria-roledescription="carousel"`, which is the shape APG calls a
             carousel with a tablist picker.
             The slides that are not selected stay in the accessibility tree --
             they are on the page, a thumb away, and `aria-hidden` on something
             a swipe reaches is a lie. They are out of the TAB ORDER instead,
             which is what a roving tabindex is for. */
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
              {/* The underline. One element for all three positions -- it slides
                  between them rather than appearing and disappearing, which is
                  what makes the row read as one control. The dwell rides on top
                  of it, keyed on `active` so that each turn re-mounts the fill
                  and its CSS animation starts from zero, the same mechanism the
                  desktop card's bar uses and driven by the same `is-playing`. */}
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
