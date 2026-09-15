import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../icons';

/** A labelled text field on the dashboard's field control, in the body face. */
export function TextField({ id, label, value, onChange, type = 'text', placeholder, autoComplete, children }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  /** Something to sit in the control beside the input: a prefix select, a copy chip. */
  children?: React.ReactNode;
}) {
  return (
    <div className="set-field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="field__control">
        {children}
        <input id={id} className="set-input" type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

/** The sign-in page's password field: the same control with a reveal chip inside it. */
export function PasswordField({ id, label, value, onChange, autoComplete }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="set-field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="field__control">
        <input id={id} className="set-input" type={shown ? 'text' : 'password'} autoComplete={autoComplete} placeholder="••••••••" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="chip-btn chip-btn--field" onClick={() => setShown((v) => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
          {shown ? <EyeOffIcon className="icon-20" /> : <EyeIcon className="icon-20" />}
        </button>
      </div>
    </div>
  );
}
