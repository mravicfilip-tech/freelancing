import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { theme } from '../theme';
import { ProductHero } from '../products/ProductHero';
import { PayFiCalc } from './PayFiCalc';
import { CORRIDORS } from './corridors';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../settings/settings.css';
import '../products/products.css';

const STEPS = [
  { title: 'Set up the transfer', body: 'Choose the supported crypto you want to use and the fiat currency the recipient should receive.' },
  { title: 'Add bank details', body: 'Enter the recipient and bank information required for the payout.' },
  { title: 'Send and track', body: 'Confirm the transfer, send the crypto and follow the payment status from your dashboard.' },
];

const BETA = {
  title: 'Request PayFi beta access',
  body: 'Join the whitelist and we will email you when your account is approved.',
  cta: 'Request beta access',
  success: "Your request has been received. We'll email you if your account is approved for PayFi beta access.",
  exists: 'This email is already on the PayFi beta whitelist.',
  disclaimer: 'Submitting a request does not guarantee access. Availability and eligibility may vary.',
};

/**
 * PayFi is the product Remittix is built around, and it is in a private
 * beta: the page shows a transfer as it will work, and the one thing to do
 * is ask for access, which is where sending leads.
 */
export function PayFiPage() {
  const mode = theme.use();
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  const ask = () => {
    setAsking(true);
    document.querySelector('.pc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="dash pd pd-payfi" data-theme={mode}>
      <Sidebar active="payfi" />
      <main className="dash__main">
        <Topbar title="PayFi" />
        <ProductHero
          id="payfi-title"
          status="Beta access"
          title="Crypto in. Fiat out."
          body="Convert supported crypto into fiat and send funds directly to bank accounts through Remittix PayFi. Built for faster, simpler cross-border payments from one dashboard."
          slim
        >
          <Button onClick={ask}>Request beta access</Button>
          <p className="phero__note">Access is currently limited and requires approval.</p>
        </ProductHero>

        <PayFiCalc asking={asking} onAsk={setAsking} copy={BETA} />

        <section className="card orders" aria-labelledby="cor-title">
          <header className="card__head">
            <div>
              <h2 className="card__title" id="cor-title">Where PayFi pays out</h2>
              <p className="orders__sub">Corridors at beta, with the flat fee and how fast the bank sees it. Illustrative.</p>
            </div>
          </header>
          <div className="orders__scroll">
            <table className="orders__table cor">
              <thead>
                <tr>
                  <th scope="col">Destination</th>
                  <th scope="col">Currency</th>
                  <th scope="col">Flat fee</th>
                  <th scope="col">Arrives</th>
                  <th scope="col" className="is-right cor__rail">Rails</th>
                </tr>
              </thead>
              <tbody>
                {CORRIDORS.map((c) => (
                  <tr key={c.iso}>
                    <td><span className="orders__method"><img className="csel__flag" src={c.flag} alt="" width={20} height={15} />{c.country}</span></td>
                    <td className="num">{c.ccy}</td>
                    <td className="num">{c.fee.toFixed(2)} USDT</td>
                    <td>{c.eta}</td>
                    <td className="is-right cor__rail">{c.rail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pfeat" aria-label="How a PayFi transfer works">
          {STEPS.map((s, i) => (
            <article className="card pfeat__item" key={s.title}>
              <span className="pfeat__glyph pfeat__n num" aria-hidden="true">{i + 1}</span>
              <h3 className="pfeat__title"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
              <p className="pfeat__body">{s.body}</p>
            </article>
          ))}
        </section>
      </main>
      <MobileNav active="payfi" />
    </div>
  );
}
