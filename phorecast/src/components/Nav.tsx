import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { Roll } from './Roll';
import { Icon } from './Icon';
import { ThemeToggle, ThemeSwitch } from './ThemeToggle';
import chevron from '../assets/icons/chevron-down.svg';
import './Nav.css';

const LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Markets', href: '#markets' },
  { label: 'Leaderboard', href: '#leaderboard' },
  { label: 'More', href: '#more' },
];

/** The breakpoint the sheet exists below. Kept in step with Nav.css by hand. */
const MOBILE = '(max-width: 960px)';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]';

export function Nav() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const captionId = useId();

  /* Closing always hands focus back to the burger. For Escape and the X that
     is simply the dialog rule. For a menu link it is a judgement call: the
     hrefs here are in-page anchors and most of their targets do not exist as
     elements yet, so there is nothing better to move to, and landing on the
     trigger beats landing on <body> with no position at all. */
  const close = useCallback(() => {
    setOpen(false);
    // After the inert attributes come off, which happens in the effect cleanup
    // below — a focus() into an inert subtree is silently dropped.
    queueMicrotask(() => burgerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    /* The background goes inert. The sheet is portalled to <body>, so "the
       background" is every other child of <body> — which on this page is the
       single React root, nav bar and all. `inert` alone is enough in every
       browser that has it; `aria-hidden` is the belt for the ones that do not,
       and the Tab handler below is the braces. Only attributes this effect
       actually added are taken off again. */
    const inerted: Element[] = [];
    const hidden: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === sheet) continue;
      if (!el.hasAttribute('inert')) { el.setAttribute('inert', ''); inerted.push(el); }
      if (!el.hasAttribute('aria-hidden')) { el.setAttribute('aria-hidden', 'true'); hidden.push(el); }
    }

    /* The page behind must not scroll. Both elements, because which one owns
       the viewport's scrollbox depends on the propagation rules and body
       already carries an `overflow-x` of its own. Restoring to '' hands each
       back to the stylesheet rather than to a guess. */
    const de = document.documentElement;
    const prevHtml = de.style.overflow;
    const prevBody = document.body.style.overflow;
    de.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE))
        // The unchecked theme option is tabindex="-1" on purpose: a radio
        // group is one Tab stop, and the arrow keys reach the other half.
        .filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && sheet.contains(active);
      if (e.shiftKey ? (!inside || active === first) : (!inside || active === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener('keydown', onKey);

    /* Resizing past the breakpoint hides the sheet in CSS. Without this the
       scroll lock and the inert background would outlive the thing they
       belong to, on a page with no visible way to close it. */
    const mq = window.matchMedia(MOBILE);
    const onChange = () => { if (!mq.matches) setOpen(false); };
    mq.addEventListener('change', onChange);

    // Focus lands on the X, not on the wordmark: the first thing a dialog
    // should offer is the way out.
    closeRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
      de.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      for (const el of inerted) el.removeAttribute('inert');
      for (const el of hidden) el.removeAttribute('aria-hidden');
    };
  }, [open, close]);

  const sheet = (
    <div
      id="mobile-menu"
      ref={sheetRef}
      className={`nav__sheet${open ? ' is-open' : ''}`}
      hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="nav__sheet-inner">
        <div className="nav__sheet-top">
          <Logo />
          <button type="button" ref={closeRef} className="nav__sheet-close" aria-label="Close menu" onClick={close}>
            <svg viewBox="0 0 22 22" width="22" height="22" fill="none" aria-hidden="true">
              <path d="M2 2l18 18M20 2L2 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="nav__sheet-nav" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nav__link" onClick={close}><Roll>{l.label}</Roll></a>
          ))}
        </nav>

        {/* The dock. Everything actionable lives here, at the bottom of a
            full-height surface, because the bottom of a phone is the part of
            it a thumb reaches. The links above can stay high; they are what
            you read, not what you press blind. */}
        <div className="nav__sheet-actions">
          <p className="nav__sheet-caption" id={captionId}>Appearance</p>
          <ThemeSwitch labelledBy={captionId} />
          <div className="nav__sheet-auth">
            <a href="#login" className="btn btn--ghost nav__sheet-login" onClick={close}><Roll>Login</Roll></a>
            <a href="#signup" className="btn btn--outline nav__sheet-signup" onClick={close}><Roll>Sign Up</Roll></a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <header className="nav">
      <div className="nav__row">
        <Logo />
        <nav className="nav__links" aria-label="Primary">
          {LINKS.slice(0, 3).map((l) => (
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
          ref={burgerRef}
          className={`nav__burger${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      {/* Portalled to <body>, and not for tidiness. .hero sets
          `overflow: hidden` and `isolation: isolate` and is a container query
          root; a full-viewport surface has no business depending on whether
          any of those three turns out to establish a containing block for
          `position: fixed`. It also puts the sheet beside the React root
          rather than inside it, which is what makes "inert everything else"
          one loop over document.body.children.

          The second effect is load-bearing for the entrance: entrance.ts
          collects its nav targets with `all(hero, …)`, so a second .logo
          living outside .hero cannot be swept into the stagger, and
          `.hero[data-motion='pending'] .nav .logo { visibility: hidden }`
          cannot reach it either. */}
      {createPortal(sheet, document.body)}
    </header>
  );
}
