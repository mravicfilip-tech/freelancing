import { PRESALE, TOKENS, money, usd, type TokenId } from '../data';
import { PayMark } from '../icons';
import type { TxRow } from './data';

/**
 * The three small plots under the Markets figures. One hue throughout: the
 * accent for the data, the track for the rest; text stays in text tokens.
 */

/** Purchases per week as units: one square per purchase, stacked, oldest
    week on the left. Counts this small read exactly as units where a bar
    would only read as short. */
export function WeekBars({ rows, weeks = 9 }: { rows: TxRow[]; weeks?: number }) {
  const counts = Array.from({ length: weeks }, () => 0);
  for (const r of rows) {
    const w = Math.min(weeks - 1, Math.floor(r.hoursAgo / 168));
    counts[weeks - 1 - w] += 1;
  }
  return (
    <div className="viz-units-wrap">
      <div className="viz-units" role="img" aria-label={`Purchases per week over the last ${weeks} weeks`}>
        {counts.map((n, i) => {
          const back = weeks - 1 - i;
          const label = back === 0 ? 'This week' : back === 1 ? 'Last week' : `${back} weeks ago`;
          return (
            <span key={i} className="viz-units__col" title={`${label}: ${n} purchase${n === 1 ? '' : 's'}`} data-now={back === 0 || undefined}>
              {Array.from({ length: n }, (_, k) => <i key={k} />)}
              {n === 0 && <i data-empty />}
            </span>
          );
        })}
      </div>
      <p className="viz-ends"><span>{weeks - 1} weeks ago</span><span>This week</span></p>
    </div>
  );
}

const NAME: Record<string, string> = Object.fromEntries(TOKENS.map((t) => [t.id, t.name]));

/** Where the money went, by what it was paid with: the top three and the
    rest, as bar rows keyed by the coin marks. */
export function SpendMix({ rows }: { rows: TxRow[] }) {
  const total = rows.reduce((s, r) => s + r.usd, 0);
  const by = new Map<string, number>();
  for (const r of rows) by.set(r.method, (by.get(r.method) ?? 0) + r.usd);
  const sorted = [...by.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3).reduce((s, [, v]) => s + v, 0);
  const parts = [...top.map(([m, v]) => ({ m, v })), ...(rest > 0 ? [{ m: 'Other', v: rest }] : [])];
  const max = Math.max(...parts.map((p) => p.v));
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <ul className="viz-rows" aria-label="Spend by payment method">
      {parts.map((p) => (
        <li key={p.m} className="viz-rows__row" title={`${p.m === 'CARD' ? 'Card' : p.m}: ${usd(p.v)} (${pct(p.v)}%)`}>
          <span className="viz-rows__key">
            {p.m !== 'Other' ? <PayMark id={p.m as TokenId | 'CARD'} className="icon-16" /> : <i className="viz-rows__other" aria-hidden="true" />}
            {p.m === 'CARD' ? 'Card' : p.m === 'Other' ? 'Other' : NAME[p.m] ?? p.m}
          </span>
          <span className="viz-rows__bar"><i style={{ width: `${(p.v / max) * 100}%` }} /></span>
          <b className="num viz-rows__pct">{pct(p.v)}%</b>
        </li>
      ))}
    </ul>
  );
}

/** Where the average sits between the lowest price paid and the listing price. */
export function PriceRange({ avg, low, stages }: { avg: number; low: number; stages: { n: number; price: number }[] }) {
  const high = PRESALE.listPrice;
  const pos = (v: number) => Math.min(1, Math.max(0, (v - low) / (high - low)));
  const at = pos(avg);
  return (
    <div className="viz-range-wrap">
      <div className="viz-range" role="img" aria-label={`Average ${money(avg, 3)} between the first buy at ${money(low)} and the ${money(high)} listing`}>
        <i className="viz-range__fill" style={{ width: `${at * 100}%` }} />
        {stages.map((st) => (
          <i key={st.n} className="viz-range__tick" style={{ left: `${pos(st.price) * 100}%` }} title={`Stage ${st.n}: $${st.price.toFixed(2)}`} data-live={st.n === PRESALE.stage || undefined} />
        ))}
        <i className="viz-range__dot" style={{ left: `${at * 100}%` }} title={`Average $${avg.toFixed(3)}`} />
      </div>
      <p className="viz-range__ends">
        <span><b className="num">${low.toFixed(2)}</b> first buy</span>
        <span><b className="num">${high.toFixed(2)}</b> listing</span>
      </p>
    </div>
  );
}
