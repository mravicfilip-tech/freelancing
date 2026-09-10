import { useId, useMemo, useState } from 'react';
import { FLASH_SALE, PRESALE, TOKENS, money, type TokenId } from '../data';
import { CheckIcon, MastercardMark, PayMark, RocketIcon, VisaMark } from '../icons';
import { Button } from '../Button';
import { TokenSelect } from '../TokenSelect';

type Method = 'crypto' | 'card';

/** Round sums a buyer actually thinks in, quoted in USD and converted per token. */
const QUICK_USD = [50, 100, 500, 1000];

export function BuyPanel() {
  const [method, setMethod] = useState<Method>('crypto');
  const [token, setToken] = useState<TokenId>('USDT');
  const [pay, setPay] = useState('');
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [promoError, setPromoError] = useState(false);
  const payId = useId();
  const promoId = useId();
  const tabId = useId();

  const rate = method === 'card' ? 1 : (TOKENS.find((t) => t.id === token)?.usd ?? 1);
  const bonus = applied ? FLASH_SALE.bonus : 0;

  const { base, extra, total, spend } = useMemo(() => {
    const amount = Number.parseFloat(pay);
    const usd = Number.isFinite(amount) && amount > 0 ? amount * rate : 0;
    const b = usd / PRESALE.price;
    return { base: b, extra: b * bonus, total: b * (1 + bonus), spend: usd };
  }, [pay, rate, bonus]);

  /* Derived, not stored: a pill is selected only while the field still holds
     its amount, so typing over it clears the state without any bookkeeping.
     The tolerance covers the 6dp rounding setQuick does on conversion. */
  const selected = QUICK_USD.find((u) => Math.abs(spend - u) < 0.05);

  const setQuick = (usd: number) => {
    const amount = usd / rate;
    setPay(rate === 1 ? String(usd) : String(Number(amount.toFixed(6))));
  };

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === FLASH_SALE.code) {
      setApplied(FLASH_SALE.code);
      setPromoError(false);
    } else {
      setPromoError(true);
    }
  };

  return (
    <section className="card buy" aria-labelledby="buy-title">
      <div className="card__head buy__head">
        <h2 className="card__title" id="buy-title">
          Buy $RTX
        </h2>
        <p className="buy__urgency">
          <RocketIcon className="icon-16" />
          Buy before the price goes up
        </p>
      </div>

      <div
        className="tabs"
        role="tablist"
        aria-label="Payment method"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          setMethod((m) => (m === 'crypto' ? 'card' : 'crypto'));
        }}
      >
        {(['crypto', 'card'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`${tabId}-${id}`}
            className="tabs__tab"
            aria-selected={method === id}
            aria-controls={`${tabId}-panel`}
            /* Roving tabindex: the tablist is one tab stop, arrows move within. */
            tabIndex={method === id ? 0 : -1}
            onClick={() => setMethod(id)}
          >
            {id === 'crypto' ? 'Crypto' : 'Credit card'}
          </button>
        ))}
      </div>

      <div
        className="buy__amount"
        role="tabpanel"
        id={`${tabId}-panel`}
        aria-labelledby={`${tabId}-${method}`}
      >
        <div className="buy__amount-head">
          <label className="field__label" htmlFor={payId}>
            You pay
          </label>
          <span className="buy__rate num">1 RTX = ${PRESALE.price.toFixed(2)}</span>
        </div>

        <div className="field__control">
          <input
            id={payId}
            className="field__input"
            inputMode="decimal"
            placeholder="0"
            value={pay}
            onChange={(e) => setPay(e.target.value.replace(/[^\d.]/g, ''))}
          />
          {method === 'crypto' ? (
            <TokenSelect value={token} onChange={setToken} />
          ) : (
            <span className="field__token">
              <PayMark id="CARD" className="icon-20" />
              USD
            </span>
          )}
        </div>

        <div className="buy__quick">
          {QUICK_USD.map((usd) => (
            <button
              key={usd}
              type="button"
              className="chip"
              aria-pressed={selected === usd}
              onClick={() => setQuick(usd)}
            >
              ${usd}
            </button>
          ))}
        </div>
      </div>

      <dl className="buy__summary" aria-label="Order summary">
        <div>
          <dt>Base at stage {PRESALE.stage}</dt>
          <dd className="num">{money(base)} RTX</dd>
        </div>
        <div data-bonus>
          <dt>
            Bonus
            {bonus > 0 ? ` (${bonus * 100}%)` : ''}
          </dt>
          <dd className="num">
            {bonus > 0 ? `+${money(extra)} RTX` : `Add ${FLASH_SALE.code} for ${FLASH_SALE.bonus * 100}%`}
          </dd>
        </div>
        <div data-total>
          <dt>You receive</dt>
          <dd className="num buy__total">{money(total)} RTX</dd>
        </div>
      </dl>

      <div className="field buy__promo-field">
        <label className="field__label" htmlFor={promoId}>
          Promo code
        </label>
        <div className="buy__promo">
          <input
            id={promoId}
            className="input"
            placeholder="Enter a promo code"
            aria-invalid={promoError || undefined}
            aria-describedby={promoError ? `${promoId}-error` : undefined}
            value={promo}
            onChange={(e) => {
              setPromo(e.target.value);
              setApplied(null);
              setPromoError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
          />
          <Button variant="ghost" disabled={!promo.trim() || applied !== null} onClick={applyPromo}>
            {applied ? 'Applied' : 'Apply'}
          </Button>
        </div>
        {promoError && (
          <p className="field__error" id={`${promoId}-error`} role="alert">
            That code is not recognised. Check it and try again.
          </p>
        )}
        {applied && (
          <p className="field__ok">
            <CheckIcon className="icon-16" />
            {applied} applied
          </p>
        )}
      </div>

      <Button block>
        {spend > 0 ? `Buy ${money(total)} $RTX` : 'Buy $RTX'}
      </Button>

      {/* The question a buyer has at the CTA, answered in the site's own words
          from the FAQ: allocated to the paying wallet, unlocked in full at
          listing. It also gives the column's slack something to be. */}
      <ul className="buy__next">
        <li>Tokens are allocated to the wallet you pay from.</li>
        <li>Your allocation unlocks in full at listing — no cliff, no drip.</li>
        <li>Claim opens on this dashboard the day $RTX lists.</li>
      </ul>

      <div className="buy__pay-with">
        <span className="buy__pay-label">We accept</span>
        <span className="buy__marks">
          <PayMark id="BTC" className="icon-22" />
          <PayMark id="ETH" className="icon-22" />
          <PayMark id="USDT" className="icon-22" />
          <PayMark id="USDC" className="icon-22" />
          <PayMark id="SOL" className="icon-22" />
          <VisaMark className="icon-22" />
          <MastercardMark className="icon-22" />
        </span>
      </div>
    </section>
  );
}
