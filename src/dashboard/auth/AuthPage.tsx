import { useEffect, useId, useState } from 'react';
import { Button } from '../Button';
import { PresaleScene } from './PresaleScene';
import { CheckIcon, EyeIcon, EyeOffIcon, MoonIcon, SunIcon } from '../icons';
import { theme } from '../theme';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './auth.css';

type Mode = 'signin' | 'register';

/** What the presale is actually offering, said once beside the form. */
const POINTS = [
  'Buy at the stage price before it steps up again',
  'Track your allocation and claim it the day $RTX lists',
  'Earn 15% in USDT on everything your referrals buy',
];

function Password({ id, label, value, onChange, autoComplete }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="auth__field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="field__control">
        <input
          id={id}
          className="auth__input"
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="chip-btn chip-btn--field"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
        >
          {shown ? <EyeOffIcon className="icon-20" /> : <EyeIcon className="icon-20" />}
        </button>
      </div>
    </div>
  );
}

export function AuthPage() {
  const mode = theme.use();
  const [tab, setTab] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = useId();
  const register = tab === 'register';

  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  /* No backend yet, so submit validates and says so rather than pretending to
     sign anyone in — a form that silently does nothing is worse than one that
     tells you where it stops. */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return setError('Enter an email address we can reach you at.');
    if (password.length < 8) return setError('Passwords are at least 8 characters.');
    if (register && !agreed) return setError('Please accept the terms to create an account.');
    setError(null);
  };

  const switchTo = (next: Mode) => {
    setTab(next);
    setError(null);
  };

  return (
    <div className="dash auth" data-theme={mode}>
      <main className="auth__form-side">
        <header className="auth__top">
          <a className="auth__brand" href="/" aria-label="Remittix home">
            <img src="/figma/logo.svg" alt="" width={33} height={17} />
            <span>Remittix</span>
          </a>
          <button
            type="button"
            className="chip-btn"
            onClick={() => theme.set(mode === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          >
            {mode === 'dark' ? <SunIcon className="icon-20" /> : <MoonIcon className="icon-20" />}
          </button>
        </header>

        <div className="auth__body">
          <h1 className="auth__title">
            {register ? 'Create your' : 'Sign in to your'}
            <em> Remittix account</em>
          </h1>
          <p className="auth__lede">
            {register
              ? 'One account for the presale, your allocation and your referrals.'
              : 'Pick up where you left off — your balance, stage price and claim.'}
          </p>

          {/* The dashboard's own segmented control, so the switch is a real
              control rather than a link buried under the button. */}
          <div className="tabs auth__tabs" role="tablist" aria-label="Account">
            {(['signin', 'register'] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`${ids}-${id}`}
                className="tabs__tab"
                aria-selected={tab === id}
                aria-controls={`${ids}-panel`}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => switchTo(id)}
              >
                {id === 'signin' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form
            className="auth__form"
            id={`${ids}-panel`}
            role="tabpanel"
            aria-labelledby={`${ids}-${tab}`}
            onSubmit={submit}
            noValidate
          >
            <div className="auth__field">
              <label className="field__label" htmlFor={`${ids}-email`}>Email</label>
              <div className="field__control">
                <input
                  id={`${ids}-email`}
                  className="auth__input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Password
              id={`${ids}-password`}
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete={register ? 'new-password' : 'current-password'}
            />

            {register ? (
              <label className="auth__check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="auth__box" aria-hidden="true"><CheckIcon className="icon-14" /></span>
                I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
              </label>
            ) : (
              <div className="auth__row">
                <label className="auth__check">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="auth__box" aria-hidden="true"><CheckIcon className="icon-14" /></span>
                  Remember me
                </label>
                <a className="auth__link" href="/reset">Forgot password?</a>
              </div>
            )}

            {error && <p className="field__error" role="alert">{error}</p>}

            <Button block type="submit">
              {register ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="auth__switch">
            {register ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" onClick={() => switchTo(register ? 'signin' : 'register')}>
              {register ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>

        <footer className="auth__foot">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms &amp; Conditions</a>
          <span>© 2026 Remittix</span>
        </footer>
      </main>

      <aside className="auth__scene-side">
        <div className="auth__pitch">
          <h2>Stage 12 is live at $0.18</h2>
          <ul>
            {POINTS.map((p) => (
              <li key={p}>
                <CheckIcon className="icon-16" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <PresaleScene />
      </aside>
    </div>
  );
}
