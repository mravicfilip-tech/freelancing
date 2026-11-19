// Kontakt, the form every model leads to (briefs/shop/brief.md, answer 5). What the visitor wants, Kupovina, Najam or Servis, the model
// filled in from the address, the name, the firm, the phone, the e-mail, a message and the consent. A Servis request goes to
// servis@ekotehnika.rs and the others to info@ekotehnika.rs, through /api/upit and Resend. Until the key is set on Vercel the server says
// so, and the form says plainly that it is a test and gives the address to write to instead. Nothing is ever shown as sent that was not.
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { hero } from '../content';
import { CATEGORIES, PRODUCTS, productBySlug } from './data';
import { Link } from './route';
import { Cap, Rule } from './parts';
import { Facts, Picture } from './Card';

// Delovi, the parts, Filip 19 November, briefs/pages/plan.md. Its requests go to the service inbox until the client names one for parts.
type Tema = 'kupovina' | 'najam' | 'servis' | 'delovi';
const TEME: { id: Tema; label: string }[] = [
  { id: 'kupovina', label: 'Kupovina' },
  { id: 'najam', label: 'Najam' },
  { id: 'servis', label: 'Servis' },
  { id: 'delovi', label: 'Delovi' },
];
const SALES_MAIL = 'info@ekotehnika.rs';
const SERVICE_MAIL = 'servis@ekotehnika.rs';
const toService = (t: Tema) => t === 'servis' || t === 'delovi';
const inbox = (t: Tema) => (toService(t) ? SERVICE_MAIL : SALES_MAIL);
const phone = (t: Tema) => (toService(t) ? hero.service.number : hero.sales.number);

type Fields = { ime: string; prezime: string; firma: string; telefon: string; email: string; model: string; poruka: string; saglasnost: boolean; website: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Mode = 'checking' | 'live' | 'test';
type Sent = { state: 'idle' } | { state: 'sending' } | { state: 'sent'; test: boolean } | { state: 'failed' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function check(f: Fields): Errors {
  const e: Errors = {};
  if (!f.ime.trim()) e.ime = 'Upišite ime.';
  if (!f.prezime.trim()) e.prezime = 'Upišite prezime.';
  if (f.telefon.replace(/[^\d]/g, '').length < 6) e.telefon = 'Upišite broj telefona, sa pozivnim brojem.';
  if (!EMAIL.test(f.email.trim())) e.email = 'Upišite e-mail adresu, na primer ime@firma.rs.';
  if (!f.saglasnost) e.saglasnost = 'Potrebna je vaša saglasnost da bismo vam odgovorili.';
  return e;
}

// poruka fills the message from the link that opened the form, a rental term or a group of parts, a person can change it
export function Contact({ tema, model, poruka }: { tema: string | null; model: string | null; poruka?: string | null }) {
  useEffect(() => {
    document.title = 'Kontakt, pošaljite upit | Ekotehnika';
  }, []);
  const first: Tema = TEME.find((x) => x.id === tema)?.id ?? 'kupovina';
  const [t, setT] = useState<Tema>(first);
  const [f, setF] = useState<Fields>({ ime: '', prezime: '', firma: '', telefon: '', email: '', model: productBySlug(model ?? '') ? model! : '', poruka: (poruka ?? '').slice(0, 400), saglasnost: false, website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [mode, setMode] = useState<Mode>('checking');
  const [sent, setSent] = useState<Sent>({ state: 'idle' });
  const picked = productBySlug(f.model);

  // whether the server sends, asked once, a page with no server behind it (the dev server) is a test
  useEffect(() => {
    let on = true;
    fetch('/api/upit', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { live?: boolean } | null) => on && setMode(j?.live ? 'live' : 'test'))
      .catch(() => on && setMode('test'));
    return () => {
      on = false;
    };
  }, []);

  const groups = useMemo(() => CATEGORIES.map((c) => ({ c, items: PRODUCTS.filter((p) => p.category === c.slug) })), []);
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = check(f);
    setErrors(found);
    const firstBad = (Object.keys(found) as (keyof Fields)[])[0];
    if (firstBad) {
      document.getElementById(`f-${firstBad}`)?.focus();
      return;
    }
    setSent({ state: 'sending' });
    try {
      const r = await fetch('/api/upit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...f, tema: t, modelName: picked ? `Linde ${picked.code}, ${picked.kind}` : '' }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; test?: boolean } | null;
      if (r.ok && j?.ok) setSent({ state: 'sent', test: Boolean(j.test) });
      else if (mode === 'test' && r.status === 404) setSent({ state: 'sent', test: true });
      else setSent({ state: 'failed' });
    } catch {
      setSent(mode === 'test' ? { state: 'sent', test: true } : { state: 'failed' });
    }
  };

  const field = (k: 'ime' | 'prezime' | 'firma' | 'telefon' | 'email', label: string, opts: { type?: string; auto?: string; required?: boolean; mode?: 'tel' | 'email' } = {}) => (
    <div className={`sp-f${errors[k] ? ' is-bad' : ''}`}>
      <label htmlFor={`f-${k}`}>
        {label}
        {opts.required === false ? <span className="sp-f-opt"> nije obavezno</span> : null}
      </label>
      <input
        id={`f-${k}`}
        name={k}
        type={opts.type ?? 'text'}
        inputMode={opts.mode}
        autoComplete={opts.auto}
        value={f[k]}
        onChange={(e) => set(k, e.target.value)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `e-${k}` : undefined}
        required={opts.required !== false}
      />
      {errors[k] ? (
        <p className="sp-err" id={`e-${k}`}>
          {errors[k]}
        </p>
      ) : null}
    </div>
  );

  return (
    <section className="sp-frame sp-contact">
      <div className="sp-cell sp-contact-l" style={{ gridColumn: 'span 2' }}>
        <Rule />
        <p className="sp-lab">Kontakt</p>
        <h1 className="sp-h1">Pošaljite upit</h1>
        <p className="sp-lede">Upit stiže prodaji ili servisu Ekotehnike. Za hitan servis pozovite.</p>
        <dl className="sp-ways">
          <div>
            <dt>{hero.sales.label}</dt>
            <dd>
              <a href={hero.sales.tel} data-cta="call-sales">
                {hero.sales.number}
              </a>
              <a href={`mailto:${SALES_MAIL}`}>{SALES_MAIL}</a>
            </dd>
          </div>
          <div>
            <dt>{hero.service.label}</dt>
            <dd>
              <a href={hero.service.tel} data-cta="call-service">
                {hero.service.number}
              </a>
              <a href={`mailto:${SERVICE_MAIL}`}>{SERVICE_MAIL}</a>
            </dd>
          </div>
          <div>
            <dt>Adresa</dt>
            <dd>
              <span>Moše Pijade 17b</span>
              <span>11224 Vrčin</span>
            </dd>
          </div>
        </dl>
        {/* what the inquiry is about, Filip 18 November, "add some imagery here". The model the select holds, its picture on a pale tile
            with its name and two figures, changing with the select. With no model the shop's photo of the trucks side by side. */}
        <figure className="sp-contact-pic">
          {picked ? (
            <>
              <Picture p={picked} size="hero" />
              <figcaption>
                <span className="sp-contact-pic-x">
                  <span className="sp-lab">{picked.kind}</span>
                  <span className="sp-contact-pic-t">Linde {picked.code}</span>
                </span>
                <Facts p={picked} />
              </figcaption>
            </>
          ) : (
            <>
              <div className="sp-pic is-photo">
                <img src="/shop/hero/range.webp" alt="Linde viljuškari svih vrsta, jedan pored drugog u hali" decoding="async" />
              </div>
              <figcaption>
                <span className="sp-contact-pic-x">
                  <span className="sp-lab">Prodavnica</span>
                  <span className="sp-contact-pic-t">{PRODUCTS.length} modela Linde viljuškara</span>
                </span>
              </figcaption>
            </>
          )}
        </figure>
      </div>

      <div className="sp-cell sp-contact-r" style={{ gridColumn: 'span 2' }}>
        <Rule />
        {mode === 'test' && sent.state !== 'sent' ? (
          <p className="sp-note" role="note">
            <strong>Probni obrazac.</strong> Upit se još ne šalje. Pišite nam na <a href={`mailto:${inbox(t)}`}>{inbox(t)}</a> ili pozovite {phone(t)}.
          </p>
        ) : null}

        {sent.state === 'sent' ? (
          <div className="sp-done" role="status" aria-live="polite">
            <p className="sp-lab">{sent.test ? 'Probni obrazac' : 'Upit je poslat'}</p>
            <p className="sp-done-t">{sent.test ? 'Upit je ispravno popunjen, ali nije poslat.' : `Hvala, ${f.ime.trim()}. Upit je stigao na ${inbox(t)}.`}</p>
            {sent.test ? (
              <p className="sp-lede">
                Obrazac je još u probnom radu. Pošaljite isti upit na <a href={`mailto:${inbox(t)}?subject=${encodeURIComponent(`Upit, ${TEME.find((x) => x.id === t)!.label}${picked ? `, Linde ${picked.code}` : ''}`)}`}>{inbox(t)}</a> ili pozovite {phone(t)}.
              </p>
            ) : null}
            <Link className="btn btn-secondary" href="/prodavnica">
              <BtnInner>Nazad u prodavnicu</BtnInner>
            </Link>
          </div>
        ) : (
          <form className="sp-form" onSubmit={submit} noValidate aria-busy={sent.state === 'sending'}>
            <fieldset className="sp-tema">
              <legend>Šta vas zanima</legend>
              <div className="sp-seg" role="radiogroup">
                {TEME.map((x) => (
                  <label key={x.id} className={t === x.id ? 'is-on' : undefined}>
                    <input type="radio" name="tema" value={x.id} checked={t === x.id} onChange={() => setT(x.id)} />
                    <span>{x.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="sp-f">
              <label htmlFor="f-model">
                Model<span className="sp-f-opt"> nije obavezno</span>
              </label>
              <div className="sp-select">
                <select id="f-model" name="model" value={f.model} onChange={(e) => set('model', e.target.value)}>
                  <option value="">Bez modela, opšti upit</option>
                  {groups.map(({ c, items }) => (
                    <optgroup label={c.name} key={c.slug}>
                      {items.map((p) => (
                        <option value={p.slug} key={p.slug}>
                          Linde {p.code}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className="sp-pair">
              {field('ime', 'Ime', { auto: 'given-name' })}
              {field('prezime', 'Prezime', { auto: 'family-name' })}
            </div>
            {field('firma', 'Firma', { auto: 'organization', required: false })}
            <div className="sp-pair">
              {field('telefon', 'Telefon', { type: 'tel', auto: 'tel', mode: 'tel' })}
              {field('email', 'E-mail', { type: 'email', auto: 'email', mode: 'email' })}
            </div>

            <div className="sp-f">
              <label htmlFor="f-poruka">
                Poruka<span className="sp-f-opt"> nije obavezno</span>
              </label>
              <textarea id="f-poruka" name="poruka" rows={5} value={f.poruka} onChange={(e) => set('poruka', e.target.value)} />
            </div>

            {/* a field people never see, filled only by a bot, the server drops such a request */}
            <div className="sp-trap" aria-hidden="true">
              <label htmlFor="f-website">Sajt</label>
              <input id="f-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} />
            </div>

            <div className={`sp-check${errors.saglasnost ? ' is-bad' : ''}`}>
              <input
                id="f-saglasnost"
                type="checkbox"
                checked={f.saglasnost}
                onChange={(e) => set('saglasnost', e.target.checked)}
                aria-invalid={errors.saglasnost ? true : undefined}
                aria-describedby={errors.saglasnost ? 'e-saglasnost' : undefined}
              />
              <label htmlFor="f-saglasnost">Slažem se da Ekotehnika koristi ove podatke da bi mi odgovorila na upit.</label>
              {errors.saglasnost ? (
                <p className="sp-err" id="e-saglasnost">
                  {errors.saglasnost}
                </p>
              ) : null}
            </div>

            {sent.state === 'failed' ? (
              <p className="sp-note is-bad" role="alert">
                <strong>Upit nije poslat.</strong> Proverite vezu i pokušajte ponovo, ili pišite na <a href={`mailto:${inbox(t)}`}>{inbox(t)}</a>.
              </p>
            ) : null}

            <div className="sp-submit">
              <button type="submit" className="btn btn-primary" disabled={sent.state === 'sending' || mode === 'checking'}>
                <BtnInner>{sent.state === 'sending' ? 'Šaljemo' : 'Pošaljite upit'}</BtnInner>
              </button>
              <p className="sp-to">
                Stiže na {inbox(t)}
              </p>
            </div>
          </form>
        )}
      </div>
      <Cap />
    </section>
  );
}
