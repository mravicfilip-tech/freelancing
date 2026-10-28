import { useCallback, useEffect, useId, useRef, useState } from 'react';
import './TesterSignup.css';

/**
 * The RTX Earn beta sign-up: an email and the ERC-20 wallet the tester will use.
 *
 * It opens on the `#earn-testers` hash rather than from a click handler, so the hero slide's button
 * is a plain link and the same link works from anywhere — a post, an email, a QR code — and lands
 * on the page with the form already open. Closing it takes the hash back off.
 *
 * Submissions are POSTed as JSON to `VITE_EARN_TESTERS_ENDPOINT`, set at build time. The page has no
 * backend of its own, so that endpoint is wherever the team keeps sign-ups; anything that accepts a
 * JSON POST and answers 2xx works, Formspree's endpoints included. Without it the form says it could
 * not send rather than pretending it did — a sign-up that quietly goes nowhere is the one outcome
 * worse than no form.
 */

export const TESTERS_HASH = '#earn-testers';
const ENDPOINT = import.meta.env.VITE_EARN_TESTERS_ENDPOINT;

type Field = 'email' | 'wallet';
type Errors = Partial<Record<Field, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** A pasted address without its prefix is still the address; anything else is left as typed. */
const normaliseWallet = (raw: string) => {
  const v = raw.trim();
  return /^[0-9a-fA-F]{40}$/.test(v) ? `0x${v}` : v;
};

function validate(email: string, wallet: string): Errors {
  const errors: Errors = {};
  const e = email.trim();
  if (!e) errors.email = 'Enter your email address.';
  else if (!EMAIL.test(e)) errors.email = 'That doesn’t look like an email address.';
  const w = normaliseWallet(wallet);
  if (!w) errors.wallet = 'Enter the wallet address you’ll test with.';
  else if (/\.eth$/i.test(w)) errors.wallet = 'Paste the 0x address itself — ENS names can’t be used here.';
  else if (!ADDRESS.test(w)) errors.wallet = 'An ERC-20 address is 0x followed by 40 characters, 0–9 and a–f.';
  return errors;
}

async function send(email: string, wallet: string) {
  if (!ENDPOINT) throw new Error('VITE_EARN_TESTERS_ENDPOINT is not set, so there is nowhere to send sign-ups.');
  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 15_000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, wallet, source: 'remittix-site/hero' }),
      signal: abort.signal,
    });
    if (!res.ok) throw new Error(`Sign-up endpoint answered ${res.status}`);
  } finally {
    window.clearTimeout(timer);
  }
}

export function TesterSignup() {
  const dialog = useRef<HTMLDialogElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const walletInput = useRef<HTMLInputElement>(null);
  /** Where the press that ended on the backdrop began — a drag out of a field is not a dismissal. */
  const pressedOutside = useRef(false);
  /** The page's own overflow and padding, held while the dialog locks them. */
  const locked = useRef<{ overflow: string; pad: string } | null>(null);
  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [state, setState] = useState<'form' | 'sending' | 'done'>('form');
  const [failure, setFailure] = useState('');
  const ids = useId();

  const open = useCallback(() => {
    const el = dialog.current;
    if (!el || el.open) return;
    el.showModal();
    // Hold the page still behind the dialog, and its width with it — the same lock the phone menu uses.
    const { body } = document;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    locked.current = { overflow: body.style.overflow, pad: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;
    (state === 'done' ? el.querySelector<HTMLElement>('.ts__doneBtn') : emailInput.current)?.focus();
  }, [state]);

  /** Close with the exit beat; `close` itself fires after it, and the cleanup runs on that. */
  const requestClose = useCallback(() => {
    const el = dialog.current;
    if (!el?.open || el.dataset.closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.close();
      return;
    }
    el.dataset.closing = 'true';
    window.setTimeout(() => {
      delete el.dataset.closing;
      el.close();
    }, 160);
  }, []);

  const onClosed = () => {
    if (locked.current) {
      document.body.style.overflow = locked.current.overflow;
      document.body.style.paddingRight = locked.current.pad;
      locked.current = null;
    }
    if (window.location.hash === TESTERS_HASH) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // A finished sign-up is not reopened on its own confirmation; anything half-typed is kept.
    if (state === 'done') {
      setEmail('');
      setWallet('');
      setTouched({});
      setErrors({});
      setState('form');
    }
  };

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === TESTERS_HASH) open();
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [open]);

  const blur = (field: Field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(email, wallet));
  };
  const change = (field: Field, value: string) => {
    if (field === 'email') setEmail(value);
    else setWallet(value);
    setFailure('');
    // Once a field has been left wrong, it says when it is right again as the reader fixes it.
    if (touched[field]) setErrors(validate(field === 'email' ? value : email, field === 'wallet' ? value : wallet));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === 'sending') return;
    const found = validate(email, wallet);
    setErrors(found);
    setTouched({ email: true, wallet: true });
    if (found.email) return emailInput.current?.focus();
    if (found.wallet) return walletInput.current?.focus();
    // The field no person can see. Anything that fills it is a script; it is told it succeeded.
    const trap = new FormData(e.currentTarget).get('company');
    const cleanWallet = normaliseWallet(wallet);
    setWallet(cleanWallet);
    setState('sending');
    setFailure('');
    try {
      if (!trap) await send(email.trim(), cleanWallet);
      setState('done');
      window.setTimeout(() => dialog.current?.querySelector<HTMLElement>('.ts__doneBtn')?.focus(), 0);
    } catch (err) {
      console.error(err);
      setState('form');
      setFailure(
        import.meta.env.DEV && !ENDPOINT
          ? 'Not connected: set VITE_EARN_TESTERS_ENDPOINT to the sign-up endpoint and rebuild.'
          : 'We couldn’t send your sign-up just now. Please try again in a moment.',
      );
    }
  };

  const shown = (field: Field) => (touched[field] ? errors[field] : undefined);

  return (
    <dialog
      ref={dialog}
      className="ts"
      aria-labelledby={`${ids}-title`}
      onClose={onClosed}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onPointerDown={(e) => {
        pressedOutside.current = e.target === dialog.current;
      }}
      onClick={(e) => {
        // The dialog box is the panel, so a click whose target is the dialog itself landed on the
        // backdrop around it.
        if (e.target === dialog.current && pressedOutside.current) requestClose();
      }}
    >
      <div className="ts__panel">
        <button type="button" className="ts__close" aria-label="Close" onClick={requestClose}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>

        {state === 'done' ? (
          <div className="ts__done" role="status">
            <span className="ts__doneMark" aria-hidden="true">
              <svg viewBox="0 0 14 14" width="22" height="22">
                <path d="M14 3.57088L5.8688 11.7021C5.52708 12.0438 4.97306 12.0438 4.63135 11.7021L0 7.07075L1.23744 5.83332L5.25006 9.84596L12.7626 2.33345L14 3.57088Z" />
              </svg>
            </span>
            <h2 id={`${ids}-title`} className="ts__title">
              <span className="ts__titleMuted">You&rsquo;re on</span> the list.
            </h2>
            <p className="ts__lede">
              We&rsquo;ll email <strong>{email.trim()}</strong> when your spot on the RTX Earn beta is ready.
            </p>
            <button type="button" className="fh__btn fh__btn--primary ts__submit ts__doneBtn" onClick={requestClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="ts__form" noValidate onSubmit={submit}>
            <span className="ts__badge">
              RTX Earn <span className="ts__beta">Beta</span>
            </span>
            <h2 id={`${ids}-title`} className="ts__title">
              <span className="ts__titleMuted">Become a</span> tester.
            </h2>
            <p className="ts__lede">
              Leave your email and the ERC-20 wallet you&rsquo;ll test with, and we&rsquo;ll be in touch when your
              spot is ready.
            </p>

            <div className="ts__field" data-invalid={!!shown('email') || undefined}>
              <label htmlFor={`${ids}-email`}>Email address</label>
              <input
                ref={emailInput}
                id={`${ids}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => change('email', e.target.value)}
                onBlur={() => blur('email')}
                aria-invalid={!!shown('email')}
                aria-describedby={shown('email') ? `${ids}-email-error` : undefined}
              />
              {shown('email') && (
                <p className="ts__error" id={`${ids}-email-error`}>
                  {shown('email')}
                </p>
              )}
            </div>

            <div className="ts__field" data-invalid={!!shown('wallet') || undefined}>
              <label htmlFor={`${ids}-wallet`}>ERC-20 wallet address</label>
              <input
                ref={walletInput}
                id={`${ids}-wallet`}
                className="ts__address"
                name="wallet"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="0x…"
                maxLength={64}
                value={wallet}
                onChange={(e) => change('wallet', e.target.value)}
                onBlur={() => blur('wallet')}
                aria-invalid={!!shown('wallet')}
                aria-describedby={`${ids}-wallet-hint${shown('wallet') ? ` ${ids}-wallet-error` : ''}`}
              />
              {shown('wallet') ? (
                <p className="ts__error" id={`${ids}-wallet-error`}>
                  {shown('wallet')}
                </p>
              ) : null}
              <p className="ts__hint" id={`${ids}-wallet-hint`}>
                Your public address on Ethereum, starting 0x. We only ever need this &mdash; never share a seed
                phrase or private key.
              </p>
            </div>

            {/* Out of sight and out of the tab order; only a script fills it in. */}
            <input className="ts__trap" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            {failure && (
              <p className="ts__failure" role="alert">
                {failure}
              </p>
            )}

            <button type="submit" className="fh__btn fh__btn--primary ts__submit" disabled={state === 'sending'} aria-busy={state === 'sending'}>
              {state === 'sending' ? 'Signing you up…' : 'Sign Up'}
              {state !== 'sending' && (
                <img className="fh__chevron fh__chevron--right" src="/figma/chevron.svg" alt="" width={11} height={6} />
              )}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
