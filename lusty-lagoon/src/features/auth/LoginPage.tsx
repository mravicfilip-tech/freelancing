import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { Field } from '../../components/ui/Field';
import { PasswordField } from '../../components/ui/PasswordField';
import { AuthHeading, AuthLayout, FormAlert } from './AuthLayout';
import { SIGN_IN_DELAY, TAKEN_EMAIL, WRONG_PASSWORD, emailError, wait } from './data';

type Status = 'idle' | 'loading' | 'wrong';

const linkClass = 'inline-block rounded py-1 font-semibold text-accent underline underline-offset-4 hover:text-ink';

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const forced = params.get('state');

  // ?state=error and ?state=loading open with the typed values already in, so a shot shows a real case.
  const [email, setEmail] = useState(forced === 'error' || forced === 'loading' ? TAKEN_EMAIL : '');
  const [password, setPassword] = useState(forced === 'error' ? WRONG_PASSWORD : forced === 'loading' ? 'lagoon2026' : '');
  const [status, setStatus] = useState<Status>(forced === 'loading' ? 'loading' : forced === 'error' ? 'wrong' : 'idle');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const errors = {
    email: emailError(email),
    password: password ? undefined : 'Enter your password.',
  };
  const loading = status === 'loading';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setTouched({ email: true, password: true });
    setResetSentTo(null);
    if (errors.email || errors.password) {
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setStatus('loading');
    await wait(SIGN_IN_DELAY);
    if (!alive.current) return;
    if (password === WRONG_PASSWORD) {
      setStatus('wrong');
      passwordRef.current?.focus();
      return;
    }
    navigate('/lobby');
  }

  function forgot() {
    setTouched((t) => ({ ...t, email: true }));
    if (errors.email) {
      setResetSentTo(null);
      emailRef.current?.focus();
      return;
    }
    setStatus('idle');
    setResetSentTo(email.trim());
  }

  return (
    <AuthLayout art="login">
      <AuthHeading title="Log in to your account" lead="Welcome back, player. Pick up where you left off." />

      <form noValidate onSubmit={submit} aria-labelledby="step-title" className="flex flex-col gap-6">
        {status === 'wrong' && (
          <FormAlert title="That email and password do not match">
            Check both and try again. If you forgot the password, use Forgot password below to get a reset email.
          </FormAlert>
        )}

        <div className="flex flex-col gap-4">
          <Field
            ref={emailRef}
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            disabled={loading}
            error={touched.email ? errors.email : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setResetSentTo(null);
              if (status === 'wrong') setStatus('idle');
            }}
            onBlur={() => email && setTouched((t) => ({ ...t, email: true }))}
          />
          <div className="flex flex-col gap-1">
            <PasswordField
              ref={passwordRef}
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              disabled={loading}
              error={touched.password ? errors.password : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                if (status === 'wrong') setStatus('idle');
              }}
              onBlur={() => password && setTouched((t) => ({ ...t, password: true }))}
            />
            <div className="flex justify-end">
              <Button type="button" variant="tertiary" size="sm" className="-mr-3" onClick={forgot} disabled={loading}>
                Forgot password
              </Button>
            </div>
          </div>
        </div>

        <div aria-live="polite" className="empty:hidden">
          {resetSentTo && (
            <Callout>
              <p className="font-semibold text-ink">Reset email sent</p>
              <p>
                We sent a link to <span className="font-semibold text-ink">{resetSentTo}</span>. It can take a few minutes. Check your spam folder if it does not
                arrive.
              </p>
            </Callout>
          )}
        </div>

        <Button type="submit" size="lg" block loading={loading}>
          {loading ? 'Logging in' : 'Log in'}
        </Button>

        <p className="text-center text-14 text-ink2">
          New to Lusty Lagoon?{' '}
          <Link to="/register" className={linkClass}>
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
