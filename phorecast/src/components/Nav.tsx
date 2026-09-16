import { useEffect, useState } from 'react';
import { Logo } from './Logo';
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
            <a key={l.label} href={l.href} className="nav__link">{l.label}</a>
          ))}
          <button type="button" className="nav__link nav__more" aria-haspopup="menu">
            More
            <img src={chevron} alt="" width={13.73} height={7.49} />
          </button>
        </nav>
        <div className="nav__actions">
          <a href="#login" className="btn btn--ghost">Login</a>
          <a href="#signup" className="btn btn--outline">Sign Up</a>
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
          <a key={l.label} href={l.href} className="nav__link" onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a href="#more" className="nav__link" onClick={() => setOpen(false)}>More</a>
        <div className="nav__sheet-actions">
          <a href="#login" className="btn btn--ghost">Login</a>
          <a href="#signup" className="btn btn--outline">Sign Up</a>
        </div>
      </div>
    </header>
  );
}
