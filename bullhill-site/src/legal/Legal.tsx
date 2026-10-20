import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/azeret-mono';
import '../p1/foundry.css';
import './legal.css';
import { useEffect } from 'react';
import { LangSwitch } from '../shared/LangSwitch';
import { Logo } from '../shared/Logo';
import { useContent } from '../shared/lang';
import { TO_CONFIRM, legalCopy, legalHref, type Row } from './copy';

// The legal notice at /legal and the privacy page at /privacy, ?lang=de for German. Foundry's type and
// grid on the light paper ground, the full logo on black at the top, as on every page.
function Value({ r }: { r: Row }) {
  const pending = r.v.includes(TO_CONFIRM);
  const v = r.v.replace(TO_CONFIRM, '').trim();
  return (
    <dd className="lg__v">
      {r.href ? <a href={r.href}>{v}</a> : v}
      {pending ? <mark className="lg__tc mono">{TO_CONFIRM}</mark> : null}
    </dd>
  );
}

export default function Legal({ page }: { page: 'legal' | 'privacy' }) {
  const [c, setLang] = useContent();
  const L = legalCopy[c.lang];
  const P = L[page];
  const home = c.lang === 'de' ? '/?lang=de' : '/';
  useEffect(() => {
    document.title = L.meta[page];
  }, [L, page]);
  return (
    <div className="p1 lg" lang={c.lang}>
      <header className="lg__hd">
        <div className="g lg__hdin">
          <a href={home} className="lg__logo" aria-label={L.home}>
            <Logo variant="on-dark" height={48} />
          </a>
          <LangSwitch lang={c.lang} setLang={setLang} label={L.langLabel} className="lang lg__lang" />
        </div>
      </header>
      <main className="g lg__main">
        <p className="mono kicker">{P.kicker}</p>
        <h1 className="display lg__title">{P.title}</h1>
        <p className="mono lg__date">{P.updated}</p>
        {P.blocks.map((b) => (
          <section key={b.title} className="lg__block">
            <h2 className="mono lg__h">{b.title}</h2>
            <div className="lg__body">
              {b.rows ? (
                <dl className="lg__rows">
                  {b.rows.map((r) => (
                    <div key={r.k} className="lg__row">
                      <dt className="mono lg__k">{r.k}</dt>
                      <Value r={r} />
                    </div>
                  ))}
                </dl>
              ) : null}
              {b.body?.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="lg__ft">
        <div className="g lg__ftin mono">
          <a href={home}>{L.home}</a>
          <a href={legalHref('legal', c.lang)} aria-current={page === 'legal' ? 'page' : undefined}>
            {L.links.legal}
          </a>
          <a href={legalHref('privacy', c.lang)} aria-current={page === 'privacy' ? 'page' : undefined}>
            {L.links.privacy}
          </a>
          <span>{c.footer.rights}</span>
        </div>
      </footer>
    </div>
  );
}
