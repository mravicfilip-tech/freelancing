import { useEffect, useMemo, useState } from 'react';
import { PRESALE, TOKENS, money, usd, whole, type Order, type TokenId } from '../data';
import { Button } from '../Button';
import { Progress } from '../Progress';
import { TokenSelect } from '../TokenSelect';
import { ArrowUp, ChevronRight, PayMark, RtxMark } from '../icons';
import { Figure } from '../Figure';
import { EARN_ORDERS, STAGE } from './data';
import { UPDATES } from '../updates/data';
import { UpdateCard } from '../updates/UpdateCard';

/* ==========================================================================
   Latest updates — the newest four, as the Updates page shows them
   ========================================================================== */

export function Promos() {
  return (
    <section className="card promos" aria-labelledby="promos-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="promos-title">
            Latest updates
          </h2>
          <p className="orders__sub">What the team shipped, newest first</p>
        </div>
        <a className="link-quiet" href="/updates">
          All updates
          <ChevronRight className="icon-14" />
        </a>
      </header>
      <div className="upd-grid upd-grid--4">
        {UPDATES.slice(0, 4).map((u) => (
          <UpdateCard u={u} key={u.id} />
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
   Countdown to the price step-up
   ========================================================================== */

const pad = (n: number) => String(n).padStart(2, '0');

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, []);
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  };
}

/**
 * The flash sale's clock, with a days unit. The reference orders the units
 * Days · Minutes · Hours · Seconds; that is a slip in the source, not a design
 * choice, so they run in descending order here.
 */
export function Countdown({ size = 'md', title = 'Until the price steps up', next = true }: { size?: 'sm' | 'md' | 'lg'; title?: string; next?: boolean }) {
  const t = useCountdown(STAGE.secondsLeft);
  const units = [
    [t.days, 'Days'],
    [t.hours, 'Hours'],
    [t.minutes, 'Minutes'],
    [t.seconds, 'Seconds'],
  ] as const;
  return (
    <div className={`cd cd--${size}`}>
      <p className="cd__title">
        {title}
        {next && <span className="num">→ ${STAGE.nextPrice.toFixed(2)}</span>}
      </p>
      <div
        className="clock cd__clock"
        role="timer"
        aria-live="off"
        aria-label={`${t.days} days ${t.hours} hours ${t.minutes} minutes ${t.seconds} seconds until the price increases`}
      >
        {units.map(([v, label], i) => (
          <span key={label} className="cd__pair">
            {i > 0 && <span className="clock__colon" aria-hidden="true">:</span>}
            <span className="clock__unit">
              <span className="clock__value">{pad(v)}</span>
              <span className="clock__label">{label}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   How the stage is going: the hero's progress bar plus two facts
   ========================================================================== */

export function Raised({ inline = false }: { inline?: boolean }) {
  const pct = (STAGE.progress * 100).toFixed(1);
  return (
    <div className={`raised${inline ? ' raised--inline' : ''}`}>
      <div className="raised__bar">
        <Progress value={STAGE.progress} label={`Stage ${STAGE.n} is ${pct}% sold`} />
        <span className="raised__pct num" aria-hidden="true">
          {pct}%
        </span>
      </div>
      <dl className="raised__facts">
        <div>
          <dt>USDT raised</dt>
          <dd className="num">${whole(STAGE.raised)}</dd>
        </div>
        <div>
          <dt>Tokens sold</dt>
          <dd className="num">{whole(STAGE.tokensSold)} RTX</dd>
        </div>
        <div>
          <dt>Stage price</dt>
          <dd className="num">${STAGE.price.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}

/* ==========================================================================
   Buy
   The dashboard's calculator, cut to what the reference shows: method, amount
   with Max, what you receive, Buy now, promo.
   ========================================================================== */

const MAX_BY_TOKEN: Partial<Record<TokenId, number>> = { ETH: 1.284, USDT: 2_400, USDC: 2_400, BTC: 0.041, SOL: 22.5, BNB: 6.1 };

export function EarnBuy({
  children,
  compact = false,
}: {
  /** Anything a variant wants between the head and the form, e.g. the countdown. */
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const [token, setToken] = useState<TokenId>('ETH');
  const [pay, setPay] = useState('');
  const [promo, setPromo] = useState('');
  const rate = TOKENS.find((t) => t.id === token)?.usd ?? 1;

  const receive = useMemo(() => {
    const n = Number.parseFloat(pay);
    return Number.isFinite(n) && n > 0 ? (n * rate) / STAGE.price : 0;
  }, [pay, rate]);

  return (
    <section className={`card buy earn-buy${compact ? ' earn-buy--compact' : ''}`} aria-labelledby="earn-buy-title">
      <div className="card__head">
        <p className="earn-buy__rate">
          <span className="num">1 RTX = ${STAGE.price.toFixed(2)}</span>
        </p>
        <p className="earn-buy__stage">
          Current stage <b className="num">Stage {STAGE.n}</b>
        </p>
      </div>
      <h2 className="sr-only" id="earn-buy-title">
        Buy $RTX
      </h2>

      {children}

      <div className="earn-buy__pay-with">
        <span className="buy__pay-label">Buy with</span>
        <span className="buy__marks">
          {(['BTC', 'ETH', 'USDT', 'BNB', 'SOL'] as TokenId[]).map((id) => (
            <PayMark key={id} id={id} className="icon-22" />
          ))}
        </span>
      </div>

      <div className="earn-buy__grid">
        <div className="efield">
          <span className="field__label">Select payment method</span>
          <div className="field__control earn-buy__method">
            <TokenSelect value={token} onChange={setToken} detail />
          </div>
        </div>
        <div className="efield">
          <label className="field__label" htmlFor="earn-pay">
            Amount of {token} you pay
          </label>
          <div className="field__control">
            <input
              id="earn-pay"
              className="field__input"
              inputMode="decimal"
              placeholder="0"
              value={pay}
              onChange={(e) => setPay(e.target.value.replace(/[^\d.]/g, ''))}
            />
            <button type="button" className="chip" onClick={() => setPay(String(MAX_BY_TOKEN[token] ?? 0))}>
              Max
            </button>
          </div>
        </div>
      </div>

      <div className="efield">
        <span className="field__label">
          Amount of <b>$RTX</b> you receive
        </span>
        <div className="field__control">
          <span className="field__input field__input--output">{receive ? money(receive) : '0'}</span>
          <RtxMark className="icon-22 earn-buy__mark" />
        </div>
      </div>

      <Button block>{receive ? `Buy ${money(receive)} $RTX` : 'Buy now'}</Button>

      <div className="buy__promo earn-buy__promo">
        <input
          className="input"
          placeholder="Apply your promo code"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          aria-label="Promo code"
        />
        <Button variant="ghost" disabled={!promo.trim()}>
          Apply
        </Button>
      </div>
    </section>
  );
}

/* ==========================================================================
   Live orders
   ========================================================================== */

const label = (m: Order['method']) => (m === 'CARD' ? 'Card' : m);

/**
 * `table` is the dashboard's orders table plus the reference's price column
 * and row chevron; it keeps the same cell classes so the phone stacking rules
 * apply unchanged. `ticker` is one scrolling strip for the variant that runs
 * the feed under the topbar.
 */
export function EarnOrders({ layout = 'table', limit }: { layout?: 'table' | 'ticker'; limit?: number }) {
  const rows = limit ? EARN_ORDERS.slice(0, limit) : EARN_ORDERS;

  if (layout === 'ticker') {
    return (
      <section className="card ticker" aria-label="Live orders">
        <span className="ticker__label">
          <span className="topbar__dot" aria-hidden="true" />
          Live
        </span>
        <div className="ticker__rail">
          {[...rows, ...rows].map((o, i) => (
            <span className="ticker__item" key={`${o.id}-${i}`} aria-hidden={i >= rows.length || undefined}>
              <PayMark id={o.method} className="icon-16" />
              <span className="num">{money(o.rtx)} RTX</span>
              <span className="ticker__meta">{usd(o.usd)} · {o.minutesAgo}m ago</span>
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="card orders earn-orders" aria-labelledby="earn-orders-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="earn-orders-title">
            Live orders
          </h2>
          <p className="orders__sub">What other buyers just bought</p>
        </div>
        <a className="link-quiet" href="#orders-all">
          View all
          <ChevronRight className="icon-14" />
        </a>
      </header>

      <div className="orders__scroll">
        <table className="orders__table">
          <thead>
            <tr>
              <th scope="col">Coin</th>
              <th scope="col" className="earn-orders__id">Order</th>
              <th scope="col">Amount</th>
              <th scope="col" className="earn-orders__price">Price</th>
              <th scope="col">Value</th>
              <th scope="col" className="is-right">Time</th>
              <th scope="col" className="earn-orders__go"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <span className="orders__method">
                    <PayMark id={o.method} className="icon-22" />
                    {label(o.method)}
                  </span>
                </td>
                <td className="num orders__id earn-orders__id">#{o.id}</td>
                <td className="num orders__rtx">{money(o.rtx)}</td>
                <td className="num earn-orders__price">${STAGE.price.toFixed(2)}</td>
                <td className="num orders__usd">{usd(o.usd)}</td>
                <td className="num is-right orders__time">{o.minutesAgo}m ago</td>
                <td className="earn-orders__go">
                  <a className="chip-btn chip-btn--sm" href={`#order-${o.id}`} aria-label={`Open order ${o.id}`}>
                    <ChevronRight className="icon-16" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * The stage, as the dashboard's ladder card says it: the price at display
 * size with the next price as a chip, the hero's bar under it, and the clock
 * and facts on the right. What had been a wide band with one line of text in
 * its corner.
 */
export function StageCard() {
  const pct = (STAGE.progress * 100).toFixed(1);
  const uplift = Math.round((PRESALE.listPrice / STAGE.price - 1) * 100);
  return (
    <section className="card stg" aria-labelledby="stage-title">
      <div className="stg__top">
        <div className="stg__price">
          <p className="ladder__label" id="stage-title">
            <span className="topbar__dot" aria-hidden="true" />
            Stage {STAGE.n} · live
          </p>
          <div className="stg__fig-row">
            <Figure className="stg__fig" symbol="$" value={STAGE.price.toFixed(2)} />
            <p className="num ladder__next-price stg__next">
              <ArrowUp className="icon-14" />
              ${STAGE.nextPrice.toFixed(2)} next
            </p>
          </div>
        </div>
        <div className="stg__clock">
          <Countdown size="sm" next={false} />
        </div>
      </div>

      {/* One solid bar, the figure beside it rather than on it: the hero's
          ruled bar was hiding its own caption in the fill. */}
      <div className="stg__prog">
        <p className="stg__prog-head">
          <span>Stage {STAGE.n} progress</span>
          <span className="num stg__prog-pct">{pct}% sold</span>
        </p>
        <div
          className="sbar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(STAGE.progress * 100)}
          aria-label={`Stage ${STAGE.n} is ${pct}% sold`}
        >
          <span className="sbar__fill" style={{ width: `${STAGE.progress * 100}%` }} />
        </div>
      </div>

      <dl className="raised__facts stg__facts">
        <div><dt>USDT raised</dt><dd className="num">${whole(STAGE.raised)}</dd></div>
        <div><dt>Tokens sold</dt><dd className="num">{whole(STAGE.tokensSold)} RTX</dd></div>
        <div><dt>Left this stage</dt><dd className="num">${whole(PRESALE.usdLeft)}</dd></div>
        <div><dt>Listing price</dt><dd className="num">${PRESALE.listPrice.toFixed(2)} <small>+{uplift}%</small></dd></div>
      </dl>
    </section>
  );
}
