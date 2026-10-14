import type { Content } from '../shared/content';
import { DuctEnds, HillArt } from './art';
import { Bracket } from './Bracket';
import { Logo } from '../shared/Logo';
import { sh, t } from './copy';

export function Closing({ c }: { c: Content }) {
  const x = t(c);
  return (
    <footer className="end">
      <div className="end__art" aria-hidden="true">
        <HillArt variant="close" className="art art--close" />
      </div>
      <div className="end__panel">
        <div className="end__a">
          <h2 className="end__title display">{sh(c, c.form.title)}</h2>
          <p className="end__line mono-body">{c.footer.line}</p>
          <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
        </div>
        <div className="end__b">
          <DuctEnds className="end__ducts" />
        </div>
        <nav className="end__nav" aria-label={x.mainNav}>
          {c.nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="end__link display">
              {sh(c, n.label)}
            </a>
          ))}
        </nav>
        <div className="end__info">
          <p className="mono end__k">{x.address}</p>
          <p className="mono end__addr">
            {c.contact.address.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
          <p className="mono end__legal">
            <a href="#top">{c.footer.legal}</a>
            <a href="#top">{c.footer.privacy}</a>
          </p>
          <Logo variant="on-red" height={56} className="end__logo" />
        </div>
        <div className="end__base mono">
          <span>{c.footer.company}</span>
          <span>{c.footer.rights}</span>
          <a href="#top">{c.footer.madeFor}</a>
        </div>
      </div>
    </footer>
  );
}
