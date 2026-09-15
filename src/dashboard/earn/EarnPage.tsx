import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { theme } from '../theme';
import { CheckIcon } from '../icons';
import { ProductHero } from '../products/ProductHero';
import { EarnArt } from '../products/art';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../products/products.css';

const PRODUCTS = [
  {
    title: 'Flexible Savings',
    body: 'Earn a variable rate while retaining access to your supported assets, subject to product terms.',
    points: ['Variable reward rate', 'Flexible access to funds', 'Rewards tracked in your dashboard'],
  },
  {
    title: 'Fixed Term Savings',
    body: 'Lock supported assets for a selected period and earn the stated fixed rate for that term.',
    points: ['Fixed rate for the selected term', 'Clear maturity date', 'Simple reward tracking'],
  },
];

/**
 * Earn, before launch: what the two savings products will be and how they
 * differ. No rates, balances or deposits appear until the product is live,
 * and the one action stays disabled until then.
 */
export function EarnPage() {
  const mode = theme.use();
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash pd pd-earn" data-theme={mode}>
      <Sidebar active="earn" />
      <main className="dash__main">
        <Topbar title="Earn" />
        <ProductHero
          id="earn-title"
          status="Coming soon"
          title="Put your crypto to work"
          body="Remittix Earn is being built to make earning on supported crypto simple. Choose flexible access or lock assets for a fixed term, then track everything from your dashboard."
          aside={<EarnArt />}
        >
          <Button disabled>Earn is coming soon</Button>
        </ProductHero>

        <div className="pduo">
          {PRODUCTS.map((p) => (
            <section className="card pduo__card" key={p.title} aria-labelledby={`earn-${p.title.split(' ')[0].toLowerCase()}`}>
              <header className="card__head">
                <div>
                  <h2 className="card__title" id={`earn-${p.title.split(' ')[0].toLowerCase()}`}>{p.title}</h2>
                  <p className="orders__sub">{p.body}</p>
                </div>
              </header>
              <ul className="plist">
                {p.points.map((pt) => (
                  <li key={pt}>
                    <span className="plist__tick" aria-hidden="true"><CheckIcon className="icon-16" /></span>
                    {pt}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="pdisc">Rates, supported assets, terms and eligibility will be confirmed before launch. Cryptoasset products carry risk and returns are not guaranteed.</p>
      </main>
      <MobileNav active="earn" />
    </div>
  );
}
