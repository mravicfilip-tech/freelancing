import { useEffect, useId, useState } from 'react';
import { Button } from '../Button';
import { PRESALE } from '../data';
import { CheckIcon, EyeIcon, EyeOffIcon, MoonIcon, SunIcon } from '../icons';
import { theme } from '../theme';
import { AuthScene } from './AuthScene';
import { DEMO, register as registerAccount, signIn } from './session';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './auth.css';

type Mode = 'signin' | 'register';

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
  const [email, setEmail] = useState<string>(DEMO.email);
  const [password, setPassword] = useState<string>(DEMO.password);
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

  /* The demo account is filled in, so sign in checks against it and goes to
     the dashboard; register takes whatever is typed and does the same. */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return setError('Enter an email address we can reach you at.');
    if (password.length < 8) return setError('Passwords are at least 8 characters.');
    if (register && !agreed) return setError('Please accept the terms to create an account.');
    if (register) {
      registerAccount(email);
    } else {
      const problem = signIn(email, password);
      if (problem) return setError(problem);
    }
    setError(null);
    window.location.assign('/dashboard');
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
          <h1 className="auth__title">{register ? 'Create your account' : 'Sign in'}</h1>

          <form
            className="auth__form"
            id={`${ids}-panel`}
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
            <p className="auth__hint">Demo account: the email and password are filled in.</p>
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

      {/* The default thumbnail, at panel size and alive: the rings breathe and
          one ripple runs out from their centre; the dot grid fades from that
          corner. Same ink and lavender whatever the page theme. */}
      <aside className="auth__art" aria-hidden="true">
        <AuthScene />
        <div className="auth__copy">
          <p className="auth__headline">
            <span className="auth__lead">The Future of</span>
            Global Payments
          </p>
          <p className="auth__body-copy">
            Move money across borders with crypto-native infrastructure built for a faster, borderless
            financial world.
          </p>
        </div>
        <p className="topbar__live auth__live">
          <span className="topbar__dot" aria-hidden="true" />
          Stage {PRESALE.stage} is live
        </p>
      </aside>
    </div>
  );
}
