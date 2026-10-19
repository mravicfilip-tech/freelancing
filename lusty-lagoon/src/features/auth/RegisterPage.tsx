import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Field } from '../../components/ui/Field';
import { PasswordField } from '../../components/ui/PasswordField';
import { Stepper } from '../../components/ui/Stepper';
import { AuthHeading, AuthLayout } from './AuthLayout';
import {
  SIGN_IN_DELAY,
  TAKEN_EMAIL,
  TAKEN_MESSAGE,
  agentCodeError,
  confirmError,
  emailError,
  newPasswordError,
  usernameError,
  wait,
} from './data';

const STEPS = ['Your details', 'Password'];
const TERMS_ERROR = 'Confirm you are 18 or older and agree to the terms, then create your account.';

const linkClass = 'inline-block rounded py-1 font-semibold text-accent underline underline-offset-4 hover:text-ink';
const legalLink = 'rounded text-accent underline underline-offset-2 hover:text-ink';

export function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const forced = params.get('state');
  const startOnTwo = params.get('step') === '2' || forced === 'loading';
  const seeded = startOnTwo || forced === 'taken';

  const [step, setStep] = useState(startOnTwo ? 1 : 0);
  const [username, setUsername] = useState(seeded ? 'mia_torres' : '');
  const [email, setEmail] = useState(forced === 'taken' ? TAKEN_EMAIL : seeded ? 'mia.torres@gmail.com' : '');
  const [agent, setAgent] = useState('');
  const [password, setPassword] = useState(forced === 'loading' ? 'lagoon2026' : '');
  const [confirm, setConfirm] = useState(forced === 'loading' ? 'lagoon2026' : '');
  const [agreed, setAgreed] = useState(forced === 'loading');
  const [taken, setTaken] = useState(forced === 'taken');
  const [loading, setLoading] = useState(forced === 'loading');
  const [touched, setTouched] = useState<Record<string, boolean>>(forced === 'taken' ? { email: true } : {});

  const formRef = useRef<HTMLFormElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Focus the step heading when the step changes, so keyboard and screen reader users land on the new content.
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    document.getElementById('step-title')?.focus();
  }, [step]);

  const errors = {
    username: usernameError(username),
    email: emailError(email) ?? (taken && email.trim().toLowerCase() === TAKEN_EMAIL ? TAKEN_MESSAGE : undefined),
    agent: agentCodeError(agent),
    password: newPasswordError(password),
    confirm: confirmError(password, confirm),
    terms: agreed ? undefined : TERMS_ERROR,
  };
  const stepOneBad = !!(errors.username || errors.email || errors.agent);
  const stepTwoBad = !!(errors.password || errors.confirm || errors.terms);

  const touch = (...names: string[]) => setTouched((t) => ({ ...t, ...Object.fromEntries(names.map((n) => [n, true])) }));
  const shown = (name: keyof typeof errors) => (touched[name] ? errors[name] : undefined);
  const focusFirstInvalid = () =>
    setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);

  function onEmail(value: string) {
    setEmail(value);
    setTaken(false);
  }

  // Step 1 checks the fields, then asks whether the email already has an account.
  function checkStepOne(): boolean {
    touch('username', 'email', 'agent');
    if (errors.username || emailError(email) || errors.agent) {
      focusFirstInvalid();
      return false;
    }
    if (email.trim().toLowerCase() === TAKEN_EMAIL) {
      setTaken(true);
      focusFirstInvalid();
      return false;
    }
    return true;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (step === 0) {
      if (checkStepOne()) setStep(1);
      return;
    }

    touch('password', 'confirm', 'terms');
    if (stepTwoBad) {
      focusFirstInvalid();
      return;
    }
    // A step 1 value that went bad, such as an email that is now taken, sends the player back to fix it.
    if (stepOneBad && !checkStepOne()) {
      setStep(0);
      return;
    }
    setLoading(true);
    await wait(SIGN_IN_DELAY);
    if (!alive.current) return;
    navigate('/lobby');
  }

  return (
    <AuthLayout art="register">
      <div className="flex flex-col gap-4">
        {step === 1 && (
          <Button type="button" variant="tertiary" size="sm" className="-ml-3 self-start" onClick={() => setStep(0)} disabled={loading}>
            <ArrowLeft weight="bold" className="h-4 w-4" aria-hidden />
            Back
          </Button>
        )}
        <Stepper steps={STEPS} current={step} />
      </div>

      {step === 0 ? (
        <AuthHeading title="Create your account" lead="Tell us who you are. Two short steps and you are in the lobby." />
      ) : (
        <AuthHeading title="Choose a password" lead="Last step. Then you can pick a game." />
      )}

      <form ref={formRef} noValidate onSubmit={submit} aria-labelledby="step-title" className="flex flex-col gap-6">
        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <Field
              label="Username"
              name="username"
              autoComplete="username"
              placeholder="Choose a username"
              value={username}
              error={shown('username')}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => username && touch('username')}
            />
            <Field
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              error={shown('email')}
              onChange={(e) => onEmail(e.target.value)}
              onBlur={() => email && touch('email')}
            />
            <Field
              label="Agent code, optional"
              name="agent"
              autoComplete="off"
              placeholder="Enter your agent code"
              hint="Only if an agent invited you. Leave it empty if not."
              value={agent}
              error={shown('agent')}
              onChange={(e) => setAgent(e.target.value)}
              onBlur={() => agent && touch('agent')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <PasswordField
              label="Password"
              name="new-password"
              autoComplete="new-password"
              placeholder="Choose a password"
              hint="At least 8 characters, with a letter and a number."
              value={password}
              disabled={loading}
              error={shown('password')}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => password && touch('password')}
            />
            <PasswordField
              label="Confirm password"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Type the password again"
              value={confirm}
              disabled={loading}
              error={shown('confirm')}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => confirm && touch('confirm')}
            />
            <Checkbox
              checked={agreed}
              disabled={loading}
              error={shown('terms')}
              onCheckedChange={(v) => {
                setAgreed(v === true);
                touch('terms');
              }}
              label={
                <>
                  I am 18 or older and I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className={legalLink}>
                    Terms of service
                  </a>{' '}
                  and the{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer" className={legalLink}>
                    Privacy policy
                  </a>
                  .
                </>
              }
            />
          </div>
        )}

        <Button type="submit" size="lg" block loading={loading}>
          {step === 0 ? 'Continue' : loading ? 'Creating account' : 'Create account'}
        </Button>

        <p className="text-center text-14 text-ink2">
          Already have an account?{' '}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
