import { useEffect, useState } from 'react';
import { GoldenTicket as Ticket } from '../goldenTicket/GoldenTicket';
import { GOLDEN_TICKET } from '../data';

const pad = (n: number) => String(n).padStart(2, '0');

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="clock__unit">
      <span className="clock__value">{pad(value)}</span>
      <span className="clock__label">{label}</span>
    </div>
  );
}

/**
 * The Golden Ticket bonus, in the flash sale's shape: a countdown to the end of the
 * live stage, the landing page's own ticket — gold foil, the lettering, the electric
 * border — with the bonus the wallet gets now and the way to claim it, then the four
 * stages with the live one in gold. The earlier the stage, the bigger the bonus.
 */
export function GoldenTicket() {
  const { stages, live, secondsLeft, ticket } = GOLDEN_TICKET;
  const [left, setLeft] = useState<number>(secondsLeft);

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hours = Math.floor(left / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  const seconds = left % 60;
  const bonus = stages[live];
  const next = stages[live + 1];

  return (
    <section className="side__part gold" aria-labelledby="gold-title">
      <div className="flash__head">
        <div className="flash__lede">
          <p className="gold__kicker">
            <i aria-hidden="true" />
            Golden Ticket · Stage {live + 1} live
          </p>
          <h2 className="flash__title" id="gold-title">
            Your bonus drops in
          </h2>
          <p className="flash__copy">
            The earlier you enter, the bigger your bonus. Buy in Stage {live + 1} to lock in{' '}
            <strong>+{bonus}X</strong>
            {next !== undefined ? ` before it steps down to ${next}X.` : '.'}
          </p>
        </div>

        <div
          className="clock"
          role="timer"
          aria-live="off"
          aria-label={`${hours} hours ${minutes} minutes ${seconds} seconds left in stage ${live + 1}`}
        >
          <Unit value={hours} label="Hours" />
          <span className="clock__colon" aria-hidden="true">:</span>
          <Unit value={minutes} label="Minutes" />
          <span className="clock__colon" aria-hidden="true">:</span>
          <Unit value={seconds} label="Seconds" />
        </div>
      </div>

      <div className="gold__ticket">
        <div className="gold__art">
          <div className="gold__tilt">
            <Ticket running />
          </div>
        </div>
        <div className="gold__ticket-side">
          <span className="gold__ticket-text">
            <span className="flash__code-label">Your bonus · Nº {ticket}</span>
            <span className="gold__ticket-value">+{bonus}X</span>
          </span>
          <a className="copy gold__claim" href="#buy">
            Claim allocation
            <svg viewBox="0 0 16 16" className="icon-16" aria-hidden="true">
              <path d="M3 8h9M8.5 4 12.5 8 8.5 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      <ol className="gold__stages" aria-label="Bonus by stage">
        {stages.map((b, i) => (
          <li key={b} className="gold__stage" data-state={i < live ? 'done' : i === live ? 'live' : 'next'}>
            <span className="gold__stage-label">Stage {i + 1}</span>
            <span className="gold__stage-value">
              {i === live ? '+' : ''}
              {b}X
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
