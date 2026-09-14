import { PRESALE, TOKENS, money, usd, stagePrice, whole, type TokenId } from '../data';
import { PayMark, RtxMark } from '../icons';
import { Stat } from '../panels/StatRow';
import { ago, summarise, type TxRow } from './data';

/**
 * The figures over the transactions table. Under each, three rows in the
 * orders table's zebra: the last three purchases, what you paid with, and
 * the last three stages. The dashboard's own parts, so it reads as the same
 * product, not a chart pasted in.
 */

const NAME: Record<string, string> = Object.fromEntries(TOKENS.map((t) => [t.id, t.name]));
const label = (m: string) => (m === 'CARD' ? 'Card' : NAME[m] ?? m);

function derive(rows: TxRow[]) {
  const sum = summarise(rows);
  const by = new Map<string, number>();
  for (const r of rows) by.set(r.method, (by.get(r.method) ?? 0) + r.usd);
  const methods = [...by.entries()].sort((a, b) => b[1] - a[1]).map(([m, v]) => ({ m, v, share: v / sum.spent }));
  const largest = rows.reduce((a, b) => (b.usd > a.usd ? b : a), rows[0]);
  const stages = Array.from({ length: sum.lastStage - sum.firstStage + 1 }, (_, i) => sum.firstStage + i).map((n) => ({
    n,
    price: stagePrice(n),
    count: rows.filter((r) => r.stage === n).length,
    usd: rows.filter((r) => r.stage === n).reduce((s, r) => s + r.usd, 0),
    rtx: rows.filter((r) => r.stage === n).reduce((s, r) => s + r.rtx, 0),
  }));
  const thisStage = rows.filter((r) => r.stage === PRESALE.stage).length;
  const crypto = rows.filter((r) => r.method !== 'CARD').reduce((s, r) => s + r.usd, 0) / sum.spent;
  const low = Math.min(...rows.map((r) => r.price));
  const uplift = Math.round((PRESALE.listPrice / sum.avgPrice - 1) * 100);
  return { sum, methods, largest, stages, thisStage, crypto, low, uplift };
}

/* ---------- Three zebra rows under each figure ---------- */
function Rows({ rows }: { rows: [React.ReactNode, React.ReactNode, React.ReactNode][] }) {
  return (
    <ul className="mk-rows">
      {rows.map((r, i) => (
        <li key={i}><span className="mk-rows__a">{r[0]}</span><span className="num mk-rows__b">{r[1]}</span><span className="num mk-rows__c">{r[2]}</span></li>
      ))}
    </ul>
  );
}
export function StatsRow({ rows }: { rows: TxRow[] }) {
  const d = derive(rows);
  const last3 = rows.slice(0, 3);
  const top3 = d.methods.slice(0, 3);
  const st3 = [...d.stages].reverse().slice(0, 3);
  return (
    <section className="stat-row" aria-label="Your purchases">
      <Stat label="Completed purchases" value={String(d.sum.count)} note="The last three">
        <Rows rows={last3.map((r) => [<><PayMark id={r.method} className="icon-16" /> {label(r.method)}</>, `${money(r.rtx)} RTX`, ago(r.hoursAgo)])} />
      </Stat>
      <Stat label="Total spent" symbol="$" value={money(d.sum.spent)} suffix="USDT" note="By what you paid with" mark="usdt">
        <Rows rows={top3.map((m) => [<><PayMark id={m.m as TokenId | 'CARD'} className="icon-16" /> {label(m.m)}</>, usd(m.v), `${Math.round(m.share * 100)}%`])} />
      </Stat>
      <Stat label="Average price paid" symbol="$" value={d.sum.avgPrice.toFixed(3)} note="The last three stages" mark="coin">
        <Rows rows={st3.map((s) => [<><RtxMark className="icon-16" /> Stage {s.n}</>, `$${s.price.toFixed(2)}`, `${whole(s.rtx)} RTX`])} />
      </Stat>
    </section>
  );
}
