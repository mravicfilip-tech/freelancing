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
];

/* What MORE opens. There was nothing to mirror: the desktop bar's More is a
   `<button aria-haspopup="menu">` with a chevron and no menu behind it, so the
   sheet was reproducing a stub faithfully. These four are not invented either
   -- they are the page's own remaining sections, and every href here is an id
   that exists in the document (#why, #how, #built, #faq), so the disclosure
   goes somewhere. Desktop's More stays a stub because desktop must not move;
   this is the list to give it when someone is allowed to. */
const MORE_LINKS = [
  { label: 'Why Phorcast', href: '#why' },
  { label: 'How it works', href: '#how' },
  { label: 'Infrastructure', href: '#built' },
  { label: 'FAQ', href: '#faq' },
];

/** The breakpoint the sheet exists below. Kept in step with Nav.css by hand. */
const MOBILE = '(max-width: 960px)';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]';

export function Nav() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  const moreId = useId();

  const close = useCallback(() => setOpen(false), []);

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
        // Three things are deliberately not Tab stops. The unchecked theme
        // option carries tabindex="-1" because a radio group is one stop and
        // the arrows reach the other half. A collapsed More is `inert`, which
        // does not clear tabIndex, so it has to be asked for by hand. And
        // anything the sheet has scrolled past still has a rect, which is why
        // the visibility test is a rect test and not an offsetParent one.
        .filter((el) => el.tabIndex >= 0 && !el.closest('[inert]') && el.getClientRects().length > 0);
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
    // A disclosure left open from last time is a menu that opens at a
    // different height every time you press the burger.
    setMoreOpen(false);

    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
      de.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      for (const el of inerted) el.removeAttribute('inert');
      for (const el of hidden) el.removeAttribute('aria-hidden');

      /* Focus goes back to the trigger, from HERE rather than from the click
         handler: a focus() into a subtree still marked `inert` is dropped on
         the floor, and whether React has flushed this cleanup by the time a
         microtask queued in the handler runs is not something to bet on.

         `preventScroll`, and this is the interesting half. The nav bar is not
         sticky, so the burger is off screen for anyone who had scrolled
         before opening the menu — and a plain focus() scrolls it into view,
         which means closing the menu silently threw the reader back to the
         top of the page. Measured: 240 -> 0 on Escape. Holding the viewport
         still costs a keyboard user a focus ring they cannot see until they
         press Tab; teleporting the page costs every user their place. The
         second is worse, so the ring loses.

         Closing on a menu link is the same call for a different reason: those
         hrefs are in-page anchors whose targets mostly do not exist yet, so
         there is nothing better to land on than the control that opened this. */
      burgerRef.current?.focus({ preventScroll: true });
    };
  }, [open, close]);

  const sheet = (
    <div
      id="mobile-menu"
      ref={sheetRef}
      className={`nav__sheet${open ? ' is-open' : ''}`}
      data-more={moreOpen}
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
            <a key={l.label} href={l.href} className="sheet-link" onClick={close}>{l.label}</a>
          ))}

          {/* The disclosure. `aria-expanded` on the control, `aria-controls`
              pointing at the list it opens, and the list itself `inert` and
              `aria-hidden` while shut -- which takes its four links out of
              both the focus order and the accessibility tree without taking
              them out of the DOM, so the panel still has a height to animate
              between. `hidden` would do the first two jobs and make the third
              impossible. */}
          <button
            type="button"
            className="sheet-link sheet-link--more"
            aria-expanded={moreOpen}
            aria-controls={moreId}
            onClick={() => setMoreOpen((o) => !o)}
          >
            More
            <Icon src={chevron} w={13.73} h={7.49} className="sheet-link__chev" />
          </button>
          <div className="sheet-sub" data-open={moreOpen}>
            <ul id={moreId} className="sheet-sub__list" inert={!moreOpen} aria-hidden={!moreOpen}>
              {MORE_LINKS.map((l) => (
                <li key={l.label}><a href={l.href} className="sheet-sub__link" onClick={close}>{l.label}</a></li>
              ))}
            </ul>
          </div>
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
