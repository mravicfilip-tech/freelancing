import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowOut } from '../icons';
import { MARKETS_URL } from './urls';
import { PAIRS, fmt, history, pct, rng, tick, type Candle, type Pair } from './feed';

/**
 * The trading product, in miniature: the pairs as a ticker, the selected
 * pair's candles, and its book. Prices are indicative and tick on their
 * own; every pair is a way into the platform.
 */

const W = 800, H = 240, PAD = 8;

function useFeed() {
  const [books, setBooks] = useState<Record<string, Candle[]>>(() => Object.fromEntries(PAIRS.map((p) => [p.id, history(p)])));
  const n = useRef(0);
  const r = useRef(rng(1234));
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      n.current += 1;
      setBooks((b) => Object.fromEntries(PAIRS.map((p) => [p.id, tick(b[p.id], n.current, r.current)])));
    }, 2600);
    return () => window.clearInterval(id);
  }, []);
  return books;
}

/** The changed price, flashing in its direction: remounted on every change. */
function Price({ value, decimals, dir }: { value: number; decimals: number; dir: 'up' | 'down' | 'flat' }) {
  return <span className="num tk__px" data-dir={dir} key={value}>{fmt(value, decimals)}</span>;
}

function Chart({ candles, p }: { candles: Candle[]; p: Pair }) {
  const lo = Math.min(...candles.map((c) => c.l)), hi = Math.max(...candles.map((c) => c.h));
  const span = hi - lo || 1;
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2);
  const step = W / candles.length, bw = step * 0.56;
  const last = candles[candles.length - 1];
  const ticks = [0, 1, 2, 3].map((i) => lo + (span * i) / 3);
  return (
    <div className="tm__chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="tm__svg" aria-label={`${p.base}/${p.quote} price, last ${fmt(last.c, p.decimals)}`}>
        {ticks.map((t) => <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} className="tm__grid" />)}
        {candles.map((c, i) => {
          const x = i * step + step / 2;
          const up = c.c >= c.o;
          return (
            <g key={i} className={up ? 'tm__c tm__c--up' : 'tm__c tm__c--down'}>
              <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} />
              <rect x={x - bw / 2} y={y(Math.max(c.o, c.c))} width={bw} height={Math.max(1.2, Math.abs(y(c.o) - y(c.c)))} />
            </g>
          );
        })}
        <line x1="0" x2={W} y1={y(last.c)} y2={y(last.c)} className="tm__last" />
      </svg>
      <span className="tm__axis" aria-hidden="true">
        {ticks.slice().reverse().map((t) => <span key={t} className="num">{fmt(t, p.decimals)}</span>)}
      </span>
      <span className="tm__tag num" style={{ top: `${(y(last.c) / H) * 100}%` }} aria-hidden="true">{fmt(last.c, p.decimals)}</span>
    </div>
  );
}

function Book({ last, p, seed }: { last: number; p: Pair; seed: number }) {
  const rows = useMemo(() => {
    const r = rng(seed);
    const mk = (side: 'ask' | 'bid') => Array.from({ length: 6 }, (_, i) => {
      const px = last * (1 + (side === 'ask' ? 1 : -1) * (i + 1) * 0.00035);
      const qty = 0.2 + r() * 4;
      return { px, qty };
    });
    const asks = mk('ask').reverse(), bids = mk('bid');
    const max = Math.max(...[...asks, ...bids].map((x) => x.qty));
    return { asks, bids, max };
  }, [last, seed]);
  const qd = p.base === 'BTC' ? 3 : 2;
  return (
    <div className="tm__book" aria-label="Order book">
      <p className="tm__book-head"><span>Price</span><span>Size ({p.base})</span></p>
      <ul className="tm__side tm__side--ask">
        {rows.asks.map((r, i) => (
          <li key={i} style={{ '--w': `${(r.qty / rows.max) * 100}%` } as React.CSSProperties}><span className="num">{fmt(r.px, p.decimals)}</span><span className="num">{fmt(r.qty, qd)}</span></li>
        ))}
      </ul>
      <p className="tm__spread num">{fmt(last, p.decimals)} <span>spread {fmt(last * 0.0007, p.decimals)}</span></p>
      <ul className="tm__side tm__side--bid">
        {rows.bids.map((r, i) => (
          <li key={i} style={{ '--w': `${(r.qty / rows.max) * 100}%` } as React.CSSProperties}><span className="num">{fmt(r.px, p.decimals)}</span><span className="num">{fmt(r.qty, qd)}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function Terminal() {
  const books = useFeed();
  const [sel, setSel] = useState(PAIRS[0].id);
  const prev = useRef<Record<string, number>>({});
  const p = PAIRS.find((x) => x.id === sel)!;
  const candles = books[sel];
  const last = candles[candles.length - 1].c;
  const dirs: Record<string, 'up' | 'down' | 'flat'> = {};
  for (const x of PAIRS) {
    const c = books[x.id][books[x.id].length - 1].c;
    const was = prev.current[x.id];
    dirs[x.id] = was === undefined || was === c ? 'flat' : c > was ? 'up' : 'down';
    prev.current[x.id] = c;
  }

  return (
    <section className="card tm" aria-labelledby="tm-title">
      <h2 className="sr-only" id="tm-title">Markets preview</h2>
      <div className="tk" role="tablist" aria-label="Markets">
        {PAIRS.map((x) => {
          const cs = books[x.id];
          const c = cs[cs.length - 1].c, ch = pct(c, cs[0].o);
          return (
            <button type="button" role="tab" key={x.id} className="tk__pair" aria-selected={x.id === sel} onClick={() => setSel(x.id)}>
              <span className="tk__name">{x.base}<span className="tk__quote">/{x.quote}</span>{x.kind === 'Perp' && <span className="tk__kind">Perp</span>}</span>
              <Price value={c} decimals={x.decimals} dir={dirs[x.id]} />
              <span className={`num tk__chg${ch >= 0 ? ' is-up' : ' is-down'}`}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </button>
          );
        })}
      </div>

      <div className="tm__body">
        <div className="tm__main">
          <header className="tm__head">
            <span className="tm__sym">{p.base}/{p.quote} <span className="pstat pstat--sm">{p.kind === 'Perp' ? 'Perpetual' : 'Spot'}</span></span>
            <span className="tm__meta">
              <span>24h high <b className="num">{fmt(Math.max(...candles.map((c) => c.h)), p.decimals)}</b></span>
              <span>24h low <b className="num">{fmt(Math.min(...candles.map((c) => c.l)), p.decimals)}</b></span>
              <span>1h candles</span>
            </span>
          </header>
          <Chart candles={candles} p={p} />
        </div>
        <Book last={last} p={p} seed={Math.round(last * 1000)} />
      </div>

      <footer className="tm__foot">
        <p className="pnote">Indicative prices. Live markets, orders and your balances are on the trading platform.</p>
        <a className="fh__btn fh__btn--primary" href={`${MARKETS_URL}trade/${p.id}`} target="_blank" rel="noopener">
          Trade {p.base}/{p.quote} on Remittix Markets
          <ArrowOut className="icon-16" />
        </a>
      </footer>
    </section>
  );
}
