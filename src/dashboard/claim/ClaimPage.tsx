import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
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
import { saveClaim, type Claim } from './store';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../settings/settings.css';
import '../products/products.css';
import './claim.css';

/**
 * Claim: three steps to put a wallet on the whitelist. Connect the wallet
 * the way the presale does, confirm how to reach you and which address to
 * whitelist, and it is queued. Every visit starts from the wallet step.
 */

const STEPS = ['Wallet', 'Details', 'Done'];
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Walks a list of messages on a timer, then calls back; the pace of a step's work. */
function useSequence(steps: string[] | null, ms: number, onDone: () => void) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!steps) { setI(0); return; }
    if (still()) { onDone(); return; }
    if (i >= steps.length - 1) {
      const t = window.setTimeout(onDone, ms);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setI((n) => n + 1), ms);
    return () => window.clearTimeout(t);
  }, [steps, i, ms, onDone]);
  return steps ? steps[Math.min(i, steps.length - 1)] : '';
}

const Spinner = () => <span className="cl-spin" aria-hidden="true" />;

/** A step's content, arriving from below. */
function Stage({ children, id }: { children: React.ReactNode; id: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || still()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [id]);
  return <div className="cl-stage" ref={ref}>{children}</div>;
}

function Stepper({ at }: { at: number }) {
  return (
    <ol className="cl-steps" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s} className="cl-step" aria-current={i === at ? 'step' : undefined} data-state={i < at ? 'done' : i === at ? 'now' : 'next'}>
          <span className="cl-step__n num"><span className="cl-step__num">{i + 1}</span><CheckIcon className="icon-16 cl-step__tick" /></span>
          <span className="cl-step__label">{s}</span>
          {i < STEPS.length - 1 && <span className="cl-rail" data-done={i < at || undefined} aria-hidden="true"><span className="cl-rail__fill" /></span>}
        </li>
      ))}
    </ol>
  );
}

/* ---------- 1. Wallet ---------- */
function WalletStep({ onConnected }: { onConnected: (p: Provider, address: string) => void }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const name = PROVIDERS.find((p) => p.id === busy)?.name ?? '';
  const [seq, setSeq] = useState<string[] | null>(null);
  useEffect(() => {
    setSeq(busy ? [`Opening ${name}…`, 'Waiting for your approval…', 'Reading the wallet…', 'Connected'] : null);
  }, [busy, name]);
  // No wallet bridge yet: the presale's connected wallet stands in once the sequence lands.
  const finish = useRef(() => {});
  finish.current = () => busy && onConnected(busy, WALLET.address);
  const message = useSequence(seq, 650, () => finish.current());
  const done = message === 'Connected';

  return (
    <div className="cl-body" data-busy={busy || undefined}>
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
            <button type="button" className="cl-wallet" onClick={() => setBusy(p.id)} disabled={busy !== null} aria-busy={busy === p.id || undefined} data-done={busy === p.id && done ? '' : undefined}>
              <span className="cl-wallet__mark"><WalletMark id={p.id} /></span>
              <span className="cl-wallet__what">
                <span className="cl-wallet__name">{p.name}</span>
                <span className="cl-wallet__kind">{busy === p.id ? <span className="cl-wallet__status" key={message}>{message}</span> : p.kind}</span>
              </span>
              <span className="cl-wallet__go">
                {busy === p.id ? null : 'Connect wallet'}
                <span className="chip-btn chip-btn--sm cl-wallet__chev">{busy === p.id ? (done ? <CheckIcon className="icon-16" /> : <Spinner />) : <ChevronRight className="icon-16" />}</span>
              </span>
              {busy === p.id && <span className="cl-wallet__bar" aria-hidden="true"><span className="cl-wallet__bar-fill" data-done={done || undefined} /></span>}
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
  const [pending, setPending] = useState<Claim | null>(null);
  const [seq, setSeq] = useState<string[] | null>(null);
  useEffect(() => { setSeq(pending ? ['Checking the address…', 'Queuing for whitelist…', 'Queued'] : null); }, [pending]);
  const finish = useRef(() => {});
  finish.current = () => pending && onDone(pending);
  const message = useSequence(seq, 600, () => finish.current());
  const [copiedA, copyA] = useCopy();
  const [copiedB, copyB] = useCopy();
  const name = PROVIDERS.find((p) => p.id === provider)!.name;
  const dial = COUNTRIES.find((c) => c.iso === code)!.dial;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 6) return setProblem(phone.trim() ? 'Enter a valid contact number.' : 'Enter a contact number.');
    if (!EMAIL.test(email.trim())) return setProblem('Enter a valid email address.');
    if (!/^0x[0-9a-fA-F]{40}$/.test(whitelist.trim())) return setProblem('Enter a valid Ethereum address to whitelist.');
    const c: Claim = { provider, wallet, whitelist: whitelist.trim(), email: email.trim().toLowerCase(), phone: `${dial} ${phone.trim()}`, at: new Date().toISOString() };
    if (!saveClaim(c)) return setProblem("We couldn't submit your request. Please try again.");
    setPending(c);
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
        <Button variant="ghost" onClick={onBack} disabled={pending !== null}>Back</Button>
        <Button type="submit" disabled={pending !== null}>{pending ? <><Spinner /> {message}</> : 'Submit for whitelist'}</Button>
        {problem && <span className="field__error set-error cl-error" role="alert">{problem}</span>}
      </div>
    </form>
  );
}

/* ---------- 3. Done ---------- */
function DoneStep({ claim }: { claim: Claim }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const r = root.current;
    if (!r || still()) return;
    // In a context, so a StrictMode re-run reverts the first run's inline
    // styles instead of recording opacity 0 as the values to animate to.
    const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(r.querySelectorAll('.cl-tile:not(.cl-tile--gap):not(.cl-tile--brand):not(.cl-tile--check):not(.cl-tile--word)'), { scale: 0.6, autoAlpha: 0, duration: 0.5, stagger: { each: 0.05, from: 'random' } })
      .from(r.querySelector('.cl-tile--brand'), { scale: 0.7, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.8)' }, 0.25)
      .from(r.querySelector('.cl-tile--check'), { scale: 0.5, autoAlpha: 0, duration: 0.5, ease: 'back.out(2.2)' }, 0.55)
      .fromTo(r.querySelector('.cl-tile__disc'), { scale: 0.4 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 0.65)
      .fromTo(r.querySelector('.cl-tile__ring'), { scale: 0.6, autoAlpha: 0.9 }, { scale: 2.4, autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 0.7)
      .from(r.querySelector('.cl-tile--word'), { y: 14, autoAlpha: 0, duration: 0.45 }, 0.85)
      .from(r.querySelectorAll('.cl-done__body, .cl-done__facts > div, .cl-actions'), { y: 12, autoAlpha: 0, duration: 0.45, stagger: 0.07 }, 1.0);
    }, r);
    return () => ctx.revert();
  }, []);
  return (
    <div className="cl-body cl-done" ref={root}>
      <div className="cl-tiles" aria-hidden="true">
        <span className="cl-tile" /><span className="cl-tile" /><span className="cl-tile cl-tile--gap" /><span className="cl-tile" />
        <span className="cl-tile cl-tile--gap" /><span className="cl-tile" />
        <span className="cl-tile cl-tile--brand"><RtxMark className="icon-22" />Remittix</span>
        <span className="cl-tile cl-tile--check"><span className="cl-tile__ring" /><span className="cl-tile__disc"><CheckIcon className="icon-16" /></span></span>
        <span className="cl-tile cl-tile--gap" /><span className="cl-tile" />
        <span className="cl-tile cl-tile--word">Submitted</span>
        <span className="cl-tile" />
      </div>
      <p className="cl-done__body" role="status">Your $RTX claim request has been received. <span className="num">{short(claim.whitelist)}</span> is queued for whitelist processing. We'll email {claim.email} when it clears.</p>
      <dl className="cl-done__facts">
        <div><dt>Whitelisted address</dt><dd className="num">{short(claim.whitelist)}</dd></div>
        <div><dt>Connected via</dt><dd className="cl-done__via"><WalletMark id={claim.provider} className="icon-20" />{PROVIDERS.find((p) => p.id === claim.provider)?.name}</dd></div>
        <div><dt>Submitted</dt><dd className="num">{fmt(claim.at)}</dd></div>
      </dl>
      <div className="cl-actions cl-actions--center">
        <Button onClick={() => window.location.assign('/dashboard')}>Back to home</Button>
      </div>
    </div>
  );
}

export function ClaimPage() {
  const mode = theme.use();
  // Every visit starts at the wallet step, so the whole flow can be walked
  // again on a refresh; the filed request is still kept for the record.
  const [claim, setClaim] = useState<Claim | null>(null);
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [wallet, setWallet] = useState('');
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  /** The step on stage leaves upward before the next arrives. */
  const go = (next: number, then?: () => void) => {
    const el = stage.current?.querySelector('.cl-stage');
    if (!el || still()) { then?.(); setStep(next); return; }
    gsap.to(el, { autoAlpha: 0, y: -12, duration: 0.25, ease: 'power2.in', onComplete: () => { then?.(); setStep(next); } });
  };

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
          <div ref={stage}>
            {step === 0 && <Stage id={0}><WalletStep onConnected={(p, a) => go(1, () => { setProvider(p); setWallet(a); })} /></Stage>}
            {step === 1 && provider && <Stage id={1}><DetailsStep provider={provider} wallet={wallet} onBack={() => go(0)} onDone={(c) => go(2, () => setClaim(c))} /></Stage>}
            {step === 2 && claim && <Stage id={2}><DoneStep claim={claim} /></Stage>}
          </div>
        </section>
      </main>
      <MobileNav active="claim" />
    </div>
  );
}
