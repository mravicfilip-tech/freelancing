import { useState } from 'react';
import { usd } from '../data';
import { RtxMark } from '../icons';
import { Figure } from '../Figure';
import { Pager } from '../Pager';
import { BoxArt, EmptyState } from '../EmptyState';
import { PAGE, RARITY, reward, when, type Claim } from './data';

/**
 * What the boxes have paid out: two figures, then the orders table with the
 * prize, its rarity as a tag in that rarity's colour, the odds, the box it
 * came from, what it cost and when.
 */
export function Claimed({ rows }: { rows: Claim[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const from = (page - 1) * PAGE;
  const slice = rows.slice(from, from + PAGE);
  const filler = Array.from({ length: PAGE - slice.length }, (_, i) => i);
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const rare = rows.filter((r) => r.prize.rarity !== 'uncommon').length;

  return (
    <section className="card orders claimed" aria-labelledby="claimed-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="claimed-title">Claimed rewards</h2>
          <p className="orders__sub">Every box this wallet has opened, newest first</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState art={BoxArt} title="No boxes opened yet" body="Every box you open lands here with its prize, the odds it beat and what it cost. Open one above to start the list." />
      ) : (
        <>
      <div className="claimed__stats">
        <div className="claimed__stat">
          <div>
            <span className="claimed__stat-label">Total prizes claimed</span>
            <Figure value={String(rows.length)} />
            <span className="claimed__stat-note">{rare} rare or better</span>
          </div>
          <span className="claimed__stat-mark"><RtxMark className="icon-22" /></span>
        </div>
        <div className="claimed__stat">
          <div>
            <span className="claimed__stat-label">Total money spent</span>
            <Figure symbol="$" value={spent.toLocaleString()} />
            <span className="claimed__stat-note">{usd(Math.round(spent / Math.max(1, rows.length)))} a box on average</span>
          </div>
          <span className="claimed__stat-mark"><RtxMark className="icon-22" /></span>
        </div>
      </div>

      <div className="orders__scroll">
        <table className="orders__table claimed__table">
          <thead>
            <tr>
              <th scope="col">Reward</th>
              <th scope="col">Rarity</th>
              <th scope="col">Odds</th>
              <th scope="col">Box bought</th>
              <th scope="col">Money spent</th>
              <th scope="col" className="is-right">Date bought</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((c) => (
              <tr key={c.id}>
                <td className="cl-who"><span className="orders__method"><RtxMark className="icon-22" />{reward(c.prize)}</span></td>
                <td className="cl-tag is-a"><span className="rtag" style={{ '--p-ink': RARITY[c.prize.rarity].ink } as React.CSSProperties}>{RARITY[c.prize.rarity].label}</span></td>
                <td className="num cl-odds">{c.prize.odds}%</td>
                <td className="cl-box is-b">{c.box}</td>
                <td className="num cl-spent is-key">{usd(c.spent)}</td>
                <td className="num is-right cl-when is-c">{when(c.when)}</td>
              </tr>
            ))}
            {filler.map((i) => (
              <tr key={`f${i}`} className="tx__filler" aria-hidden="true"><td colSpan={6}>&nbsp;</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="tx__foot">
        <p className="tx__count num">Showing {from + 1}–{from + slice.length} of {rows.length}</p>
        {pages > 1 && <Pager page={page} pages={pages} onPage={setPage} />}
      </footer>
        </>
      )}
    </section>
  );
}
