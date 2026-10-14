import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Accordion, RadioGroup } from 'radix-ui';
import type { Content, Lang } from '../shared/content';
import { LangSwitch } from '../shared/LangSwitch';
import { ArrowIcon, ChevronDown, Crosshairs } from './art';
import { t } from './copy';
import { DarkBtn, Kicker } from './ui';

/* ---------- FAQ, Radix Accordion on a soft red glow ---------- */

export function Faq({ c }: { c: Content }) {
  return (
    <section className="p3-faqsec" aria-labelledby="p3-faq-h">
      <div className="p3-panel p3-faq">
        <span className="p3-faq__glow" aria-hidden="true" />
        <div className="p3-faq__frame">
          <Crosshairs />
          <div className="p3-faq__intro">
            <h2 id="p3-faq-h" className="p3-h2">
              {c.faq.title}
            </h2>
            <DarkBtn href="#contact">{t(c, 'faqCta')}</DarkBtn>
          </div>
          <Accordion.Root type="single" collapsible className="p3-acc">
            {c.faq.items.map((it, i) => (
              <Accordion.Item key={it.q} value={`q${i}`} className="p3-acc__item">
                <Accordion.Header className="p3-acc__h">
                  <Accordion.Trigger className="p3-acc__trig">
                    <ArrowIcon />
                    <span className="p3-acc__q">{it.q}</span>
                    <span className="p3-acc__tog" aria-hidden="true">
                      <ChevronDown size={16} />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="p3-acc__content">
                  <p>{it.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </div>
    </section>
  );
}

/* ---------- contact form ---------- */

type Status = 'idle' | 'sending' | 'success' | 'error';
type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

function Field({ id, label, required, error, className, children }: { id: string; label: string; required?: boolean; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`p3-field${error ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`}>
      <label htmlFor={id} className="p3-flabel">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="p3-err" id={`${id}-err`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="0.75" y="0.75" width="12.5" height="12.5" />
            <path d="M7 3.5 V7.5 M7 9.5 V10.5" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Contact({ c }: { c: Content }) {
  const forcedError = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('form') === 'error';
  const [status, setStatus] = useState<Status>(forcedError ? 'error' : 'idle');
  const [errors, setErrors] = useState<Errors>({});
  const [roleIdx, setRoleIdx] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);


  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const val = (k: string) => String(d.get(k) ?? '').trim();
    const next: Errors = {};
    if (!val('name')) next.name = c.form.required;
    if (!val('email')) next.email = c.form.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) next.email = t(c, 'emailInvalid');
    if (!val('message')) next.message = c.form.required;
    setErrors(next);
    const first = (['name', 'email', 'message'] as const).find((k) => next[k]);
    if (first) {
      setStatus('idle');
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus('sending');
    timer.current = window.setTimeout(() => setStatus(forcedError ? 'error' : 'success'), 800);
  };

  const f = c.form.fields;
  const ph = c.form.placeholders;
  const err = (k: keyof Errors) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `p3f-${k}-err` : undefined });

  return (
    <section id="contact" className="p3-contact" aria-labelledby="p3-contact-h">
      <Kicker>{c.form.kicker}</Kicker>
      <h2 id="p3-contact-h" className="p3-h2 p3-contact__line">
        {t(c, 'contactLine')}
      </h2>
      <div className="p3-contact__grid">
        <form className="p3-form" ref={formRef} onSubmit={onSubmit} noValidate>
          <div className="p3-roles">
            <span className="p3-flabel" id="p3-role-l">
              {c.form.roleLabel}
            </span>
            <RadioGroup.Root className="p3-roles__row" aria-labelledby="p3-role-l" value={String(roleIdx)} onValueChange={(v) => setRoleIdx(Number(v))} name="role" orientation="horizontal">
              {c.form.roles.map((r, i) => (
                <div className="p3-radio" key={r}>
                  <RadioGroup.Item value={String(i)} id={`p3-role-${i}`} className="p3-radio__box">
                    <RadioGroup.Indicator className="p3-radio__ind" />
                  </RadioGroup.Item>
                  <label htmlFor={`p3-role-${i}`}>{r}</label>
                </div>
              ))}
            </RadioGroup.Root>
          </div>
          <div className="p3-fields">
            <Field id="p3f-name" label={f.name} required error={errors.name}>
              <input id="p3f-name" name="name" type="text" autoComplete="name" aria-required="true" {...err('name')} />
            </Field>
            <Field id="p3f-company" label={f.company}>
              <input id="p3f-company" name="company" type="text" autoComplete="organization" />
            </Field>
            <Field id="p3f-email" label={f.email} required error={errors.email}>
              <input id="p3f-email" name="email" type="email" autoComplete="email" aria-required="true" {...err('email')} />
            </Field>
            <Field id="p3f-phone" label={f.phone}>
              <input id="p3f-phone" name="phone" type="tel" autoComplete="tel" />
            </Field>
            <Field id="p3f-place" label={f.place}>
              <input id="p3f-place" name="place" type="text" placeholder={ph.place} />
            </Field>
            <Field id="p3f-length" label={f.length}>
              <input id="p3f-length" name="length" type="text" placeholder={ph.length} />
            </Field>
            <Field id="p3f-message" label={f.message} required error={errors.message} className="p3-field--wide">
              <textarea id="p3f-message" name="message" rows={6} placeholder={ph.message} aria-required="true" {...err('message')} />
            </Field>
          </div>
          <p className="p3-form__note">{c.form.consent}</p>
          <div className="p3-form__actions">
            <DarkBtn type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? c.form.sending : c.form.submit}
            </DarkBtn>
            <p className="p3-form__req">{`* ${c.form.required}`}</p>
          </div>
          <div className="p3-status" role="status" aria-live="polite" data-state={status}>
            {status === 'success' ? (
              <p>
                <b>{t(c, 'statusDone')}</b> {c.form.success}
              </p>
            ) : null}
            {status === 'error' ? (
              <p>
                <b>{t(c, 'statusError')}</b> {c.form.error}
              </p>
            ) : null}
            {status === 'sending' ? <p>{c.form.sending}</p> : null}
          </div>
        </form>
        <aside className="p3-contact__aside" aria-label={t(c, 'contactDetails')}>
          <div className="p3-ci">
            <ArrowIcon size={20} />
            <p className="p3-mono">{t(c, 'labelPhone')}</p>
            <a href={c.contact.phoneHref}>{c.contact.phone}</a>
            <span className="p3-ci__small">{c.contact.hours}</span>
          </div>
          <div className="p3-ci">
            <ArrowIcon size={20} />
            <p className="p3-mono">{t(c, 'labelEmail')}</p>
            <a href={`mailto:${c.contact.email}`}>{c.contact.email}</a>
          </div>
          <div className="p3-ci">
            <ArrowIcon size={20} />
            <p className="p3-mono">{c.contact.whatsapp}</p>
            <a href={c.contact.whatsappHref}>{c.contact.phone}</a>
          </div>
          <div className="p3-ci">
            <ArrowIcon size={20} />
            <p className="p3-mono">{t(c, 'labelAddress')}</p>
            <address>
              BullHill
              {c.contact.address.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */

export function Footer({ c, lang, setLang }: { c: Content; lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <footer className="p3-foot">
      <p className="p3-foot__rights">{c.footer.rights}</p>
      <nav className="p3-foot__nav" aria-label="Legal">
        <a href="#top">{c.footer.legal}</a>
        <a href="#top">{c.footer.privacy}</a>
      </nav>
      <LangSwitch lang={lang} setLang={setLang} label={c.ui.langLabel} className="p3-lang" />
    </footer>
  );
}
