// The two normal sections after the pinned story. Proizvodi, a plain range of the main products in one row
// with a strip of Ekotehnika's own photos and one call to action, then a classic footer. Copy from ../copy.ts, the contacts as text.
import { footer, proizvodi } from '../copy';
import { SITE } from '../../content';
import { TruckIcon } from './icons';

export function Products() {
  return (
    <section className="s2-products placeholder" id="sadrzaj" aria-labelledby="s2-products-title">
      <div className="s2-wrap">
        <p className="s2-kicker">
          <i className="s2-dot" aria-hidden="true" />
          {proizvodi.kicker}
        </p>
        <h2 className="s2-title" id="s2-products-title">
          {proizvodi.title}
        </h2>
        <ul className="s2-cards">
          {proizvodi.items.map((p) => (
            <li className="s2-product" key={p.name}>
              <div className="s2-product-art">
                <TruckIcon name={p.icon} size={112} />
              </div>
              <h3>{p.name}</h3>
              <p>{p.type}</p>
            </li>
          ))}
        </ul>
        <ul className="s2-photos">
          {proizvodi.photos.map((ph) => (
            <li key={ph.src}>
              <img src={ph.src} alt={ph.alt} width={800} height={1000} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
        <a className="s2-cta" href={proizvodi.cta.href} data-cta="quote">
          {proizvodi.cta.label}
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="s2-footer" id="kontakt">
      <div className="s2-wrap s2-footer-grid">
        <div className="s2-footer-brand">
          <a className="s2-footer-logo" href={`${SITE}/`}>
            <img src="/brand/linde-mh.png" width={57} height={34} alt="Linde Material Handling" />
            <img src="/brand/ekotehnika.png" width={81} height={22} alt="Ekotehnika, početna strana" />
          </a>
          <p>{footer.lede}</p>
        </div>
        <nav aria-label="Navigacija u podnožju">
          <h3>Navigacija</h3>
          <ul>
            {footer.nav.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <address>
          <h3>Adresa</h3>
          {footer.address.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </address>
        <div>
          <h3>Kontakt</h3>
          {footer.phones.map((p) => (
            <p key={p.label}>
              {p.label}{' '}
              <a href={p.tel} data-cta={p.label === 'Prodaja' ? 'call-sales' : 'call-service'}>
                {p.number}
              </a>
            </p>
          ))}
          {footer.emails.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      </div>
      <div className="s2-wrap s2-footer-base">
        <p>{footer.copyright}</p>
      </div>
    </footer>
  );
}
