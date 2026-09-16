import trendUp from '../../assets/icons/trend-up.svg';
import trendDown from '../../assets/icons/trend-down.svg';
import triangle from '../../assets/icons/triangle.svg';
import './TickerCard.css';

export type Ticker = {
  symbol: string;
  name: string;
  price: string;
  change: string;   // "+3.57%"
  up: boolean;
  icon: string;
};

export function TickerCard({ t }: { t: Ticker }) {
  return (
    <li className="ticker">
      <div className="ticker__head">
        <div className="ticker__id">
          <img src={t.icon} alt="" width={32} height={32} className="ticker__icon" />
          <span className="ticker__symbol">{t.symbol}</span>
        </div>
        <img src={t.up ? trendUp : trendDown} alt="" width={20} height={11.56} className="ticker__trend" />
      </div>
      <p className="ticker__name">{t.name}</p>
      <p className="ticker__price">{t.price}</p>
      <div className={`ticker__pill ${t.up ? 'ticker__pill--up' : 'ticker__pill--down'}`}>
        <img src={triangle} alt="" width={12} height={10} className={t.up ? '' : 'is-flipped'} />
        <span>{t.change}</span>
      </div>
    </li>
  );
}
