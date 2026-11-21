import { useEffect, useId, useState } from 'react';
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

/** The campaign's ticket, small: gold, cut corners, a notch each side, the mark. */
function TicketArt() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="gold__art" viewBox="0 0 64 30" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08f" />
          <stop offset="0.5" stopColor="#e9a83e" />
          <stop offset="1" stopColor="#a8661a" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d="M6 0H58A6 6 0 0 0 64 6V11A4 4 0 0 0 64 19V24A6 6 0 0 0 58 30H6A6 6 0 0 0 0 24V19A4 4 0 0 0 0 11V6A6 6 0 0 0 6 0Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="64" height="30" fill={`url(#${id}g)`} />
        <rect className="gold__sheen" x="-24" y="-6" width="12" height="42" fill="#fff" opacity="0.5" transform="skewX(-18)" />
      </g>
      <path
        d="M6 0H58A6 6 0 0 0 64 6V11A4 4 0 0 0 64 19V24A6 6 0 0 0 58 30H6A6 6 0 0 0 0 24V19A4 4 0 0 0 0 11V6A6 6 0 0 0 6 0Z"
        fill="none"
        stroke="#fff3c4"
        strokeOpacity="0.7"
      />
      <g transform="translate(22.5 10.5) scale(0.58)" fill="#3a2306">
        <path d="M8.375 10.1057H8.37305V15.4309C8.37302 16.2813 7.68344 16.9709 6.83301 16.9709H5.06934C4.58429 16.9709 4.12762 16.742 3.83691 16.3538L0.307617 11.6389C0.108284 11.3726 5.94423e-05 11.0487 0 10.7161V10.0413C3.95559e-05 9.19085 0.689618 8.50122 1.54004 8.50122H8.375V10.1057Z" />
        <path d="M4.17532 3.14357L14.1041 15.9261C14.3958 16.3017 14.8447 16.5214 15.3202 16.5214H17.0367C17.8871 16.5214 18.5765 15.832 18.5765 14.9815V8.86801C18.5765 8.5263 18.4629 8.1943 18.2535 7.92429L12.719 0.788522C12.4274 0.412451 11.9782 0.192383 11.5022 0.192383H5.39143C4.54098 0.192383 3.85156 0.881805 3.85156 1.73225V2.19896C3.85156 2.54105 3.96547 2.8734 4.17532 3.14357Z" />
        <path d="M18.3516 7.87219V2.14624C18.3516 1.68975 18.4971 1.24515 18.7671 0.877032C19.1714 0.325716 19.8141 0 20.4978 0H21.2769C21.9602 0 22.6039 0.320107 23.0163 0.864875L32.4099 13.2747C32.6967 13.6537 32.852 14.116 32.852 14.5913V14.6596C32.852 15.1761 32.6575 15.6736 32.3072 16.053C31.9183 16.4744 31.371 16.714 30.7976 16.714H25.7926C25.125 16.714 24.4942 16.4083 24.0805 15.8845L18.821 9.22415C18.5169 8.83911 18.3516 8.36281 18.3516 7.87219Z" />
      </g>
    </svg>
  );
}

/**
 * The Golden Ticket bonus, in the flash sale's shape: a countdown to the end of the
 * live stage, the four stages with the live one in gold, and the bonus the wallet
 * gets now as a ticket stub with the way to claim it. The earlier the stage, the
 * bigger the bonus — that is the whole message, so the stages carry it.
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

      <div className="flash__code gold__ticket">
        <TicketArt />
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
    </section>
  );
}
