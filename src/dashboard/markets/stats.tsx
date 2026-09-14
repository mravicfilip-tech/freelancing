import { PRESALE, TOKENS, money, usd, stagePrice, whole, type TokenId } from '../data';
import { Figure } from '../Figure';
import { PayMark, RtxMark } from '../icons';
import { Progress } from '../Progress';
import { Stat } from '../panels/StatRow';
import { ago, summarise, type TxRow } from './data';

/**
 * The figures over the transactions table, in five forms. Every form is
 * built from parts the dashboard already draws — inset fact tiles, the
 * presale ladder's columns, the hero's striped bar, the orders table's
 * zebra rows — so it reads as the same product, not a chart pasted in.
 */
export type StatsVariant = 1 | 2 | 3 | 4 | 5;

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

/* ---------- Shared: fact tiles, as the stage card draws them ---------- */
function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="mk-facts">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd className="num">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Shared: the presale ladder's columns ---------- */
function Ladder({ steps, mark }: { steps: { n: number; price: number; value: number; live?: boolean }[]; mark?: number }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="mk-ladder">
      <ol className="ladder__steps mk-ladder__steps">
        {steps.map((s) => (
          <li
            key={s.n}
            className="ladder__step"
            data-state={s.live ? 'live' : 'done'}
            style={{ '--step': `${18 + (s.value / max) * 60}px` } as React.CSSProperties}
            title={`Stage ${s.n}`}
          >
            <span className="ladder__bar"><span className="ladder__fill" /></span>
            <span className="ladder__n">${s.price.toFixed(2)}</span>
          </li>
        ))}
      </ol>
      {mark !== undefined && (
        <span className="mk-ladder__mark" style={{ bottom: `${20 + (mark / PRESALE.listPrice) * 60}px` }}>
          <span className="num">${mark.toFixed(3)}</span>
        </span>
      )}
    </div>
  );
}

/* ---------- S1: facts only ---------- */
function S1({ rows }: { rows: TxRow[] }) {
  const d = derive(rows);
  const top = d.methods[0];
  return (
    <section className="stat-row" aria-label="Your purchases">
      <Stat label="Completed purchases" value={String(d.sum.count)} note={`Across stages ${d.sum.firstStage} to ${d.sum.lastStage}`}>
        <Facts items={[['This stage', d.thisStage], ['Largest', usd(d.largest.usd)]]} />
      </Stat>
      <Stat label="Total spent" symbol="$" value={money(d.sum.spent)} suffix="USDT" note={`For ${money(d.sum.rtx)} $RTX`} mark="usdt">
        <Facts items={[['Mostly with', <><PayMark id={top.m as TokenId | 'CARD'} className="icon-16" /> {label(top.m)} {Math.round(top.share * 100)}%</>], ['Average buy', usd(d.sum.spent / d.sum.count)]]} />
      </Stat>
      <Stat label="Average price paid" symbol="$" value={d.sum.avgPrice.toFixed(3)} note={`Listing at $${PRESALE.listPrice.toFixed(2)} is ${d.uplift}% higher`} mark="coin">
        <Facts items={[['First buy', `$${d.low.toFixed(2)}`], ['Listing', `$${PRESALE.listPrice.toFixed(2)}`]]} />
      </Stat>
    </section>
  );
}

/* ---------- S2: the ladder under every figure ---------- */
function S2({ rows }: { rows: TxRow[] }) {
  const d = derive(rows);
  const live = (n: number) => n === PRESALE.stage;
  return (
    <section className="stat-row" aria-label="Your purchases">
      <Stat label="Completed purchases" value={String(d.sum.count)} note="Per stage, at the price you paid">
        <Ladder steps={d.stages.map((s) => ({ n: s.n, price: s.price, value: s.count, live: live(s.n) }))} />
      </Stat>
      <Stat label="Total spent" symbol="$" value={money(d.sum.spent)} suffix="USDT" note="Per stage" mark="usdt">
        <Ladder steps={d.stages.map((s) => ({ n: s.n, price: s.price, value: s.usd, live: live(s.n) }))} />
      </Stat>
      <Stat label="Average price paid" symbol="$" value={d.sum.avgPrice.toFixed(3)} note={`Between your first buy and the $${PRESALE.listPrice.toFixed(2)} listing`} mark="coin">
        <Ladder steps={d.stages.map((s) => ({ n: s.n, price: s.price, value: s.price, live: live(s.n) }))} mark={d.sum.avgPrice} />
      </Stat>
    </section>
  );
}

/* ---------- S3: one card, modelled on the presale's stage card ---------- */
function S3({ rows }: { rows: TxRow[] }) {
  const d = derive(rows);
  const max = Math.max(...d.stages.map((s) => s.usd));
  return (
    <section className="card mk-pos" aria-label="Your position">
      <div className="mk-pos__head">
        <div>
          <p className="ladder__label">Total spent</p>
          <Figure className="ladder__price" symbol="$" value={money(d.sum.spent)} suffix="USDT" />
        </div>
        <div className="mk-pos__facts">
          <div><dt>Purchases</dt><dd className="num">{d.sum.count}</dd></div>
          <div><dt>Average price</dt><dd className="num">${d.sum.avgPrice.toFixed(3)}</dd></div>
          <div><dt>First buy</dt><dd className="num">${d.low.toFixed(2)}</dd></div>
          <div><dt>Listing</dt><dd className="num">${PRESALE.listPrice.toFixed(2)} <small>+{d.uplift}%</small></dd></div>
        </div>
      </div>
      <ol className="ladder__steps mk-pos__steps" aria-label="What you spent in each stage">
        {d.stages.map((s) => (
          <li key={s.n} className="ladder__step" data-state={s.n === PRESALE.stage ? 'live' : 'done'} style={{ '--step': `${24 + (s.usd / max) * 70}px` } as React.CSSProperties} title={`Stage ${s.n}: ${usd(s.usd)} for ${money(s.rtx)} RTX`}>
            <span className="ladder__bar"><span className="ladder__fill" /></span>
            <span className="ladder__n">${s.price.toFixed(2)}</span>
          </li>
        ))}
      </ol>
      <dl className="ladder__facts">
        <div><dt>Stages bought in</dt><dd className="num">{d.stages.length} of 12</dd></div>
        <div><dt>Largest purchase</dt><dd className="num">{usd(d.largest.usd)}</dd></div>
        <div><dt>Paid in crypto</dt><dd className="num">{Math.round(d.crypto * 100)}%</dd></div>
      </dl>
    </section>
  );
}

/* ---------- S4: the hero's striped bar, one per figure ---------- */
function Bar({ value, left, right }: { value: number; left: string; right: string }) {
  return (
    <div className="mk-bar">
      <p className="mk-bar__head"><span>{left}</span><span className="num">{right}</span></p>
      <Progress value={value} label={`${left}: ${right}`} className="mk-bar__prog" />
    </div>
  );
}
function S4({ rows }: { rows: TxRow[] }) {
  const d = derive(rows);
  const at = (d.sum.avgPrice - d.low) / (PRESALE.listPrice - d.low);
  return (
    <section className="stat-row" aria-label="Your purchases">
      <Stat label="Completed purchases" value={String(d.sum.count)} note={`Across stages ${d.sum.firstStage} to ${d.sum.lastStage}`}>
        <Bar value={d.stages.length / 12} left="Stages bought in" right={`${d.stages.length} of 12`} />
      </Stat>
      <Stat label="Total spent" symbol="$" value={money(d.sum.spent)} suffix="USDT" note={`For ${money(d.sum.rtx)} $RTX`} mark="usdt">
        <Bar value={d.crypto} left="Paid in crypto" right={`${Math.round(d.crypto * 100)}%`} />
      </Stat>
      <Stat label="Average price paid" symbol="$" value={d.sum.avgPrice.toFixed(3)} note={`Listing at $${PRESALE.listPrice.toFixed(2)} is ${d.uplift}% higher`} mark="coin">
        <Bar value={at} left={`From $${d.low.toFixed(2)} to $${PRESALE.listPrice.toFixed(2)}`} right={`${Math.round(at * 100)}% of the way`} />
      </Stat>
    </section>
  );
}

/* ---------- S5: three zebra rows under each figure ---------- */
function Rows({ rows }: { rows: [React.ReactNode, React.ReactNode, React.ReactNode][] }) {
  return (
    <ul className="mk-rows">
      {rows.map((r, i) => (
        <li key={i}><span className="mk-rows__a">{r[0]}</span><span className="num mk-rows__b">{r[1]}</span><span className="num mk-rows__c">{r[2]}</span></li>
      ))}
    </ul>
  );
}
function S5({ rows }: { rows: TxRow[] }) {
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

const FORMS = { 1: S1, 2: S2, 3: S3, 4: S4, 5: S5 } as const;

export function StatsRow({ rows, variant }: { rows: TxRow[]; variant: StatsVariant }) {
  const Form = FORMS[variant];
  return <Form rows={rows} />;
}
