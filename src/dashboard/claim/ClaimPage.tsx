import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { theme } from '../theme';
import { WALLET } from '../data';
import { useCopy } from '../useCopy';
import { CheckIcon, ChevronRight, CopyIcon, RtxMark } from '../icons';
import { TextField } from '../settings/fields';
import { CodeSelect, COUNTRIES, type Iso } from '../settings/CodeSelect';
import { EMAIL } from '../products/requests';
import { PROVIDERS, WalletMark, type Provider } from './wallets';
import { clearClaim, loadClaim, saveClaim, type Claim } from './store';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../settings/settings.css';
import '../products/products.css';
import './claim.css';

/**
 * Claim: three steps to put a wallet on the whitelist. Connect the wallet
 * the way the presale does, confirm how to reach you and which address to
 * whitelist, and it is queued. A filed request opens on the done step.
 */

const STEPS = ['Wallet', 'Details', 'Done'];
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function Stepper({ at }: { at: number }) {
  return (
    <ol className="cl-steps" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s} className="cl-step" aria-current={i === at ? 'step' : undefined} data-state={i < at ? 'done' : i === at ? 'now' : 'next'}>
          <span className="cl-step__n num">{i < at ? <CheckIcon className="icon-16" /> : i + 1}</span>
          <span className="cl-step__label">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- 1. Wallet ---------- */
function WalletStep({ onConnected }: { onConnected: (p: Provider, address: string) => void }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  useEffect(() => {
    if (!busy) return;
    // No wallet bridge yet: the presale's connected wallet stands in after a beat.
    const t = window.setTimeout(() => onConnected(busy, WALLET.address), 900);
    return () => window.clearTimeout(t);
  }, [busy, onConnected]);

  return (
    <div className="cl-body">
      <div className="ref-dest">
        <span className="ref-dest__mark"><RtxMark className="icon-22" /></span>
        <span className="ref-dest__what">
          <span className="ref-dest__addr">Connect the wallet you bought with</span>
          <span className="ref-dest__net">The same connection as the presale and payment flow. Nothing is signed or moved.</span>
        </span>
      </div>
      <ul className="cl-wallets" aria-label="Wallets">
        {PROVIDERS.map((p) => (
          <li key={p.id}>
            <button type="button" className="cl-wallet" onClick={() => setBusy(p.id)} disabled={busy !== null} aria-busy={busy === p.id || undefined}>
              <span className="cl-wallet__mark"><WalletMark id={p.id} /></span>
              <span className="cl-wallet__what">
                <span className="cl-wallet__name">{p.name}</span>
                <span className="cl-wallet__kind">{p.kind}</span>
              </span>
              <span className="cl-wallet__go">
                {busy === p.id ? 'Connecting…' : 'Connect wallet'}
                <span className="chip-btn chip-btn--sm cl-wallet__chev"><ChevronRight className="icon-16" /></span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="pnote cl-consent">By continuing you confirm you own the connected wallet and agree to submit it for whitelist review.</p>
    </div>
  );
}

/* ---------- 2. Details ---------- */
function DetailsStep({ provider, wallet, onBack, onDone }: { provider: Provider; wallet: string; onBack: () => void; onDone: (c: Claim) => void }) {
  const [code, setCode] = useState<Iso>('GB');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(() => { try { return localStorage.getItem('rtx-session') ?? ''; } catch { return ''; } });
  const [whitelist, setWhitelist] = useState(wallet);
  const [problem, setProblem] = useState<string | null>(null);
  const [copiedA, copyA] = useCopy();
  const [copiedB, copyB] = useCopy();
  const name = PROVIDERS.find((p) => p.id === provider)!.name;
  const dial = COUNTRIES.find((c) => c.iso === code)!.dial;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 6) return setProblem('Enter a contact number.');
    if (!EMAIL.test(email.trim())) return setProblem('Enter a valid email address.');
    if (!/^0x[0-9a-fA-F]{40}$/.test(whitelist.trim())) return setProblem('Enter a valid Ethereum address to whitelist.');
    const c: Claim = { provider, wallet, whitelist: whitelist.trim(), email: email.trim().toLowerCase(), phone: `${dial} ${phone.trim()}`, at: new Date().toISOString() };
    if (!saveClaim(c)) return setProblem("We couldn't submit your request. Please try again.");
    onDone(c);
  };

  return (
    <form className="cl-body" onSubmit={submit} noValidate>
      <div className="ref-dest">
        <span className="ref-dest__mark"><WalletMark id={provider} /></span>
        <span className="ref-dest__what">
          <span className="ref-dest__net">Connected wallet via {name}</span>
          <span className="ref-dest__addr num" title={wallet}>{short(wallet)}</span>
        </span>
        <span className="ref-dest__act">
          <button type="button" className="chip-btn" onClick={() => copyA(wallet)} aria-label="Copy connected address">
            {copiedA ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
          </button>
        </span>
      </div>

      <div className="set-grid cl-grid">
        <TextField id="cl-phone" label="Contact number" value={phone} onChange={(v) => { setPhone(v.replace(/[^\d\s()-]/g, '')); setProblem(null); }} type="tel" placeholder="Number" autoComplete="tel-national">
          <CodeSelect value={code} onChange={setCode} />
          <span className="set-sep" aria-hidden="true" />
        </TextField>
        <TextField id="cl-email" label="Email address" value={email} onChange={(v) => { setEmail(v); setProblem(null); }} type="email" placeholder="name@email.com" autoComplete="email" />
        <div className="cl-grid__wide">
          <TextField id="cl-whitelist" label="Wallet address to whitelist" value={whitelist} onChange={(v) => { setWhitelist(v); setProblem(null); }} placeholder="0x…" autoComplete="off">
            <button type="button" className="chip-btn chip-btn--field set-copy" onClick={() => copyB(whitelist)} aria-label="Copy address to whitelist">
              {copiedB ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
            </button>
          </TextField>
        </div>
      </div>

      <p className="ref-warn">
        <span className="ref-warn__glyph">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4.5 20.5 19h-17L12 4.5Z" /><path d="M12 10v4.2M12 16.8v.2" /></svg>
        </span>
        <span>This is the exact address that will be whitelisted. <b>A wrong address cannot be claimed against and creates a support case.</b></span>
      </p>

      <div className="cl-actions">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button type="submit">Submit for whitelist</Button>
        {problem && <span className="field__error set-error cl-error" role="alert">{problem}</span>}
      </div>
    </form>
  );
}

/* ---------- 3. Done ---------- */
function DoneStep({ claim, onReset }: { claim: Claim; onReset: () => void }) {
  return (
    <div className="cl-body cl-done">
      <div className="cl-tiles" aria-hidden="true">
        <span className="cl-tile" /><span className="cl-tile" /><span className="cl-tile cl-tile--gap" /><span className="cl-tile" />
        <span className="cl-tile cl-tile--gap" /><span className="cl-tile" />
        <span className="cl-tile cl-tile--brand"><RtxMark className="icon-22" />Remittix</span>
        <span className="cl-tile cl-tile--check"><span className="cl-tile__disc"><CheckIcon className="icon-16" /></span></span>
        <span className="cl-tile cl-tile--gap" /><span className="cl-tile" />
        <span className="cl-tile cl-tile--word">Submitted</span>
        <span className="cl-tile" />
      </div>
      <p className="cl-done__body" role="status">Your $RTX claim request has been received. <span className="num">{short(claim.whitelist)}</span> is queued for whitelist processing. We'll email {claim.email} when it clears.</p>
      <dl className="cl-done__facts">
        <div><dt>Whitelisted address</dt><dd className="num">{short(claim.whitelist)}</dd></div>
        <div><dt>Connected via</dt><dd>{PROVIDERS.find((p) => p.id === claim.provider)?.name}</dd></div>
        <div><dt>Submitted</dt><dd className="num">{fmt(claim.at)}</dd></div>
      </dl>
      <div className="cl-actions cl-actions--center">
        <Button onClick={() => window.location.assign('/dashboard')}>Back to home</Button>
        <button type="button" className="tlink cl-reset" onClick={onReset}>Submit a different address</button>
      </div>
    </div>
  );
}

export function ClaimPage() {
  const mode = theme.use();
  const [claim, setClaim] = useState<Claim | null>(() => loadClaim());
  const [step, setStep] = useState(() => (loadClaim() ? 2 : 0));
  const [provider, setProvider] = useState<Provider | null>(null);
  const [wallet, setWallet] = useState('');
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash pd pd-claim" data-theme={mode}>
      <Sidebar active="claim" />
      <main className="dash__main">
        <Topbar title="Claim" />
        <section className="card cl" aria-labelledby="cl-title">
          <header className="cl__head">
            <p className="pstat">$RTX claim whitelist</p>
            <h2 className="phero__title cl__title" id="cl-title">Get your wallet on the claim list</h2>
            <p className="phero__body">Connect your wallet, confirm your contact details, and submit the wallet address that should be whitelisted. Claiming opens at listing.</p>
          </header>
          <Stepper at={step} />
          {step === 0 && <WalletStep onConnected={(p, a) => { setProvider(p); setWallet(a); setStep(1); }} />}
          {step === 1 && provider && <DetailsStep provider={provider} wallet={wallet} onBack={() => setStep(0)} onDone={(c) => { setClaim(c); setStep(2); }} />}
          {step === 2 && claim && <DoneStep claim={claim} onReset={() => { clearClaim(); setClaim(null); setProvider(null); setStep(0); }} />}
        </section>
      </main>
      <MobileNav active="claim" />
    </div>
  );
}
