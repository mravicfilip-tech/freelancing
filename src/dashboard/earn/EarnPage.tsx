import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { theme } from '../theme';
import { CheckIcon, PayMark, RtxMark } from '../icons';
import { ProductHero } from '../products/ProductHero';
import { RequestForm } from '../products/RequestForm';
import { EarnSim } from './EarnSim';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../settings/settings.css';
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

/** What will be on the shelf at launch; amounts and rates wait for it. */
const ASSETS = [
  { id: 'RTX', name: 'Remittix', flex: true, fixed: true, net: 'Ethereum' },
  { id: 'USDT', name: 'Tether', flex: true, fixed: true, net: 'Ethereum, Tron' },
  { id: 'USDC', name: 'USD Coin', flex: true, fixed: true, net: 'Ethereum, Solana' },
  { id: 'ETH', name: 'Ethereum', flex: true, fixed: true, net: 'Ethereum' },
  { id: 'BTC', name: 'Bitcoin', flex: true, fixed: false, net: 'Bitcoin' },
  { id: 'SOL', name: 'Solana', flex: true, fixed: false, net: 'Solana' },
] as const;

const NOTIFY = {
  title: 'Get notified at launch',
  body: 'One email when Earn opens, with the rates and terms.',
  cta: 'Notify me',
  success: "You're on the list. We'll email you once when Earn opens, with the rates and terms.",
  exists: 'This email is already on the Earn launch list.',
};

const focusNotify = () => {
  const el = document.getElementById('earn-notify');
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el?.focus({ preventScroll: true });
};

/**
 * Earn, before launch: the product as it will work, set up like the real
 * thing but with no rate or reward until there is one, and one action:
 * an email when it opens.
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
          slim
        >
          <RequestForm storageKey="rtx-earn-notify" copy={NOTIFY} inline id="earn-notify" />
        </ProductHero>

        <EarnSim onNotify={focusNotify} />

        <section className="card orders" aria-labelledby="ea-title">
          <header className="card__head">
            <div>
              <h2 className="card__title" id="ea-title">Assets at launch</h2>
              <p className="orders__sub">Which plans each asset opens with. Minimums and rates are confirmed before launch.</p>
            </div>
          </header>
          <div className="orders__scroll">
            <table className="orders__table ea">
              <thead>
                <tr>
                  <th scope="col">Asset</th>
                  <th scope="col">Flexible</th>
                  <th scope="col">Fixed term</th>
                  <th scope="col" className="ea__net">Network</th>
                  <th scope="col" className="is-right">Minimum</th>
                </tr>
              </thead>
              <tbody>
                {ASSETS.map((a) => (
                  <tr key={a.id}>
                    <td><span className="orders__method">{a.id === 'RTX' ? <RtxMark className="icon-22" /> : <PayMark id={a.id} className="icon-22" />}<b>{a.id}</b><span className="ea__name">{a.name}</span></span></td>
                    <td>{a.flex ? <span className="ea__yes"><CheckIcon className="icon-16" />Yes</span> : <span className="ea__no">Not at launch</span>}</td>
                    <td>{a.fixed ? <span className="ea__yes"><CheckIcon className="icon-16" />Yes</span> : <span className="ea__no">Not at launch</span>}</td>
                    <td className="ea__net">{a.net}</td>
                    <td className="is-right es__tbc">Confirmed at launch</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

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
