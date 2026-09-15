import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { Switch } from '../Switch';
import { theme } from '../theme';
import { USER, WALLET } from '../data';
import { CheckIcon, CopyIcon } from '../icons';
import { useCopy } from '../useCopy';
import { PasswordField, TextField } from './fields';
import { CodeSelect, type Iso } from './CodeSelect';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../auth/auth.css';
import './settings.css';

/**
 * Settings, on one page: who you are and how we reach you, your password,
 * two-factor sign-in, and the wallet your $RTX lands in. Each card saves
 * on its own, and says so for a moment.
 */

/** A "Saved" that shows for a couple of seconds after a card's button. */
function useSaved(): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2200);
    return () => window.clearTimeout(t);
  }, [saved]);
  return [saved, () => setSaved(true)];
}

function Saved({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className="set-saved" role="status" aria-live="polite">
      {on && <><CheckIcon className="icon-16" /> {children}</>}
    </span>
  );
}

export function SettingsPage() {
  const mode = theme.use();
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  const [name, setName] = useState<string>(USER.name);
  const [email, setEmail] = useState('filip@remittix.io');
  const [code, setCode] = useState<Iso>('US');
  const [phone, setPhone] = useState('');
  const [profileSaved, saveProfile] = useSaved();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passSaved, savePass] = useSaved();
  const mismatch = confirm.length > 0 && next !== confirm;
  const canUpdate = current.length > 0 && next.length >= 8 && next === confirm;

  const [twoFactor, setTwoFactor] = useState(false);

  const [wallet, setWallet] = useState<string>(WALLET.address);
  const [walletSaved, saveWallet] = useSaved();
  const [copied, copy] = useCopy();
  const validWallet = /^0x[0-9a-fA-F]{40}$/.test(wallet);

  return (
    <div className="dash settings" data-theme={mode}>
      <Sidebar active="settings" />
      <main className="dash__main">
        <Topbar title="Settings" />

        <section className="card set-card" aria-labelledby="set-profile">
          <header className="card__head">
            <div>
              <h2 className="card__title" id="set-profile">Profile</h2>
              <p className="orders__sub">How we address you and where we reach you</p>
            </div>
          </header>
          <form className="set-grid set-grid--3" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
            <TextField id="set-name" label="Full name" value={name} onChange={setName} placeholder="Your name" autoComplete="name" />
            <TextField id="set-email" label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" autoComplete="email" />
            <TextField id="set-phone" label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="Number" autoComplete="tel-national">
              <CodeSelect value={code} onChange={setCode} />
              <span className="set-sep" aria-hidden="true" />
            </TextField>
            <div className="set-actions">
              <Button type="submit">Save profile</Button>
              <Saved on={profileSaved}>Profile saved</Saved>
            </div>
          </form>
        </section>

        <section className="card set-card" aria-labelledby="set-password">
          <header className="card__head">
            <div>
              <h2 className="card__title" id="set-password">Password</h2>
              <p className="orders__sub">At least eight characters; you stay signed in here</p>
            </div>
          </header>
          <form className="set-grid set-grid--3" onSubmit={(e) => { e.preventDefault(); if (canUpdate) { savePass(); setCurrent(''); setNext(''); setConfirm(''); } }}>
            <PasswordField id="set-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
            <PasswordField id="set-next" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
            <PasswordField id="set-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            <div className="set-actions">
              <Button type="submit" disabled={!canUpdate}>Update password</Button>
              {mismatch ? <span className="field__error set-error">The two passwords differ</span> : <Saved on={passSaved}>Password updated</Saved>}
            </div>
          </form>
        </section>

        <div className="set-split">
          <section className="card set-card" aria-labelledby="set-2fa">
            <header className="card__head">
              <div>
                <h2 className="card__title" id="set-2fa">Two-factor sign-in</h2>
                <p className="orders__sub">A code from your authenticator app, on top of your password</p>
              </div>
            </header>
            <p className="set-body">
              {twoFactor
                ? 'Every sign-in now asks for the six-digit code from your authenticator app after your password. Turn it off here if you lose the device.'
                : 'Scan a QR code once with Google Authenticator, 1Password or any TOTP app, and every sign-in asks for its six-digit code after your password.'}
            </p>
            <div className="set-actions">
              <Switch id="set-2fa-switch" checked={twoFactor} onChange={setTwoFactor} label={twoFactor ? 'On' : 'Off'} />
            </div>
          </section>

          <section className="card set-card" aria-labelledby="set-wallet">
            <header className="card__head">
              <div>
                <h2 className="card__title" id="set-wallet">Receiving wallet</h2>
                <p className="orders__sub">Where your $RTX is sent at claim, on {WALLET.chain}</p>
              </div>
            </header>
            <form className="set-grid" onSubmit={(e) => { e.preventDefault(); if (validWallet) saveWallet(); }}>
              <TextField id="set-wallet-address" label="Ethereum address" value={wallet} onChange={setWallet} placeholder="0x…" autoComplete="off">
                <button type="button" className="chip-btn chip-btn--field set-copy" onClick={() => copy(wallet)} aria-label="Copy address">
                  {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
                </button>
              </TextField>
              <div className="set-actions">
                <Button type="submit" variant="ghost" disabled={!validWallet}>Save wallet</Button>
                {!validWallet ? <span className="field__error set-error">That is not an Ethereum address</span> : <Saved on={walletSaved}>Wallet saved</Saved>}
              </div>
            </form>
          </section>
        </div>
      </main>
      <MobileNav active="settings" />
    </div>
  );
}
