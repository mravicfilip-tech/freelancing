import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { theme } from '../theme';
import { CheckIcon } from '../icons';
import { TextField } from '../settings/fields';
import { ProductHero } from '../products/ProductHero';
import { existing, request, type Outcome } from './beta';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../settings/settings.css';
import '../products/products.css';

const STEPS = [
  { title: 'Set up the transfer', body: 'Choose the supported crypto you want to use and the fiat currency the recipient should receive.' },
  { title: 'Add bank details', body: 'Enter the recipient and bank information required for the payout.' },
  { title: 'Send and track', body: 'Confirm the transfer, send the crypto and follow the payment status from your dashboard.' },
];

const MESSAGE: Record<Exclude<Outcome, 'ok'>, string> = {
  invalid: 'Enter a valid email address.',
  exists: 'This email is already on the PayFi beta whitelist.',
  error: "We couldn't submit your request. Please try again.",
};

/** The whitelist form, and what replaces it once a request is on file. */
function BetaForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<Outcome | null>(null);
  const [done, setDone] = useState<string | null>(() => existing());

  if (done) {
    return (
      <div className="phero__panel">
        <h2 className="card__title">Request PayFi beta access</h2>
        <div className="pdone" role="status">
          <span className="set-saved__pill"><CheckIcon className="icon-16" />Request received</span>
          <p className="pdone__body">Your request has been received. We'll email you if your account is approved for PayFi beta access.</p>
          <p className="pnote">Sent for {done}</p>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out = request(email);
    setState(out);
    if (out === 'ok') setDone(email.trim().toLowerCase());
  };

  return (
    <form className="phero__panel" onSubmit={submit} noValidate>
      <div>
        <h2 className="card__title">Request PayFi beta access</h2>
        <p className="orders__sub">Join the whitelist and we will email you when your account is approved.</p>
      </div>
      <TextField id="payfi-email" label="Email address" value={email} onChange={(v) => { setEmail(v); if (state) setState(null); }} type="email" placeholder="you@example.com" autoComplete="email" />
      <div className="set-actions">
        <Button type="submit">Request beta access</Button>
        {state && state !== 'ok' && <span className="field__error set-error" role="alert">{MESSAGE[state]}</span>}
      </div>
      <p className="pnote">Submitting a request does not guarantee access. Availability and eligibility may vary.</p>
    </form>
  );
}

/**
 * PayFi is the product Remittix is built around, and it is in a private
 * beta: the page leads with the proposition and the one thing to do is ask
 * for access. The three steps under it are how a transfer will go.
 */
export function PayFiPage() {
  const mode = theme.use();
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

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
          aside={<BetaForm />}
          panel
        >
          <p className="phero__note">Access is currently limited and requires approval.</p>
        </ProductHero>

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
