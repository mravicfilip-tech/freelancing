import { ArrowOut } from '../icons';
import { MARKETS_URL } from './urls';
import { PAIRS, fmt, history, pct, vol } from './feed';

function Spark({ closes }: { closes: number[] }) {
  const lo = Math.min(...closes), hi = Math.max(...closes), span = hi - lo || 1;
  const pts = closes.map((c, i) => `${(i / (closes.length - 1)) * 80},${22 - ((c - lo) / span) * 20 + 1}`).join(' ');
  const up = closes[closes.length - 1] >= closes[0];
  return (
    <svg viewBox="0 0 80 24" className={`pl__spark${up ? ' is-up' : ' is-down'}`} aria-hidden="true"><polyline points={pts} /></svg>
  );
}

/** Every market on the platform, as it opens: last, change, volume, a day's shape, and the way in. */
export function PairList() {
  return (
    <section className="card orders pl" aria-labelledby="pl-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="pl-title">Markets on the platform</h2>
          <p className="orders__sub">Spot and perpetual pairs at opening, indicative</p>
        </div>
        <a className="link-quiet" href={MARKETS_URL} target="_blank" rel="noopener">
          All markets
          <ArrowOut className="icon-14" />
        </a>
      </header>
      <div className="orders__scroll">
        <table className="orders__table">
          <thead>
            <tr>
              <th scope="col">Market</th>
              <th scope="col">Type</th>
              <th scope="col">Last</th>
              <th scope="col">24h</th>
              <th scope="col" className="pl__vol">24h volume</th>
              <th scope="col" className="pl__day"><span className="sr-only">Last day</span></th>
              <th scope="col" className="is-right"><span className="sr-only">Trade</span></th>
            </tr>
          </thead>
          <tbody>
            {PAIRS.map((p) => {
              const cs = history(p);
              const last = cs[cs.length - 1].c, ch = pct(last, cs[0].o);
              return (
                <tr key={p.id}>
                  <td className="pl__mkt"><b>{p.base}</b><span>/{p.quote}</span></td>
                  <td className="pl__kind">{p.kind === 'Perp' ? 'Perpetual' : 'Spot'}</td>
                  <td className="num pl__last">{fmt(last, p.decimals)}</td>
                  <td className={`num pl__chg${ch >= 0 ? ' is-up' : ' is-down'}`}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</td>
                  <td className="num pl__vol">{vol(p.volume)}</td>
                  <td className="pl__day"><Spark closes={cs.map((c) => c.c)} /></td>
                  <td className="is-right"><a className="chip pl__go" href={`${MARKETS_URL}trade/${p.id}`} target="_blank" rel="noopener">Trade</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
