import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { theme } from '../theme';
import { ArrowOut } from '../icons';
import { ProductHero } from '../products/ProductHero';
import { PositionsGlyph, SpotGlyph, WalletGlyph } from '../products/art';
import { Terminal } from './Terminal';
import { PairList } from './PairList';
import { MARKETS_URL } from './urls';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../products/products.css';

const FEATURES = [
  { Glyph: SpotGlyph, title: 'Spot and perpetual markets', body: 'Choose the market and trading product that fits your strategy.' },
  { Glyph: WalletGlyph, title: 'Wallet-connected access', body: 'Connect a supported wallet to deposit, trade and withdraw.' },
  { Glyph: PositionsGlyph, title: 'Manage every position', body: 'Review open positions, orders, trade history and account equity.' },
];

/**
 * Markets is a gateway: the trading product lives on its own domain. The
 * page shows it in miniature, ticking, and every pair is a way in.
 */
export function MarketsGate() {
  const mode = theme.use();
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash pd pd-markets" data-theme={mode}>
      <Sidebar active="markets" />
      <main className="dash__main">
        <Topbar title="Markets" />
        <ProductHero
          id="markets-title"
          status="Dedicated trading platform"
          title="Trade crypto with Remittix Markets"
          body="Access spot and perpetual markets through the dedicated Remittix trading platform. Connect your wallet to view live markets, manage positions and place trades."
        >
          <a className="fh__btn fh__btn--primary" href={MARKETS_URL} target="_blank" rel="noopener">
            Launch Remittix Markets
            <ArrowOut className="icon-16" />
          </a>
          <p className="phero__note">You'll be redirected to remittixmarkets.io</p>
        </ProductHero>

        <Terminal />
        <PairList />

        <section className="pfeat" aria-label="What Remittix Markets offers">
          {FEATURES.map(({ Glyph, title, body }) => (
            <article className="card pfeat__item" key={title}>
              <span className="pfeat__glyph"><Glyph /></span>
              <h3 className="pfeat__title">{title}</h3>
              <p className="pfeat__body">{body}</p>
            </article>
          ))}
        </section>
      </main>
      <MobileNav active="markets" />
    </div>
  );
}
