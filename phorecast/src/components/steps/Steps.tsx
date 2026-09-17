import { useCallback, useEffect, useRef, useState } from 'react';
import dot from '../../assets/icons/live-dot.svg';
import { PanelRegister } from './panels/PanelRegister';
import { PanelFund } from './panels/PanelFund';
import { PanelTrade } from './panels/PanelTrade';
import { useSectionMotion } from '../../lib/motion';
import { buildSteps } from './Steps.motion';
import './Steps.css';

const STEPS = [
  { title: 'Register with email', body: 'Create your account with an email or wallet — no mandatory KYC.', panel: <PanelRegister /> },
  { title: 'Fund your account', body: 'Add funds with crypto, card, Apple Pay, Google Pay or bank transfer.', panel: <PanelFund /> },
  { title: 'Start trading', body: 'Access crypto, forex, stocks, commodities and indices from one simple platform.', panel: <PanelTrade /> },
];

const DWELL_MS = 6000;

export function Steps() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useRef(false);

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

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((active + 1) % STEPS.length); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((active - 1 + STEPS.length) % STEPS.length); }
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
      </div>
    </section>
  );
}
