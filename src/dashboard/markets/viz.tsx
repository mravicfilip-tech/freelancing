import { PRESALE, TOKENS, money, usd, type TokenId } from '../data';
import { PayMark } from '../icons';
import type { TxRow } from './data';

/**
 * The three small plots under the Markets figures. One hue throughout: the
 * accent for the data, the track for the rest; text stays in text tokens.
 */

/** Purchases per week, oldest week on the left. */
export function WeekBars({ rows, weeks = 9 }: { rows: TxRow[]; weeks?: number }) {
  const counts = Array.from({ length: weeks }, () => 0);
  for (const r of rows) {
    const w = Math.min(weeks - 1, Math.floor(r.hoursAgo / 168));
    counts[weeks - 1 - w] += 1;
  }
  const max = Math.max(1, ...counts);
  return (
    <div className="viz-cols" role="img" aria-label={`Purchases per week over the last ${weeks} weeks`}>
      {counts.map((n, i) => {
        const back = weeks - 1 - i;
        const label = back === 0 ? 'This week' : back === 1 ? 'Last week' : `${back} weeks ago`;
        return (
          <span key={i} className="viz-cols__slot" title={`${label}: ${n} purchase${n === 1 ? '' : 's'}`}>
            <i style={{ height: `${Math.max(6, (n / max) * 100)}%` }} data-now={back === 0 || undefined} />
          </span>
        );
      })}
    </div>
  );
}

const NAME: Record<string, string> = Object.fromEntries(TOKENS.map((t) => [t.id, t.name]));

/** Where the money went, by what it was paid with: the top three and the rest. */
export function SpendMix({ rows }: { rows: TxRow[] }) {
  const total = rows.reduce((s, r) => s + r.usd, 0);
  const by = new Map<string, number>();
  for (const r of rows) by.set(r.method, (by.get(r.method) ?? 0) + r.usd);
  const sorted = [...by.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3).reduce((s, [, v]) => s + v, 0);
  const parts = [...top.map(([m, v]) => ({ m, v })), ...(rest > 0 ? [{ m: 'Other', v: rest }] : [])];
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <div className="viz-mix">
      <div className="viz-stack" role="img" aria-label={parts.map((p) => `${p.m} ${pct(p.v)}%`).join(', ')}>
        {parts.map((p, i) => (
          <i key={p.m} style={{ flex: p.v }} data-step={i} title={`${p.m === 'CARD' ? 'Card' : p.m}: ${usd(p.v)} (${pct(p.v)}%)`} />
        ))}
      </div>
      <ul className="viz-legend">
        {parts.map((p, i) => (
          <li key={p.m}>
            <i className="viz-legend__swatch" data-step={i} aria-hidden="true" />
            {p.m !== 'Other' && <PayMark id={p.m as TokenId | 'CARD'} className="icon-16" />}
            <span>{p.m === 'CARD' ? 'Card' : p.m === 'Other' ? 'Other' : NAME[p.m] ?? p.m}</span>
            <b className="num">{pct(p.v)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Where the average sits between the lowest price paid and the listing price. */
export function PriceRange({ avg, low }: { avg: number; low: number }) {
  const high = PRESALE.listPrice;
  const at = Math.min(1, Math.max(0, (avg - low) / (high - low)));
  return (
    <div className="viz-range-wrap">
      <div className="viz-range" role="img" aria-label={`Average ${money(avg, 3)} between the first buy at ${money(low)} and the ${money(high)} listing`}>
        <i className="viz-range__fill" style={{ width: `${at * 100}%` }} />
        <i className="viz-range__dot" style={{ left: `${at * 100}%` }} title={`Average $${avg.toFixed(3)}`} />
      </div>
      <p className="viz-range__ends">
        <span><b className="num">${low.toFixed(2)}</b> first buy</span>
        <span><b className="num">${high.toFixed(2)}</b> listing</span>
      </p>
    </div>
  );
}
