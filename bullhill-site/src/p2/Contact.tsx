import { useRef, useState } from 'react';
import { RadioGroup } from 'radix-ui';
import type { Content } from '../shared/content';
import { Icon, Guides } from './icons';
import { pick } from './copy';

type Status = 'idle' | 'sending' | 'success' | 'error';
const REQUIRED = ['name', 'email', 'place'] as const;

export function Contact({ c }: { c: Content }) {
  const k = pick(c.lang).contact;
  const f = c.form;
  const forceError = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('form') === 'error';
  const [status, setStatus] = useState<Status>(forceError ? 'error' : 'idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState(f.roles[0]);
  const formRef = useRef<HTMLFormElement>(null);

  const clear = (name: string) => setErrors((e) => (e[name] ? { ...e, [name]: '' } : e));

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    for (const n of REQUIRED) if (!String(data.get(n) ?? '').trim()) next[n] = f.required;
    const mail = String(data.get('email') ?? '').trim();
    if (mail && !/^\S+@\S+\.\S+$/.test(mail)) next.email = k.emailInvalid;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus('sending');
    window.setTimeout(() => setStatus(forceError ? 'error' : 'success'), 800);
  };

  const field = (name: keyof typeof f.fields, opts: { type?: string; ph?: string; req?: boolean; auto?: string; wide?: boolean; area?: boolean }) => {
    const id = `p2-f-${name}`;
    const err = errors[name];
    const common = {
      id,
      name,
      placeholder: opts.ph,
      autoComplete: opts.auto,
      required: opts.req,
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `${id}-err` : undefined,
      onInput: () => clear(name),
    };
    return (
      <div className={`p2-field ${opts.wide ? 'is-wide' : ''} ${err ? 'has-err' : ''}`}>
        <label htmlFor={id} className="p2-mono">
          {f.fields[name]}
          {opts.req && <span className="p2-field__star" aria-hidden="true"> *</span>}
        </label>
        {opts.area ? <textarea rows={4} {...common} /> : <input type={opts.type ?? 'text'} {...common} />}
        {err && (
          <p className="p2-field__err" id={`${id}-err`}>
            <Icon name="close" size={16} />
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="p2-contact" id="contact">
      <div className="p2-contact__glow" aria-hidden="true" />
      <Guides />
      <div className="p2-wrap p2-contact__grid">
        <div className="p2-contact__intro">
          <p className="p2-mono p2-contact__kicker">{f.kicker}</p>
          <h2 className="p2-display p2-h2">{f.title}</h2>
          <p className="p2-contact__lede">{f.lede}</p>
          <a className="p2-contact__phone" href={c.contact.phoneHref}>{c.contact.phone}</a>
          <ul className="p2-contact__links">
            <li>
              <a href={`mailto:${c.contact.email}`}>
                <Icon name="mail" />
                {c.contact.email}
              </a>
            </li>
            <li>
              <a href={c.contact.whatsappHref}>
                <Icon name="chat" />
                {c.contact.whatsapp}
              </a>
            </li>
          </ul>
          <p className="p2-contact__hours p2-mono">{c.contact.hours}</p>
        </div>

        <div className="p2-formcard">
          {status === 'success' ? (
            <div className="p2-success" role="status">
              <span className="p2-success__icon" aria-hidden="true"><Icon name="check" size={20} /></span>
              <p>{f.success}</p>
              <button type="button" className="p2-btn p2-btn--outline" onClick={() => setStatus('idle')}>{k.again}</button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate aria-label={k.formLabel}>
              {status === 'error' && (
                <p className="p2-banner" role="alert">
                  <Icon name="close" size={20} />
                  {f.error}
                </p>
              )}
              <div className="p2-role">
                <p className="p2-mono" id="p2-role-label">{f.roleLabel}</p>
                <RadioGroup.Root className="p2-role__group" value={role} onValueChange={setRole} aria-labelledby="p2-role-label" name="role">
                  {f.roles.map((r) => (
                    <RadioGroup.Item key={r} value={r} className="p2-role__chip" id={`p2-role-${r}`}>
                      {r}
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
              </div>
              <div className="p2-fields">
                {field('name', { req: true, auto: 'name' })}
                {field('company', { auto: 'organization' })}
                {field('email', { type: 'email', req: true, auto: 'email' })}
                {field('phone', { type: 'tel', auto: 'tel' })}
                {field('place', { req: true, ph: f.placeholders.place })}
                {field('length', { ph: f.placeholders.length })}
                {field('message', { wide: true, area: true, ph: f.placeholders.message })}
              </div>
              <p className="p2-formnote">{k.requiredNote}</p>
              <div className="p2-formfoot">
                <button type="submit" className="p2-btn p2-btn--primary p2-btn--lg" disabled={status === 'sending'}>
                  {status === 'sending' ? f.sending : f.submit}
                  {status !== 'sending' && <Icon name="arrow" size={16} />}
                </button>
                <p className="p2-formnote">{f.reply} {f.consent}</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
