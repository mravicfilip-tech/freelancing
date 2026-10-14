import { RadioGroup } from 'radix-ui';
import { useState, type FormEvent } from 'react';
import type { Content } from '../shared/content';
import { Bracket } from './Bracket';
import { sh, t } from './copy';

type Status = 'idle' | 'sending' | 'success' | 'error';
type Values = { name: string; company: string; email: string; phone: string; place: string; length: string; message: string; role: string };
const EMPTY: Values = { name: '', company: '', email: '', phone: '', place: '', length: '', message: '', role: '' };
const REQUIRED: (keyof Values)[] = ['name', 'email', 'phone', 'role'];

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className={`fld${error ? ' fld--bad' : ''}`}>
      <label htmlFor={id} className="mono fld__label">
        {label}
        {required && (
          <span className="fld__req" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mono fld__err">
          <span aria-hidden="true">! </span>
          {error}
        </p>
      )}
    </div>
  );
}

export function Contact({ c }: { c: Content }) {
  const x = t(c);
  const F = c.form;
  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>(() => (new URLSearchParams(window.location.search).get('form') === 'error' ? 'error' : 'idle'));

  const check = (vals: Values) => {
    const e: Partial<Record<keyof Values, string>> = {};
    REQUIRED.forEach((k) => {
      if (!vals[k].trim()) e[k] = F.required;
    });
    if (vals.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email.trim())) e.email = x.emailInvalid;
    return e;
  };
  const set = (k: keyof Values, val: string) => {
    const next = { ...v, [k]: val };
    setV(next);
    if (tried) setErrors(check(next));
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (status === 'sending') return;
    setTried(true);
    const e = check(v);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = (['role', 'name', 'email', 'phone'] as const).find((k) => e[k]) ?? 'email';
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setStatus('sending');
    window.setTimeout(() => setStatus(new URLSearchParams(window.location.search).get('form') === 'error' ? 'error' : 'success'), 800);
  };

  const txt = (k: keyof Values, label: string, opts: { type?: string; required?: boolean; ph?: string; auto?: string } = {}) => (
    <Field id={`f-${k}`} label={label} required={opts.required} error={errors[k]}>
      <input
        id={`f-${k}`}
        name={k}
        className="in"
        type={opts.type ?? 'text'}
        autoComplete={opts.auto}
        placeholder={opts.ph}
        value={v[k]}
        onChange={(e) => set(k, e.target.value)}
        required={opts.required}
        aria-required={opts.required}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `f-${k}-err` : undefined}
      />
    </Field>
  );

  return (
    <div className="conw">
      <section id="contact" className="con gc" aria-labelledby="con-title">
        <div className="con__left">
          <p className="mono kicker">{F.kicker}</p>
          <h2 id="con-title" className="con__title display">
            {sh(c, F.title)}
          </h2>
          <p className="con__lede mono-body">{F.lede}</p>

          {status === 'success' ? (
            <div className="done" role="status">
              <p className="mono kicker">{x.successTitle}</p>
              <p className="done__msg display">{F.success}</p>
            </div>
          ) : (
            <form className="form" onSubmit={submit} noValidate>
              <div className={`fld fld--role${errors.role ? ' fld--bad' : ''}`}>
                <p id="role-label" className="mono fld__label">
                  {F.roleLabel}
                  <span className="fld__req" aria-hidden="true">
                    {' '}
                    *
                  </span>
                </p>
                <RadioGroup.Root
                  className="roles"
                  name="role"
                  value={v.role}
                  onValueChange={(val) => set('role', val)}
                  aria-labelledby="role-label"
                  aria-required
                  aria-invalid={errors.role ? true : undefined}
                  aria-describedby={errors.role ? 'f-role-err' : undefined}
                >
                  {F.roles.map((r, i) => (
                    <RadioGroup.Item key={r} value={r} id={i === 0 ? 'f-role' : undefined} className="bk bk--tog">
                      <span className="bk__c bk__c--tl" aria-hidden="true" />
                      <span className="bk__c bk__c--tr" aria-hidden="true" />
                      <span className="bk__c bk__c--bl" aria-hidden="true" />
                      <span className="bk__c bk__c--br" aria-hidden="true" />
                      <span className="bk__l">
                        <span className="tog__box" aria-hidden="true" />
                        {r}
                      </span>
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
                {errors.role && (
                  <p id="f-role-err" className="mono fld__err">
                    <span aria-hidden="true">! </span>
                    {errors.role}
                  </p>
                )}
              </div>

              <div className="form__grid">
                {txt('name', F.fields.name, { required: true, auto: 'name' })}
                {txt('company', F.fields.company, { auto: 'organization' })}
                {txt('email', F.fields.email, { type: 'email', required: true, auto: 'email' })}
                {txt('phone', F.fields.phone, { type: 'tel', required: true, auto: 'tel' })}
                {txt('place', F.fields.place, { ph: F.placeholders.place })}
                {txt('length', F.fields.length, { ph: F.placeholders.length })}
                <Field id="f-message" label={F.fields.message}>
                  <textarea id="f-message" name="message" className="in in--area" rows={3} placeholder={F.placeholders.message} value={v.message} onChange={(e) => set('message', e.target.value)} />
                </Field>
              </div>

              {status === 'error' && (
                <p className="form__error mono" role="alert">
                  <span aria-hidden="true">! </span>
                  {F.error}
                </p>
              )}

              <div className="form__foot">
                <Bracket type="submit" variant="fill" disabled={status === 'sending'} aria-busy={status === 'sending'}>
                  {status === 'sending' ? F.sending : F.submit}
                </Bracket>
                <p className="mono form__reply">{F.reply}</p>
              </div>
              <p className="mono form__note">
                <span className="fld__req" aria-hidden="true">
                  *
                </span>{' '}
                {F.required}. {F.consent}
              </p>
            </form>
          )}
        </div>

        <aside className="call" aria-label={c.ui.call}>
          <p className="mono kicker">{c.ui.call}</p>
          <a className="call__num display" href={c.contact.phoneHref}>
            {c.contact.phone}
          </a>
          <ul className="call__rows">
            <li>
              <span className="mono call__k">{x.email}</span>
              <a className="call__v" href={`mailto:${c.contact.email}`}>
                {c.contact.email}
              </a>
            </li>
            <li>
              <span className="mono call__k">{c.contact.whatsapp}</span>
              <a className="call__v" href={c.contact.whatsappHref}>
                {c.contact.phone}
              </a>
            </li>
            <li>
              <span className="mono call__k">{x.hours}</span>
              <span className="call__v">{c.contact.hours}</span>
            </li>
          </ul>
          <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
        </aside>
      </section>
    </div>
  );
}
