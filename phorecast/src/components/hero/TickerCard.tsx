import { Icon } from '../Icon';
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
  /** The icon is one flat colour and must follow the page, not keep its own.
   *  True for Apple's mark, which is drawn in a single fill and is meant to be
   *  black on light and white on dark; false for Tesla's red, and for the
   *  Bitcoin and gold coins, which are their own colour on their own disc. */
  mono?: boolean;
};

export function TickerCard({ t }: { t: Ticker }) {
  return (
    <li className="ticker">
      <div className="ticker__head">
        <div className="ticker__id">
          {t.mono
            /* `style` empties the inline width/height `Icon` writes, so
               `.ticker__icon` owns the box -- the same hand-off SlideBonus makes
               for its badges. Without it the phone rule that clamps the strip's
               glyphs down to 26px and below could not reach this one: the inline
               32px outranks a class, so Apple's mark alone stayed 32 and stood
               the first row of the wrapped strip 6px taller than the second. */
            ? <Icon src={t.icon} w={32} h={32} className="ticker__icon" style={{ width: undefined, height: undefined }} />
            : <img src={t.icon} alt="" width={32} height={32} className="ticker__icon" />}
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
