import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { Roll } from './Roll';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';
import chevron from '../assets/icons/chevron-down.svg';
import './Nav.css';

const LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Markets', href: '#markets' },
  { label: 'Leaderboard', href: '#leaderboard' },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="nav">
      <div className="nav__row">
        <Logo />
        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nav__link"><Roll>{l.label}</Roll></a>
          ))}
          <button type="button" className="nav__link nav__more" aria-haspopup="menu">
            <Roll>More</Roll>
            {/* The mask primitive's proof case: the chevron used to be an
                <img> baked #fffbf8, so it could only ever be that colour. As a
                mask it is `color`, which means it follows --ink, inherits the
                nav link's hover to --accent for free, and needs no light
                variant on disk. */}
            <Icon src={chevron} w={13.73} h={7.49} />
          </button>
        </nav>
        <div className="nav__actions">
          <ThemeToggle />
          <a href="#login" className="btn btn--ghost"><Roll>Login</Roll></a>
          <a href="#signup" className="btn btn--outline"><Roll>Sign Up</Roll></a>
        </div>
        <button
          type="button"
          className={`nav__burger${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      <div id="mobile-menu" className={`nav__sheet${open ? ' is-open' : ''}`} hidden={!open}>
        {LINKS.map((l) => (
          <a key={l.label} href={l.href} className="nav__link" onClick={() => setOpen(false)}><Roll>{l.label}</Roll></a>
        ))}
        <a href="#more" className="nav__link" onClick={() => setOpen(false)}><Roll>More</Roll></a>
        <div className="nav__sheet-actions">
          <ThemeToggle className="theme-toggle--sheet" />
          <a href="#login" className="btn btn--ghost"><Roll>Login</Roll></a>
          <a href="#signup" className="btn btn--outline"><Roll>Sign Up</Roll></a>
        </div>
      </div>
    </header>
  );
}
