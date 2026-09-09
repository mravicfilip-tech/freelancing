import { useId, useMemo, useState } from 'react';
import { FLASH_SALE, PRESALE, TOKENS, money, type TokenId } from '../data';
import { CheckIcon, MastercardMark, PayMark, RocketIcon, VisaMark } from '../icons';

type Method = 'crypto' | 'card';

export function BuyPanel() {
  const [method, setMethod] = useState<Method>('crypto');
  const [token, setToken] = useState<TokenId>('USDT');
  const [pay, setPay] = useState('');
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const payId = useId();
  const receiveId = useId();
  const promoId = useId();

  const rate = method === 'card' ? 1 : (TOKENS.find((t) => t.id === token)?.usd ?? 1);
  const bonus = applied ? FLASH_SALE.bonus : 0;

  const receive = useMemo(() => {
    const amount = Number.parseFloat(pay);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    return (amount * rate * (1 + bonus)) / PRESALE.price;
  }, [pay, rate, bonus]);

  const promoValid = promo.trim().toUpperCase() === FLASH_SALE.code;

  return (
    <section className="card buy" aria-labelledby="buy-title">
      <h2 className="card__title buy__title" id="buy-title">
        Buy $RTX
      </h2>

      <div className="buy__form">
        <p className="buy__urgency">
          <RocketIcon className="icon-16" />
          Buy before the price goes up
        </p>

        <div className="tabs" role="tablist" aria-label="Payment method">
          <button
            type="button"
            role="tab"
            className="tabs__tab"
            aria-selected={method === 'crypto'}
            onClick={() => setMethod('crypto')}
          >
            Crypto
          </button>
          <button
            type="button"
            role="tab"
            className="tabs__tab"
            aria-selected={method === 'card'}
            onClick={() => setMethod('card')}
          >
            Credit card
          </button>
        </div>

        <div className="buy__pair">
          <div className="field">
            <label className="field__label" htmlFor={payId}>
              You pay
            </label>
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
                <div className="field__token">
                  <PayMark id={token} className="icon-20" />
                  <select
                    className="field__select"
                    aria-label="Pay with"
                    value={token}
                    onChange={(e) => setToken(e.target.value as TokenId)}
                  >
                    {TOKENS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="field__token">
                  <PayMark id="CARD" className="icon-20" />
                  USD
                </span>
              )}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={receiveId}>
              You receive
            </label>
            <div className="field__control">
              <output id={receiveId} className="field__input field__input--output">
                {receive ? money(receive) : '0'}
              </output>
              <span className="field__token">RTX</span>
            </div>
          </div>
        </div>

        {bonus > 0 && (
          <p className="buy__bonus">
            <CheckIcon className="icon-16" />
            {FLASH_SALE.code} applied, adding {bonus * 100}% bonus $RTX
          </p>
        )}

        <div className="field">
          <label className="field__label" htmlFor={promoId}>
            Promo code
          </label>
          <div className="buy__promo">
            <input
              id={promoId}
              className="input"
              placeholder="Enter a promo code"
              value={promo}
              onChange={(e) => {
                setPromo(e.target.value);
                setApplied(null);
              }}
            />
            <button
              type="button"
              className="btn-ghost"
              disabled={!promoValid || applied !== null}
              onClick={() => promoValid && setApplied(FLASH_SALE.code)}
            >
              {applied ? 'Applied' : 'Apply'}
            </button>
          </div>
        </div>

        <div className="buy__pay-with">
          <span className="buy__pay-label">Pay with</span>
          <span className="buy__marks">
            <PayMark id="BTC" className="icon-22" />
            <PayMark id="ETH" className="icon-22" />
            <PayMark id="USDT" className="icon-22" />
            <PayMark id="USDC" className="icon-22" />
            <PayMark id="SOL" className="icon-22" />
            <VisaMark className="mark-card" />
            <MastercardMark className="mark-card" />
          </span>
        </div>

        <button type="button" className="btn-accent btn-accent--block">
          Buy $RTX
        </button>
      </div>
    </section>
  );
}
