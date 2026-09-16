import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import dot from '../../assets/icons/live-dot.svg';
import { PanelRegister, PanelFund, PanelTrade } from './panels';
import { PanelStage } from './panelMotion';
import type { PanelHandle, PanelProps } from './panelMotion';
import { revealUp, useSectionMotion } from '../../lib/motion';
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

  // Entrance: eyebrow and heading, the list cascading under them, and the panel
  // shell rising last. The panel then builds itself — `revealed` releases its
  // own timeline, which holds for INTRO_DELAY so the two do not overlap.
  const build = useCallback(({ q, tl }: SectionMotion) => {
    revealUp(tl, q('.eyebrow'), { y: 14, duration: 0.5, at: 0 });
    revealUp(tl, q('.steps__title'), { y: 18, duration: 0.6, at: 0.08 });
    revealUp(tl, q('.steps__list .step'), { y: 26, duration: 0.6, stagger: 0.09, at: 0.2 });
    // Transform only: `.steps__panels` is an ancestor of backdrop-filtered
    // chrome, and fading it would let that chrome paint through.
    tl.from(q('.steps__panels'), { y: 24, duration: 0.7, clearProps: 'transform' }, 0.3);
    setRevealed(true);
  }, []);

  const sectionRef = useSectionMotion<HTMLElement>(build);

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
                  onMouseEnter={() => select(i)}
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
