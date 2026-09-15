import { useState } from 'react';
import { Button } from '../Button';
import { CheckIcon } from '../icons';
import { TextField } from '../settings/fields';
import { existing, request, type Outcome } from './requests';

export type Copy = {
  title: string;
  body: string;
  cta: string;
  success: string;
  exists: string;
  disclaimer?: string;
};

/**
 * An email capture with the four states the brief names: invalid, already
 * on file, could not submit, and received. `inline` sets the field and the
 * button on one line for a hero; the panel form stacks them.
 */
export function RequestForm({ storageKey, copy, inline, id, autoFocus }: {
  storageKey: string;
  copy: Copy;
  inline?: boolean;
  id: string;
  autoFocus?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<Outcome | null>(null);
  const [done, setDone] = useState<string | null>(() => existing(storageKey));

  const message: Record<Exclude<Outcome, 'ok'>, string> = {
    invalid: 'Enter a valid email address.',
    exists: copy.exists,
    error: "We couldn't submit your request. Please try again.",
  };

  if (done) {
    return (
      <div className={`rq rq--done${inline ? ' rq--inline' : ''}`} role="status">
        {!inline && <h2 className="card__title">{copy.title}</h2>}
        <span className="set-saved__pill"><CheckIcon className="icon-16" />Received</span>
        <p className="rq__body">{copy.success}</p>
        <p className="pnote">Sent for {done}</p>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out = request(storageKey, email);
    setState(out);
    if (out === 'ok') setDone(email.trim().toLowerCase());
  };

  return (
    <form className={`rq${inline ? ' rq--inline' : ''}`} onSubmit={submit} noValidate>
      {!inline && (
        <div>
          <h2 className="card__title">{copy.title}</h2>
          <p className="orders__sub">{copy.body}</p>
        </div>
      )}
      <div className="rq__row">
        <TextField id={id} label="Email address" value={email} onChange={(v) => { setEmail(v); if (state) setState(null); }} type="email" placeholder="you@example.com" autoComplete="email" autoFocus={autoFocus} />
        <Button type="submit">{copy.cta}</Button>
      </div>
      {state && state !== 'ok' && <span className="field__error set-error" role="alert">{message[state]}</span>}
      {copy.disclaimer && <p className="pnote">{copy.disclaimer}</p>}
    </form>
  );
}
