import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { Switch } from '../Switch';
import { theme } from '../theme';
import { USER, WALLET } from '../data';
import { CheckIcon, CopyIcon } from '../icons';
import { Saved, useSaved } from './saved';
import { useCopy } from '../useCopy';
import { PasswordField, TextField, goToField } from './fields';
import { EMAIL } from '../products/requests';
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
  const [profileBad, setProfileBad] = useState<{ id: string; msg: string } | null>(null);
  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const fail = (id: string, msg: string) => { setProfileBad({ id, msg }); goToField(id); };
    if (!name.trim()) return fail('set-name', 'Enter your name.');
    if (!EMAIL.test(email.trim())) return fail('set-email', 'Enter a valid email address.');
    if (phone.trim() && phone.replace(/\D/g, '').length < 6) return fail('set-phone', 'Enter a valid phone number, or leave it empty.');
    setProfileBad(null);
    saveProfile();
  };

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passSaved, savePass] = useSaved();
  const [passBad, setPassBad] = useState<{ id: string; msg: string } | null>(null);
  const submitPass = (e: React.FormEvent) => {
    e.preventDefault();
    const fail = (id: string, msg: string) => { setPassBad({ id, msg }); goToField(id); };
    if (!current) return fail('set-current', 'Enter your current password.');
    if (next.length < 8) return fail('set-next', 'A new password is at least eight characters.');
    if (next !== confirm) return fail('set-confirm', 'The two passwords differ.');
    setPassBad(null);
    savePass();
    setCurrent(''); setNext(''); setConfirm('');
  };

  const [twoFactor, setTwoFactor] = useState(false);

  const [wallet, setWallet] = useState<string>(WALLET.address);
  const [walletSaved, saveWallet] = useSaved();
  const [copied, copy] = useCopy();
  const [walletBad, setWalletBad] = useState<string | null>(null);
  const submitWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet.trim())) { setWalletBad(wallet.trim() ? 'That is not an Ethereum address.' : 'Enter your Ethereum address.'); goToField('set-wallet-address'); return; }
    setWalletBad(null);
    saveWallet();
  };

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
          <form className="set-grid set-grid--3" onSubmit={submitProfile} noValidate>
            <TextField id="set-name" label="Full name" value={name} onChange={(v) => { setName(v); setProfileBad(null); }} placeholder="Your name" autoComplete="name" invalid={profileBad?.id === 'set-name'} />
            <TextField id="set-email" label="Email" value={email} onChange={(v) => { setEmail(v); setProfileBad(null); }} type="email" placeholder="you@example.com" autoComplete="email" invalid={profileBad?.id === 'set-email'} />
            <TextField id="set-phone" label="Phone" value={phone} onChange={(v) => { setPhone(v); setProfileBad(null); }} type="tel" placeholder="Number" autoComplete="tel-national" invalid={profileBad?.id === 'set-phone'}>
              <CodeSelect value={code} onChange={setCode} />
              <span className="set-sep" aria-hidden="true" />
            </TextField>
            {profileBad && <span className="set-error set-error--row" role="alert">{profileBad.msg}</span>}
            <div className="set-actions">
              <Button type="submit">Save profile</Button>
              {!profileBad && <Saved on={profileSaved}>Profile saved</Saved>}
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
          <form className="set-grid set-grid--3" onSubmit={submitPass} noValidate>
            <PasswordField id="set-current" label="Current password" value={current} onChange={(v) => { setCurrent(v); setPassBad(null); }} autoComplete="current-password" invalid={passBad?.id === 'set-current'} />
            <PasswordField id="set-next" label="New password" value={next} onChange={(v) => { setNext(v); setPassBad(null); }} autoComplete="new-password" invalid={passBad?.id === 'set-next'} />
            <PasswordField id="set-confirm" label="Confirm new password" value={confirm} onChange={(v) => { setConfirm(v); setPassBad(null); }} autoComplete="new-password" invalid={passBad?.id === 'set-confirm'} />
            {passBad && <span className="set-error set-error--row" role="alert">{passBad.msg}</span>}
            <div className="set-actions">
              <Button type="submit">Update password</Button>
              {!passBad && <Saved on={passSaved}>Password updated</Saved>}
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
            <form className="set-grid" onSubmit={submitWallet} noValidate>
              <TextField id="set-wallet-address" label="Ethereum address" value={wallet} onChange={(v) => { setWallet(v); setWalletBad(null); }} placeholder="0x…" autoComplete="off" invalid={walletBad !== null}>
                <button type="button" className="chip-btn chip-btn--field set-copy" onClick={() => copy(wallet)} aria-label="Copy address">
                  {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
                </button>
              </TextField>
              {walletBad && <span className="set-error set-error--row" role="alert">{walletBad}</span>}
              <div className="set-actions">
                <Button type="submit" variant="ghost">Save wallet</Button>
                {!walletBad && <Saved on={walletSaved}>Wallet saved</Saved>}
              </div>
            </form>
          </section>
        </div>
      </main>
      <MobileNav active="settings" />
    </div>
  );
}
