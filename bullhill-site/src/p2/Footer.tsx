import type { Content } from '../shared/content';
import { Logo } from '../shared/Logo';
import { Icon, Guides } from './icons';
import { pick } from './copy';

export function Footer({ c }: { c: Content }) {
  const k = pick(c.lang).footer;
  return (
    <footer className="p2-footer">
      <Guides tone="dark" />
      <div className="p2-footer__hill" aria-hidden="true" />
      <div className="p2-wrap p2-footer__top">
        <Logo variant="on-dark" height={40} alt="BullHill" />
      </div>
      <div className="p2-wrap p2-footer__main">
        <div className="p2-footer__links">
          <p className="p2-mono p2-footer__head">{k.quick}</p>
          <div className="p2-footer__cols">
            <ul>
              {c.nav.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`}>{n.label}</a>
                </li>
              ))}
            </ul>
            <ul>
              {c.services.items.map((s) => (
                <li key={s.id}>
                  <a href="#services">{s.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p2-footer__cta">
          <h2 className="p2-display p2-footer__line">{k.line}</h2>
          <p className="p2-footer__lede">{c.form.lede}</p>
          <div className="p2-footer__btns">
            <a className="p2-btn p2-btn--primary" href="#contact">
              {c.ui.send}
              <Icon name="arrow" size={16} />
            </a>
            <a className="p2-btn p2-btn--light" href={c.contact.phoneHref}>
              {c.ui.call}
            </a>
          </div>
        </div>
      </div>
      <div className="p2-wrap p2-footer__bottom p2-mono">
        <a href="#top">{c.footer.privacy}</a>
        <span>{c.footer.rights}</span>
        <a href="#top">{c.footer.legal}</a>
      </div>
    </footer>
  );
}
