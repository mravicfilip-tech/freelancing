import { PRESALE, TOKENS, money, usd, stagePrice, type TokenId } from '../data';
import { PayMark } from '../icons';
import { ago, type TxRow } from './data';

/**
 * The three plots under the Markets figures. Each sits on its own inset
 * field and uses the card's full width. One hue throughout: the accent for
 * the data, the track for the rest; text stays in text tokens.
 */

const NAME: Record<string, string> = Object.fromEntries(TOKENS.map((t) => [t.id, t.name]));
const label = (m: string) => (m === 'CARD' ? 'Card' : m === 'Other' ? 'Other' : NAME[m] ?? m);

/**
 * Every purchase as a dot on a time axis, sized by what it cost, over bands
 * for the stage each cleared in. Newest at the right.
 */
export function PurchaseTimeline({ rows }: { rows: TxRow[] }) {
  const span = Math.max(1, ...rows.map((r) => r.hoursAgo)) * 1.04;
  /* 3% in from either edge, so the newest and oldest dots sit whole. */
  const x = (h: number) => 4 + (1 - h / span) * 92;
  const maxUsd = Math.max(...rows.map((r) => r.usd));
  const size = (v: number) => 8 + Math.sqrt(v / maxUsd) * 12;

  /* A band per stage, from midway before its first purchase to midway after its last. */
  const stages = [...new Set(rows.map((r) => r.stage))].sort((a, b) => a - b);
  const bands = stages.map((st, i) => {
    const mine = rows.filter((r) => r.stage === st).map((r) => r.hoursAgo);
    const newest = Math.min(...mine);
    const oldest = Math.max(...mine);
    const prevOldest = i > 0 ? Math.min(...rows.filter((r) => r.stage === stages[i - 1]).map((r) => r.hoursAgo)) : null;
    const nextNewest = i < stages.length - 1 ? Math.max(...rows.filter((r) => r.stage === stages[i + 1]).map((r) => r.hoursAgo)) : null;
    const from = prevOldest === null ? span : (oldest + prevOldest) / 2;
    const to = nextNewest === null ? 0 : (newest + nextNewest) / 2;
    return { st, left: x(from), width: x(to) - x(from) };
  });

  return (
    <div className="viz viz-tl" role="img" aria-label={`${rows.length} purchases over ${Math.round(span / 24)} days, across stages ${stages[0]} to ${stages[stages.length - 1]}`}>
      <div className="viz-tl__plot">
        {bands.map((b) => (
          <span key={b.st} className="viz-tl__band" style={{ left: `${b.left}%`, width: `${b.width}%` }} data-live={b.st === PRESALE.stage || undefined}>
            <span className="num">S{b.st}</span>
          </span>
        ))}
        <span className="viz-tl__axis" />
        {rows.map((r) => (
          <i
            key={r.id}
            className="viz-tl__dot"
            style={{ left: `${x(r.hoursAgo)}%`, width: size(r.usd), height: size(r.usd) }}
            title={`${ago(r.hoursAgo)}: ${usd(r.usd)} in stage ${r.stage}`}
          />
        ))}
      </div>
      <p className="viz-ends"><span>{Math.round(span / 24)} days ago</span><span>Today</span></p>
    </div>
  );
}

/** Where the money went, by what it was paid with: blocks as wide as their
    share, the coin mark inside each. */
export function SpendBlocks({ rows }: { rows: TxRow[] }) {
  const total = rows.reduce((s, r) => s + r.usd, 0);
  const by = new Map<string, number>();
  for (const r of rows) by.set(r.method, (by.get(r.method) ?? 0) + r.usd);
  const sorted = [...by.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3).reduce((s, [, v]) => s + v, 0);
  const parts = [...top.map(([m, v]) => ({ m, v })), ...(rest > 0 ? [{ m: 'Other', v: rest }] : [])];
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <div className="viz viz-blocks" role="img" aria-label={parts.map((p) => `${label(p.m)} ${pct(p.v)}%`).join(', ')}>
      {parts.map((p, i) => (
        <span key={p.m} className="viz-block" style={{ flex: p.v }} data-step={i} title={`${label(p.m)}: ${usd(p.v)} (${pct(p.v)}%)`}>
          <span className="viz-block__key">
            {p.m !== 'Other' ? <PayMark id={p.m as TokenId | 'CARD'} className="icon-16" /> : <i className="viz-block__other" aria-hidden="true" />}
            <span className="viz-block__name">{label(p.m)}</span>
          </span>
          <b className="num viz-block__pct">{pct(p.v)}%</b>
        </span>
      ))}
    </div>
  );
}

/**
 * The stages you bought in as a small ladder, each column at its price, the
 * average drawn across them and the listing price at the top.
 */
export function StageLadderMini({ rows, avg }: { rows: TxRow[]; avg: number }) {
  const first = Math.min(...rows.map((r) => r.stage));
  const last = Math.max(...rows.map((r) => r.stage));
  const stages = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const top = PRESALE.listPrice;
  const h = (p: number) => (p / top) * 100;
  const spentIn = (st: number) => rows.filter((r) => r.stage === st).reduce((s, r) => s + r.usd, 0);
  return (
    <div className="viz viz-ladder" role="img" aria-label={`Average ${money(avg, 3)} across stages ${first} to ${last}; listing at ${money(top)}`}>
      <div className="viz-ladder__plot">
        <span className="viz-ladder__line viz-ladder__line--list" style={{ bottom: '100%' }}>
          <span className="viz-ladder__tag viz-ladder__tag--left">Listing <b className="num">${top.toFixed(2)}</b></span>
        </span>
        <span className="viz-ladder__line viz-ladder__line--avg" style={{ bottom: `${h(avg)}%` }}>
          <span className="viz-ladder__tag">Average <b className="num">${avg.toFixed(3)}</b></span>
        </span>
        {stages.map((st) => (
          <span key={st} className="viz-ladder__col" title={`Stage ${st} at $${stagePrice(st).toFixed(2)}: ${usd(spentIn(st))} spent`}>
            <i style={{ height: `${h(stagePrice(st))}%` }} data-live={st === PRESALE.stage || undefined} />
            <span className="num viz-ladder__price">${stagePrice(st).toFixed(2)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
