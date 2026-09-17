import s3Btc from '../../../assets/steps/s3-btc.svg';
import s3Target from '../../../assets/steps/s3-target.svg';
import s3Tesla from '../../../assets/steps/s3-tesla.svg';
import s3Sp500 from '../../../assets/steps/s3-sp500.svg';
import s3Apple from '../../../assets/steps/s3-apple.svg';
import s3Chart from '../../../assets/steps/s3-chart.svg';
import { Mark, Glow } from './shared';
import './PanelTrade.css';

/* Panel 3 — market picker and price chart -------------------------------- */
const ASSETS = [
  { icon: s3Btc, active: true },
  { icon: s3Target, active: false },
  { icon: s3Tesla, active: false },
  { icon: s3Sp500, active: false },
  { icon: s3Apple, active: false },
];
export function PanelTrade() {
  return (
    <div className="panel panel--3">
      <Mark className="steps__mark--corner" />
      <Glow className="steps__glow--corner" />
      <div className="s3" aria-hidden="true">
        <div className="s3__tiles">
          {ASSETS.map((a, i) => (
            <span key={i} className={`s3__tile${a.active ? ' is-active' : ''}`}><img src={a.icon} alt="" /></span>
          ))}
        </div>
        <div className="s3__chart-card">
          <p className="s3__label">Market price</p>
          <p className="s3__price">62,894.<span>00</span></p>
          <p className="s3__delta">+2.41%</p>
          <img src={s3Chart} alt="" className="s3__chart" width={371} height={191} />
        </div>
      </div>
    </div>
  );
}
