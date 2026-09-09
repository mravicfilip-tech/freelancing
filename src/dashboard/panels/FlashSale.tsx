import { useEffect, useState } from 'react';
import { FLASH_SALE } from '../data';
import { CheckIcon, CopyIcon } from '../icons';
import { useCopy } from '../useCopy';

const pad = (n: number) => String(n).padStart(2, '0');

/** Each digit gets its own tile, as in the reference. */
function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="clock__unit">
      <div className="clock__tiles">
        {pad(value)
          .split('')
          .map((digit, i) => (
            <span className="clock__tile" key={i}>
              {digit}
            </span>
          ))}
      </div>
      <span className="clock__label">{label}</span>
    </div>
  );
}

export function FlashSale() {
  const [left, setLeft] = useState(FLASH_SALE.secondsLeft);
  const [copied, copy] = useCopy();

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hours = Math.floor(left / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  const seconds = left % 60;

  return (
    <section className="card card--glow flash" aria-labelledby="flash-title">
      <div className="flash__head">
        <h2 className="flash__title" id="flash-title">
          Flash Sale for the
          <br />
          Next 72 Hours
        </h2>
        <div
          className="clock"
          role="timer"
          aria-live="off"
          aria-label={`${hours} hours ${minutes} minutes ${seconds} seconds remaining`}
        >
          <Unit value={hours} label="Hours" />
          <span className="clock__colon" aria-hidden="true">
            :
          </span>
          <Unit value={minutes} label="Minutes" />
          <span className="clock__colon" aria-hidden="true">
            :
          </span>
          <Unit value={seconds} label="Seconds" />
        </div>
      </div>

      <p className="flash__copy">
        Get a <strong>{FLASH_SALE.bonus * 100}%</strong> purchase bonus on $RTX with our Promo Code.
      </p>

      <div className="flash__code">
        <span className="flash__code-label">Promo Code</span>
        <button type="button" className="copy" onClick={() => copy(FLASH_SALE.code)}>
          <span className="copy__value">{FLASH_SALE.code}</span>
          {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
          <span className="sr-only">{copied ? 'Copied' : 'Copy promo code'}</span>
        </button>
      </div>
    </section>
  );
}
