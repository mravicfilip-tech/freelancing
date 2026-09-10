import { useEffect, useState } from 'react';
import { FLASH_SALE } from '../data';
import { CheckIcon, CopyIcon } from '../icons';
import { useCopy } from '../useCopy';

const pad = (n: number) => String(n).padStart(2, '0');

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="clock__unit">
      <span className="clock__value">{pad(value)}</span>
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
    <section className="side__part flash" aria-labelledby="flash-title">
      <div className="flash__head">
        <div className="flash__lede">
          <h2 className="flash__title" id="flash-title">
            Flash sale ends in
          </h2>
          <p className="flash__copy">
            Use this code at checkout and your purchase earns{' '}
            <strong>{FLASH_SALE.bonus * 100}% bonus $RTX</strong> on top of whatever you buy.
          </p>
        </div>

        <div
          className="clock"
          role="timer"
          aria-live="off"
          aria-label={`${hours} hours ${minutes} minutes ${seconds} seconds remaining`}
        >
          <Unit value={hours} label="Hours" />
          <span className="clock__colon" aria-hidden="true">:</span>
          <Unit value={minutes} label="Minutes" />
          <span className="clock__colon" aria-hidden="true">:</span>
          <Unit value={seconds} label="Seconds" />
        </div>
      </div>

      <div className="flash__code">
        <span className="flash__code-label">Promo code</span>
        <button type="button" className="copy" onClick={() => copy(FLASH_SALE.code)}>
          <span className="copy__value">{FLASH_SALE.code}</span>
          {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
          <span className="sr-only">{copied ? 'Copied' : 'Copy promo code'}</span>
        </button>
      </div>
    </section>
  );
}
