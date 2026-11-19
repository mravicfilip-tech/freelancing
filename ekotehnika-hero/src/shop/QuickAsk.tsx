// The close of a service page, a short inquiry in place, Filip 19 November, round 3 note 1 (briefs/pages/notes.md, taste 2026-11-19
// 14:00). The black call band stays once per page, mid page, and the close is a different section on white. The page's topic is set
// and its message filled in, the fields are the ones the form's server needs (api/upit.js), and the page's number stands large beside
// them. The checks, the topics and the inboxes are the Kontakt page's own (Contact.tsx), so both forms answer the same way.
import { useEffect, useState, type FormEvent } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { hero } from '../content';
import { check, inbox, TEME, type Errors, type Fields, type Tema } from './Contact';
import { Cap, Cell } from './parts';

type Mode = 'checking' | 'live' | 'test';
type Sent = { state: 'idle' } | { state: 'sending' } | { state: 'sent'; test: boolean } | { state: 'failed' };

export function QuickAsk({ id, tema, label, title, poruka, cta, last = false }: {
  id: string;
  tema: Tema;
  label: string;
  title: string;
  poruka: string;
  cta: string;
  last?: boolean;
}) {
  const call = tema === 'servis' || tema === 'delovi' ? hero.service : hero.sales;
  const [f, setF] = useState<Fields>({ ime: '', prezime: '', firma: '', telefon: '', email: '', model: '', poruka, saglasnost: false, website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [mode, setMode] = useState<Mode>('checking');
  const [sent, setSent] = useState<Sent>({ state: 'idle' });

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
      document.getElementById(`q-${firstBad}`)?.focus();
      return;
    }
    setSent({ state: 'sending' });
    try {
      const r = await fetch('/api/upit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...f, tema, modelName: '' }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; test?: boolean } | null;
      if (r.ok && j?.ok) setSent({ state: 'sent', test: Boolean(j.test) });
      else if (mode === 'test' && r.status === 404) setSent({ state: 'sent', test: true });
      else setSent({ state: 'failed' });
    } catch {
      setSent(mode === 'test' ? { state: 'sent', test: true } : { state: 'failed' });
    }
  };

  const field = (k: 'ime' | 'prezime' | 'telefon' | 'email', name: string, opts: { type?: string; auto?: string; mode?: 'tel' | 'email' } = {}) => (
    <div className={`sp-f${errors[k] ? ' is-bad' : ''}`}>
      <label htmlFor={`q-${k}`}>{name}</label>
      <input
        id={`q-${k}`}
        name={k}
        type={opts.type ?? 'text'}
        inputMode={opts.mode}
        autoComplete={opts.auto}
        value={f[k]}
        onChange={(e) => set(k, e.target.value)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `qe-${k}` : undefined}
        required
      />
      {errors[k] ? (
        <p className="sp-err" id={`qe-${k}`}>
          {errors[k]}
        </p>
      ) : null}
    </div>
  );

  const to = inbox(tema);
  return (
    <section className="sp-frame pg-ask pg-rv" aria-labelledby={`pg-${id}-h`}>
      <Cell span={2} className="pg-text pg-ask-l">
        <h2 className="sp-lab" id={`pg-${id}-h`}>
          {label}
        </h2>
        <p className="pg-h2">{title}</p>
        <a className="pg-ask-call" href={call.tel} data-cta={call === hero.service ? 'call-service' : 'call-sales'}>
          <span className="sp-lab">Ili pozovite, {call.label.toLowerCase()}</span>
          <span className="pg-ask-n">{call.number}</span>
        </a>
      </Cell>
      <Cell span={2} className="sp-contact-r pg-ask-r">
        {mode === 'test' && sent.state !== 'sent' ? (
          <p className="sp-note" role="note">
            <strong>Probni obrazac.</strong> Upit se još ne šalje. Pišite nam na <a href={`mailto:${to}`}>{to}</a> ili pozovite {call.number}.
          </p>
        ) : null}
        {sent.state === 'sent' ? (
          <div className="sp-done" role="status" aria-live="polite">
            <p className="sp-lab">{sent.test ? 'Probni obrazac' : 'Upit je poslat'}</p>
            <p className="sp-done-t">{sent.test ? 'Upit je ispravno popunjen, ali nije poslat.' : `Hvala, ${f.ime.trim()}. Upit je stigao na ${to}.`}</p>
            {sent.test ? (
              <p className="sp-lede">
                Obrazac je još u probnom radu. Pošaljite isti upit na <a href={`mailto:${to}?subject=${encodeURIComponent(`Upit, ${TEME.find((x) => x.id === tema)!.label}`)}`}>{to}</a> ili pozovite {call.number}.
              </p>
            ) : null}
          </div>
        ) : (
          <form className="sp-form" onSubmit={submit} noValidate aria-busy={sent.state === 'sending'}>
            <div className="sp-pair">
              {field('ime', 'Ime', { auto: 'given-name' })}
              {field('prezime', 'Prezime', { auto: 'family-name' })}
            </div>
            <div className="sp-pair">
              {field('telefon', 'Telefon', { type: 'tel', auto: 'tel', mode: 'tel' })}
              {field('email', 'E-mail', { type: 'email', auto: 'email', mode: 'email' })}
            </div>
            <div className="sp-f">
              <label htmlFor="q-poruka">
                Poruka<span className="sp-f-opt"> nije obavezno</span>
              </label>
              <textarea id="q-poruka" name="poruka" rows={3} value={f.poruka} onChange={(e) => set('poruka', e.target.value)} />
            </div>
            {/* a field people never see, filled only by a bot, the server drops such a request */}
            <div className="sp-trap" aria-hidden="true">
              <label htmlFor="q-website">Sajt</label>
              <input id="q-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} />
            </div>
            <div className={`sp-check${errors.saglasnost ? ' is-bad' : ''}`}>
              <input
                id="q-saglasnost"
                type="checkbox"
                checked={f.saglasnost}
                onChange={(e) => set('saglasnost', e.target.checked)}
                aria-invalid={errors.saglasnost ? true : undefined}
                aria-describedby={errors.saglasnost ? 'qe-saglasnost' : undefined}
              />
              <label htmlFor="q-saglasnost">Slažem se da Ekotehnika koristi ove podatke da bi mi odgovorila na upit.</label>
              {errors.saglasnost ? (
                <p className="sp-err" id="qe-saglasnost">
                  {errors.saglasnost}
                </p>
              ) : null}
            </div>
            {sent.state === 'failed' ? (
              <p className="sp-note is-bad" role="alert">
                <strong>Upit nije poslat.</strong> Proverite vezu i pokušajte ponovo, ili pišite na <a href={`mailto:${to}`}>{to}</a>.
              </p>
            ) : null}
            <div className="sp-submit">
              <button type="submit" className="btn btn-primary" disabled={sent.state === 'sending' || mode === 'checking'}>
                <BtnInner>{sent.state === 'sending' ? 'Šaljemo' : cta}</BtnInner>
              </button>
              <p className="sp-to">Stiže na {to}</p>
            </div>
          </form>
        )}
      </Cell>
      {last ? <Cap /> : null}
    </section>
  );
}
