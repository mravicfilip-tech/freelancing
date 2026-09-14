import { useId, useMemo, useState } from 'react';
import { TOKENS, money, type TokenId } from '../data';
import type { DashboardData } from '../useDashboardData';
import { CheckIcon, CopyIcon, MastercardMark, PayMark, RocketIcon, VisaMark } from '../icons';
import { Button } from '../Button';
import { TokenSelect } from '../TokenSelect';
import { useCopy } from '../useCopy';

type Method = 'crypto' | 'card';

/** Round sums a buyer actually thinks in, quoted in USD and converted per token. */
const QUICK_USD = [50, 100, 500, 1000];

export function BuyPanel({
  presale: PRESALE,
  flashSale,
}: Pick<DashboardData, 'presale' | 'flashSale'>) {
  const [method, setMethod] = useState<Method>('crypto');
  const [token, setToken] = useState<TokenId>('USDT');
  const [pay, setPay] = useState('');
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [promoError, setPromoError] = useState(false);
  const [codeCopied, copyCode] = useCopy();
  const payId = useId();
  const promoId = useId();
  const tabId = useId();

  const rate = method === 'card' ? 1 : (TOKENS.find((t) => t.id === token)?.usd ?? 1);
  const sale = flashSale.active ? flashSale : null;
  const bonus = applied && sale ? sale.bonus : 0;

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
    if (sale && promo.trim().toUpperCase() === sale.code) {
      setApplied(sale.code);
      setPromoError(false);
    } else {
      setPromoError(true);
    }
  };

  return (
    <section className="card buy" id="buy" aria-labelledby="buy-title">
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

        {/* What five ETH actually is. The pay field is denominated in the token,
            so without this the only dollar figure on screen is the RTX price —
            and a buyer cannot tell what they are about to send. Stablecoins are
            already dollars, so the line would just repeat the field. */}
        {rate !== 1 && spend > 0 && (
          <p className="buy__usd num">
            <span className="buy__usd-approx" aria-hidden="true">&asymp;</span>
            ${money(spend)}
            <span className="buy__usd-rate">at ${money(rate)} / {token}</span>
          </p>
        )}

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
          <dt>Stage {PRESALE.stage}</dt>
          <dd className="num">{money(base)} RTX</dd>
        </div>
        <div data-bonus>
          <dt>
            Bonus
            {bonus > 0 ? ` (${bonus * 100}%)` : ''}
          </dt>
          <dd className="num">
            {bonus > 0 ? (
              `+${money(extra)} RTX`
            ) : sale ? (
              /* The offer names a code the buyer then has to retype into the
                 field directly below it. Tapping it copies the code and fills
                 that field, so the bonus is one press away rather than a
                 transcription. */
              <button
                type="button"
                className="buy__offer"
                onClick={() => {
                  copyCode(sale.code);
                  setPromo(sale.code);
                  setPromoError(false);
                }}
                aria-label={`Use promo code ${sale.code} for ${sale.bonus * 100}% more`}
              >
                Add {sale.code} for {sale.bonus * 100}%
                {codeCopied ? (
                  <CheckIcon className="icon-14" />
                ) : (
                  <CopyIcon className="icon-14" />
                )}
              </button>
            ) : (
              'No code running'
            )}
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
          from the FAQ: unlocked in full at listing, claimed here. */}
      <ul className="buy__next">
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
