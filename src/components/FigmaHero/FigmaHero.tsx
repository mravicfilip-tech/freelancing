import { useEffect, useState } from 'react';
import './FigmaHero.css';

/**
 * Hero implemented from the Figma design "Remittix Redesign", node 2346:102 ("Hero Banner v1").
 * Layout, type, colours and copy follow the design; the countdown and figures are live-able.
 */

const PRESALE_END = Date.UTC(2026, 9, 15, 12, 0, 0); // 15 Oct 2026 12:00 UTC
const USD_RAISED = 29_503_796.02;
const TOKENS_SOLD = 15_241_796;
const PROGRESS = 0.22; // filled share of the progress bar

const NAV_LINKS = [
  ['$250k Giveaway', '#giveaway'],
  ['Tokenomics', '#tokenomics'],
  ['Roadmap', '#roadmap'],
  ['FAQs', '#faq'],
  ['Whitepaper', '#whitepaper'],
] as const;

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, target - now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    days: pad(Math.floor(left / 86_400_000)),
    hours: pad(Math.floor((left % 86_400_000) / 3_600_000)),
    minutes: pad(Math.floor((left % 3_600_000) / 60_000)),
  };
}

function Chevron({ direction = 'down' }: { direction?: 'down' | 'right' }) {
  return <img className={`fh__chevron fh__chevron--${direction}`} src="/figma/chevron.svg" alt="" width={11} height={6} />;
}

function PresaleButton({ wide = false }: { wide?: boolean }) {
  return (
    <a className={`fh__btn fh__btn--primary${wide ? ' fh__btn--wide' : ''}`} href="#presale">
      Join Presale
      <Chevron direction="right" />
    </a>
  );
}

function Unit({ value, label, bordered = false }: { value: string; label: string; bordered?: boolean }) {
  return (
    <div className={`fh__unit${bordered ? ' fh__unit--bordered' : ''}`}>
      <span className="fh__digits">{value}</span>
      <span className="fh__unitLabel">{label}</span>
    </div>
  );
}

export function FigmaHero() {
  const { days, hours, minutes } = useCountdown(PRESALE_END);
  const usd = USD_RAISED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tokens = TOKENS_SOLD.toLocaleString('en-US');

  return (
    <section className="fh" data-node-id="2346:102">
      <div className="fh__frame" aria-hidden="true" />

      <header className="fh__nav" data-node-id="2346:110">
        <a className="fh__brand" href="/">
          <img src="/figma/logo.svg" alt="" width={33} height={17} />
          <span>Remittix</span>
        </a>
        <nav className="fh__links" aria-label="Primary">
          {NAV_LINKS.map(([label, href]) => (
            <a key={label} href={href}>{label}</a>
          ))}
        </nav>
        <div className="fh__navRight">
          <button type="button" className="fh__lang" aria-label="Language: English">
            EN
            <Chevron />
          </button>
          <div className="fh__navButtons">
            <PresaleButton />
            <a className="fh__btn fh__btn--ghost" href="#login">Login</a>
          </div>
        </div>
      </header>

      <div className="fh__main" data-node-id="2346:142">
        <div className="fh__intro">
          <div className="fh__introText">
            <h1 className="fh__title">
              Cross-border
              <br />
              Payments <span className="fh__titleMuted">Reinvented</span>
            </h1>
            <p className="fh__body">
              Remittix enables users to pay fiat into any bank account around the world using crypto,
              by just simply connecting your wallet.
            </p>
          </div>
          <PresaleButton wide />
        </div>
        <div className="fh__graphic" aria-hidden="true">
          <img src="/figma/bars.svg" alt="" width={605} height={520} />
        </div>
      </div>

      <footer className="fh__footer" data-node-id="2346:152">
        <div className="fh__price">
          <p className="fh__priceTitle">Buy Now Before Price Rise</p>
          <div
            className="fh__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(PROGRESS * 100)}
            aria-label="Presale progress"
          >
            <div className="fh__progressFill" style={{ width: `${PROGRESS * 100}%` }} />
          </div>
          <div className="fh__stats">
            <p>
              <span>USD raised so far</span>
              <strong>${usd}</strong>
            </p>
            <p>
              <span>Tokens sold/remaining</span>
              <strong>{tokens}</strong>
            </p>
          </div>
        </div>
        <div className="fh__countdown" aria-label="Presale ends in">
          <Unit value={days} label="days" />
          <span className="fh__sep" aria-hidden="true">:</span>
          <Unit value={hours} label="hours" bordered />
          <span className="fh__sep" aria-hidden="true">:</span>
          <Unit value={minutes} label="minutes" />
        </div>
      </footer>
    </section>
  );
}
