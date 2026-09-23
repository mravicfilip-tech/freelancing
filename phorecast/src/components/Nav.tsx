import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { Roll } from './Roll';
import { Icon } from './Icon';
import { ThemeToggle, ThemeSwitch } from './ThemeToggle';
import { useRoute } from '../lib/router';
import { MORE_MENU, isPlaceholder, linkProps, page, stayPut } from '../lib/sitemap';
import chevron from '../assets/icons/chevron-down.svg';
import './Nav.css';

/* The bar. Markets and Leaderboard take their hrefs from the sitemap, so the
   bar, the footer and MORE all point at the same place and fill in together;
   today both are TODO(client) placeholders (see lib/sitemap.ts). */
const LINKS = [
  { label: 'Home', href: '#top' },
  page('Markets'),
  page('Leaderboard'),
];

/* What MORE opens, on both surfaces: MORE_MENU in lib/sitemap.ts.
   ---------------------------------------------------------------------------
   About only, for now: the user's call. The full sitemap (Product, Company,
   Legal) is the footer's; MORE is a short list, one column on the bar and one
   stack in the sheet. About is a route with `aria-current`.

   A placeholder item (TODO(client), href '') is still a menu item and still
   reachable by the arrows, but choosing it does nothing: the click is
   cancelled and the menu stays open, because closing it would look like
   something had happened. */

/** A menu item's props: the sitemap's link, plus closing the menu on a real one. */
const itemProps = (href: string, path: string, close: () => void) => ({
  ...linkProps(href, path),
  onClick: isPlaceholder(href) ? stayPut : close,
});

/** The breakpoint the sheet exists below. Kept in step with Nav.css by hand. */
const MOBILE = '(max-width: 960px)';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]';

/**
 * The desktop bar's MORE, which is now a menu rather than a promise of one.
 *
 * THE ARIA IS HONEST OR IT IS NOT THERE. The button already said
 * `aria-haspopup="menu"`, which tells a screen reader user to expect a menu
 * and to expect arrow keys to work in it. Half of that -- the popup attribute
 * with no `role="menu"` behind it, or a menu role whose items cannot be
 * reached with the arrows -- is worse than a plain list of links, because it
 * advertises an interaction that then does not happen. So: `aria-expanded` on
 * the button, `role="menu"` on the list, `role="menuitem"` on each link,
 * `role="none"` on the <li> that would otherwise contribute a list semantic
 * the menu role does not want, and Up/Down/Home/End actually implemented.
 *
 * IT DOES NOT OPEN ON HOVER, and that is a standing rule on this project
 * rather than an oversight. A hover menu has no state a touch screen can
 * express, it opens when the pointer is merely passing through, and it cannot
 * be closed except by leaving. Click to open, Escape, an outside press, or choosing an item closes it.
 *
 * FOCUS ON OPEN depends on how it was opened, which `event.detail` answers:
 * a click from a real pointer reports a click count of 1 or more, a click
 * synthesised by Enter or Space on a focused button reports 0. Keyboard opens
 * land on the first item, because a keyboard user has no other way in; mouse
 * opens leave focus on the button, because moving it would put a focus ring
 * somewhere nobody asked for. Arrow Down from the button gets in either way.
 *
 * ESCAPE RETURNS FOCUS TO THE BUTTON, with `preventScroll` for the same
 * reason the sheet's teardown uses it: the nav is not sticky, so a focus()
 * that scrolls the trigger into view throws a scrolled reader back to the top
 * of the page.
 */
function MoreMenu({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const wantFocus = useRef<'first' | 'last' | null>(null);
  const menuId = useId();

  const items = useCallback(
    () => Array.from(listRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? []),
    [],
  );

  const close = useCallback((toButton: boolean) => {
    setOpen(false);
    if (toButton) btnRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      close(true);
    };
    /* pointerdown, not click: a menu that survives until mouseup is a menu
       that flickers when you press on the page to dismiss it. The check is
       against the WRAPPER, so a press on the button itself falls through to
       the button's own toggle instead of being closed here and re-opened
       there. */
    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !wrapRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) { wantFocus.current = null; return; }
    const want = wantFocus.current;
    wantFocus.current = null;
    if (!want) return;
    const list = items();
    (want === 'first' ? list[0] : list[list.length - 1])?.focus({ preventScroll: true });
  }, [open, items]);

  const move = (from: HTMLElement, delta: number) => {
    const list = items();
    if (!list.length) return;
    const i = list.indexOf(from as HTMLAnchorElement);
    const next = i < 0 ? 0 : (i + delta + list.length) % list.length;
    list[next]?.focus({ preventScroll: true });
  };

  /* The panel is kept inside the nav row: it hangs from MORE's left edge and
     slides left only by as much as it would overflow. Measured on open and on
     resize, before paint. */
  useLayoutEffect(() => {
    const list = listRef.current;
    const row = wrapRef.current?.closest('.nav__row');
    if (!open || !list || !row) return;
    const fit = () => {
      list.style.left = '';
      const r = list.getBoundingClientRect();
      const bounds = row.getBoundingClientRect();
      const over = Math.max(0, r.right - bounds.right);
      const room = Math.max(0, r.left - bounds.left);
      if (over) list.style.left = `${parseFloat(getComputedStyle(list).left) - Math.min(over, room)}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open]);

  const onListKey = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(el, 1); break;
      case 'ArrowUp': e.preventDefault(); move(el, -1); break;
      case 'Home': e.preventDefault(); items()[0]?.focus({ preventScroll: true }); break;
      case 'End': e.preventDefault(); items().at(-1)?.focus({ preventScroll: true }); break;
      // Tab out is not trapped. A menu bar in a page header is not a dialog,
      // and the next thing after MORE is Login, which is where Tab should go.
      case 'Tab': setOpen(false); break;
      default: break;
    }
  };

  const onButtonKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const end = e.key === 'ArrowDown' ? 'first' : 'last';
    /* Already open -- which happens when it was opened by a mouse click and
       the reader then reached for the keyboard -- means `setOpen(true)` is a
       no-op, the effect below never re-runs, and a deferred focus request
       would sit in the ref unhonoured. So focus moves here instead of being
       handed to the effect. */
    if (open) {
      const list = items();
      (end === 'first' ? list[0] : list[list.length - 1])?.focus({ preventScroll: true });
      return;
    }
    wantFocus.current = end;
    setOpen(true);
  };

  return (
    <div className="nav__more-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={btnRef}
        className="nav__link nav__more"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          wantFocus.current = open ? null : (e.detail === 0 ? 'first' : null);
          setOpen((o) => !o);
        }}
        onKeyDown={onButtonKey}
      >
        <Roll>More</Roll>
        {/* The mask primitive's proof case: the chevron used to be an
            <img> baked #fffbf8, so it could only ever be that colour. As a
            mask it is `color`, which means it follows --ink, inherits the
            nav link's hover to --accent for free, and needs no light
            variant on disk. */}
        <Icon src={chevron} w={13.73} h={7.49} />
      </button>

      <ul
        id={menuId}
        ref={listRef}
        className="nav__menu"
        role="menu"
        aria-label="More"
        hidden={!open}
        onKeyDown={onListKey}
      >
        {MORE_MENU.map((l) => (
          <li key={l.label} role="none">
            <a
              {...itemProps(l.href, path, () => setOpen(false))}
              role="menuitem"
              tabIndex={-1}
              className="nav__menu-link"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Nav() {
  // Subscribed, not read off the module: this is what re-renders the nav (and
  // with it every `landing()` href and the About item's aria-current) when the
  // route changes under a pushState that never reloaded the document.
  const { path } = useRoute();
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
            <a key={l.label} {...itemProps(l.href, path, close)} className="sheet-link">{l.label}</a>
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
              {MORE_MENU.map((l) => (
                <li key={l.label}>
                  <a {...itemProps(l.href, path, close)} className="sheet-sub__link">{l.label}</a>
                </li>
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
            <a key={l.label} {...linkProps(l.href, path)} className="nav__link"><Roll>{l.label}</Roll></a>
          ))}
          <MoreMenu path={path} />
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
          {/* Two bars, not three: the long one over a short one. See Nav.css. */}
          <span /><span />
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
