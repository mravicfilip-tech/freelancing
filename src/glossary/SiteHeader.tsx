import { useEffect, useState } from 'react';
import { NavDropdown } from '../site/NavDropdown';
import { EDUCATION_CENTRE_MENU, HOME_URL, PRESALE_URL, PRIMARY_NAV } from '../site/navigation';
import logoMark from './assets/logo-mark.svg';

/** Matches the CSS breakpoint where the link row collapses behind the menu button. */
const DESKTOP_NAV = '(min-width: 1180px)';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const desktop = window.matchMedia(DESKTOP_NAV);
    const onResize = () => desktop.matches && setMenuOpen(false);
    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onResize);
    };
  }, [menuOpen]);

  return (
    <header className="rtx-header" data-menu-open={menuOpen || undefined}>
      <a className="rtx-brand" href={HOME_URL}>
        <img className="rtx-brand__mark" src={logoMark} width={33} height={17} alt="" />
        Remittix
      </a>
      <nav id="rtx-primary-nav" className="rtx-nav" aria-label="Primary">
        <ul className="rtx-nav__list">
          {PRIMARY_NAV.map((link) => (
            <li key={link.href}>
              <a className="rtx-nav__link" data-emphasis={link.emphasis || undefined} href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <NavDropdown label="Education Centre" items={EDUCATION_CENTRE_MENU} className="rtx-dropdown" />
          </li>
        </ul>
        <a className="rtx-presale" href={PRESALE_URL}>
          Join Presale
        </a>
      </nav>
      <button
        type="button"
        className="rtx-burger"
        aria-expanded={menuOpen}
        aria-controls="rtx-primary-nav"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="rtx-burger__bars" aria-hidden="true" />
      </button>
    </header>
  );
}
