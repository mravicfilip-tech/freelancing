import { useCallback, useEffect, useRef, useState } from 'react';
import dot from '../../assets/icons/live-dot.svg';
import { PanelRegister, PanelFund, PanelTrade } from './panels';
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

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    if (mq.matches) setPlaying(false);
    const onChange = () => { reduced.current = mq.matches; setPlaying(!mq.matches); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!playing || reduced.current) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % STEPS.length), DWELL_MS);
    return () => window.clearTimeout(id);
  }, [playing, active]);

  const select = useCallback((i: number) => { setActive(i); setPlaying(false); }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((active + 1) % STEPS.length); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((active - 1 + STEPS.length) % STEPS.length); }
  };

  return (
    <section
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
            <div className="steps__panel-slot is-active" key={active}>{STEPS[active].panel}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
