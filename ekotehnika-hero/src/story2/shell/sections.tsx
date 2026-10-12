// The footer after the pinned story, the only page section left after Filip removed the statement, Proizvodi, the
// client wall and the closing band on 2026-10-12. Copy from ../copy.ts. The notched edge is an SVG path, plan B5.
import { SITE } from '../../content';
import { footer } from '../copy';
import { FooterLine } from './lineart';

// One wide tab notch, 320px wide and 40px deep with 24px corners and 16px fillets, in the colour of the section below.
export function Notch({ color }: { color: string }) {
  return (
    <div className="notch" aria-hidden="true">
      <svg width="320" height="40" viewBox="0 0 320 40" focusable="false">
        <path d="M0 40 A16 16 0 0 0 16 24 A24 24 0 0 1 40 0 H280 A24 24 0 0 1 304 24 A16 16 0 0 0 320 40 Z" fill={color} />
      </svg>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="s2-footer" id="kontakt" data-after-story>
      <span id="sadrzaj" />
      <Notch color="var(--grey-pale)" />
      <div className="sec-grid ft-grid">
        <a className="ft-logo" href={`${SITE}/`}>
          <img src="/brand/linde-mh.svg" width={160} height={96} alt="Linde Material Handling" />
          <img src="/brand/ekotehnika.svg" width={160} height={33} alt="Ekotehnika, početna strana" />
        </a>
        <div className="ft-hitan">
          <p className="s2-label">{footer.service.label}</p>
          <a className="ft-num" href={footer.service.tel} data-cta="call-service">
            {footer.service.number}
          </a>
        </div>
        <nav className="ft-col ft-nav" aria-label="Navigacija u podnožju">
          <h3 className="s2-label">Navigacija</h3>
          <ul>
            {footer.nav.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <address className="ft-col ft-adr">
          <h3 className="s2-label">Adresa</h3>
          {footer.address.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </address>
        <div className="ft-col ft-kon">
          <h3 className="s2-label">Kontakt</h3>
          {footer.phones.map((p) => (
            <p key={p.label}>
              <a href={p.tel} data-cta={p.label === 'Prodaja' ? 'call-sales' : 'call-service'}>
                {p.label} {p.number}
              </a>
            </p>
          ))}
          {footer.emails.map((e) => (
            <p key={e}>
              <a href={`mailto:${e}`}>{e}</a>
            </p>
          ))}
        </div>
      </div>
      <div className="ft-ground">
        <FooterLine />
      </div>
      <div className="sec-grid ft-base">
        <p>{footer.copyright}</p>
        <p>{footer.legal}</p>
      </div>
    </footer>
  );
}
