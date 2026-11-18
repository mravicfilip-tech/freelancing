// The shared frame over the scene for versions 2, 4 and 5, from the UI pass plan A4, A5, A7 and the hero beat.
// The two logos sit straight on the ground at the co-branding sizes, no box. The nav is centred on the middle of the
// grid, the two phone buttons and the one primary button are on the right. A grid coordinate label sits in the bottom
// left, and the hero headline in the bottom left block.
// Mount it inside the pinned stage so it stays on screen for the whole scroll.
//
// tone picks the colour set, ink on a light scene and white on the dark servis beat. A version whose scene changes under
// the type flips data-tone on the root through rootRef, so no React render runs per frame. The shell also drives the
// white wordmark on the dark span and the hero block through the class names below.

import { useEffect, useRef, useState, type MouseEvent, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { hero, SITE } from '../content';
import { frame, hero2 } from '../story2/copy';
import { TALL_QUERY } from '../story2/tall';
import { BtnInner, Fill } from '../story2/shell/ui';
import { goHome } from '../scroll/useScrollStory';
import { toChapter } from '../story2/chapters';
import { ServicesMega, ShopMega, ShopSheetItem, type LinkFn } from './ShopNav';
import './heroframe.css';

export type FrameTone = 'ink' | 'white';

// ch names the story chapter a link stands for. In the story the nav's bar sits under that link while its chapter is on
// screen, and under Početna where the chapter has no link, see StoryShell.
// local marks a page of this site. Filip 18 November, "remap it to new home page + shop with categories" and then "fix this menu, remap it,
// add new links, show categories, create a mega menu". Početna is the story, Prodavnica the shop with its categories in a mega panel, Usluge
// a panel of Najam, Servis, Hitan servis and Polovni, Kompanija the story's company chapter, Kontakt the form (ui/ShopNav.tsx). ch is the
// story chapter or chapters a link stands for, by spaces. The shop's own frame reads the same lists, see shop/ShopFrame.tsx.
export type NavLink = { label: string; href: string; current?: boolean; ch?: string; local?: boolean; mega?: 'shop' | 'services' };
export const links: NavLink[] = [
  { label: 'Početna', href: '/', current: true, ch: 'home' },
  { label: 'Prodavnica', href: '/prodavnica', ch: 'prodaja', local: true, mega: 'shop' },
  { label: 'Usluge', href: '/#najam', ch: 'najam servis', local: true, mega: 'services' },
  { label: 'Kompanija', href: '/#kompanija', ch: 'kompanija', local: true },
  { label: 'Kontakt', href: '/kontakt', local: true },
];
// the menu sheet of a phone has no panels, so it names every place on its own, Polovni the only one on ekotehnika.rs
export const sheetLinks: NavLink[] = [
  links[0],
  links[1],
  { label: 'Najam', href: '/#najam', local: true },
  { label: 'Servis', href: '/#servis', local: true },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  links[3],
  links[4],
];
export const hrefOf = (l: NavLink) => (l.local ? l.href : `${SITE}${l.href}`);

// A link to a chapter of the story, /#najam, glides there at once when the story is the page, and the menu sheet shuts first. From any other
// page it is a plain link and the story follows the hash once it is pinned (story2/chapters.ts).
export const onChapter = (href: string, after?: () => void) => (e: MouseEvent<HTMLAnchorElement>) => {
  const ch = href.startsWith('/#') ? href.slice(2) : '';
  if (!ch || window.location.pathname !== '/' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.history.replaceState(null, '', href);
  after?.();
  toChapter(ch);
};

const plain: LinkFn = (href, children, className, current) => (
  <a href={href} className={className} aria-current={current ? 'page' : undefined} onClick={onChapter(href)}>
    {children}
  </a>
);

// Past the pinned story, to the content that follows it. Falls back to the bottom of the page.
function skip(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  // the root carries the same attribute, so the marked section is looked up inside the body
  const next = document.body.querySelector<HTMLElement>('[data-after-story]');
  const y = next ? next.getBoundingClientRect().top + window.scrollY : document.documentElement.scrollHeight;
  window.scrollTo({ top: y, behavior: 'auto' });
  if (next) {
    next.tabIndex = -1;
    next.focus({ preventScroll: true });
  }
}

// The menu sheet of the tall layout, the phone version, briefs/mobile/plan.md. It stands over the whole stage with the six links of the nav
// and both phone numbers. Escape and the close button shut it, focus goes to the close button on opening, stays inside the sheet while it is
// open and returns to the menu button on closing. On a screen that is not tall the bar and the sheet are display none, see heroframe.css.
export function useMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = sheet.current;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (!el.contains(at)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && at === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // the story behind the sheet must not scroll while the sheet is up, a wheel or a thumb on it goes nowhere, unless the sheet itself is
    // taller than the screen, the shop's categories open, then it scrolls itself and never the page (overscroll-behavior in heroframe.css)
    const hold = (e: Event) => {
      if (el && el.scrollHeight > el.clientHeight + 1) return;
      e.preventDefault();
    };
    document.addEventListener('keydown', key);
    el?.addEventListener('wheel', hold, { passive: false });
    el?.addEventListener('touchmove', hold, { passive: false });
    return () => {
      document.removeEventListener('keydown', key);
      el?.removeEventListener('wheel', hold);
      el?.removeEventListener('touchmove', hold);
      button.current?.focus({ preventScroll: true });
    };
  }, [open]);

  // turned to a screen that is not tall, the sheet is shut
  useEffect(() => {
    const mq = window.matchMedia(TALL_QUERY);
    const on = () => {
      if (!mq.matches) setOpen(false);
    };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return { open, setOpen, button, sheet, close };
}

export function HeroFrame({ tone, toneBottom, rootRef }: { tone: FrameTone; toneBottom?: FrameTone; rootRef?: Ref<HTMLDivElement> }) {
  const menu = useMenu();
  return (
    <div className="hf" ref={rootRef} data-tone={tone} data-tone-bottom={toneBottom ?? tone}>
      <a className="hf-skip" href="#sadrzaj" onClick={skip}>
        Preskoči animaciju
      </a>

      <header className="hf-top">
        {/* the logos go to this site's own first screen, not ekotehnika.rs, Filip 5 November, "link the logo to this vercel link to take to
            home screen 1" */}
        <a className="hf-logo" href="/" onClick={goHome}>
          <img src="/brand/linde-mh.svg" width={160} height={96} alt="Linde Material Handling" />
          {/* on a dark ground the wordmark crossfades to the white file, the Linde logo stays as supplied */}
          <span className="hf-wm">
            <img className="wm-ink" src="/brand/ekotehnika.svg" width={160} height={33} alt="Ekotehnika, početna strana" />
            <img className="wm-white" src="/brand/ekotehnika-white.svg" width={160} height={33} alt="" aria-hidden="true" />
          </span>
        </a>
        <nav className="hf-nav" aria-label="Glavna navigacija">
          <ul>
            {links.map((l) => (
              <li key={l.label} className={l.mega ? 'hf-has-sub' : undefined}>
                <a href={hrefOf(l)} aria-current={l.current ? 'page' : undefined} data-ch={l.ch} onClick={onChapter(l.href)}>
                  {l.label}
                </a>
                {l.mega === 'shop' ? <ShopMega link={plain} /> : l.mega === 'services' ? <ServicesMega link={plain} /> : null}
              </li>
            ))}
          </ul>
          <span className="hf-nav-bar" aria-hidden="true" />
        </nav>
        <div className="hf-actions">
          <a className="btn btn-secondary btn-phone" href={hero.sales.tel} data-cta="call-sales" data-wipe="0">
            <BtnInner>
              {hero.sales.label} <span className="num">{hero.sales.number}</span>
            </BtnInner>
          </a>
          <a className="btn btn-secondary btn-phone" href={hero.service.tel} data-cta="call-service" data-wipe="1">
            <BtnInner>
              {hero.service.label} <span className="num">{hero.service.number}</span>
            </BtnInner>
          </a>
          {/* the quote button is the one primary on every beat, a beat's own buttons are secondaries */}
          <a className="btn btn-primary hf-quote-top" href={hero.quote.href} data-cta="quote" data-wipe="2">
            <BtnInner>{hero.quote.label}</BtnInner>
          </a>
        </div>
      </header>

      <p className="hf-coords">
        <span>{frame.coords}</span> <span>{frame.place}</span>
      </p>

      <div className="hf-bottom">
        {/* the block's top rule only. Its words, the Linde partner line with the two flags, are gone, the client's ticket of
            3 November, "Ne čitljivo, responsiveness jebe, obrisati", Kompanija says the same under its title */}
        <p className="s2-marker" data-wipe="0" data-rule="t" aria-hidden="true" />
        <h1 className="hf-h1">
          <span className="ln" data-wipe="1">
            {hero2.title}
          </span>
        </h1>
        <Fill text={hero2.lede} className="hf-lede" />
        <a className="btn btn-secondary hf-quote" href={hero2.quote.href} data-cta="quote" data-wipe="3">
          <BtnInner>{hero2.quote.label}</BtnInner>
        </a>
      </div>

      {/* The bar at the foot of a tall screen, 64px, the menu, the Hitan servis call and the quote. Not drawn on any other screen. It is drawn into
          the body and fixed to the screen, so it stays at the foot of what the phone shows wherever the page is and whatever the browser's own
          bars do (Filip, 4 November, "Bottom part is not sticky"). It hides while the menu sheet is open. */}
      {typeof document === 'undefined' ? null : createPortal(
      <div className="hf-bar" data-menu={menu.open ? '' : undefined}>
        <button
          type="button"
          className="btn btn-secondary hf-bar-menu"
          ref={menu.button}
          aria-expanded={menu.open}
          aria-controls="hf-menu"
          aria-label="Meni"
          onClick={() => menu.setOpen(true)}
        >
          <BtnInner>Meni</BtnInner>
        </button>
        <a className="btn btn-secondary btn-phone hf-bar-call" href={hero.service.tel} data-cta="call-service" aria-label={`${hero.service.label}, ${hero.service.number}`}>
          <BtnInner>{hero.service.label}</BtnInner>
        </a>
        <a className="btn btn-primary hf-bar-quote" href={hero.quote.href} data-cta="quote">
          <BtnInner>{hero.quote.label}</BtnInner>
        </a>
      </div>,
      document.body,
      )}

      <div className="hf-menu" id="hf-menu" ref={menu.sheet} role="dialog" aria-modal="true" aria-label="Meni" hidden={!menu.open}>
        <div className="hf-menu-head">
          <span className="hf-menu-name">Meni</span>
          <button type="button" className="btn btn-secondary hf-menu-close" ref={menu.close} aria-label="Zatvori meni" onClick={() => menu.setOpen(false)}>
            <BtnInner>Zatvori</BtnInner>
          </button>
        </div>
        <ul className="hf-menu-links">
          {sheetLinks.map((l) =>
            l.mega === 'shop' ? (
              <ShopSheetItem label={l.label} href={hrefOf(l)} current={l.current} link={plain} key={l.label} />
            ) : (
              <li key={l.label}>
                <a href={hrefOf(l)} aria-current={l.current ? 'page' : undefined} onClick={onChapter(l.href, () => menu.setOpen(false))}>
                  {l.label}
                </a>
              </li>
            ),
          )}
        </ul>
        <div className="hf-menu-calls">
          {[hero.sales, hero.service].map((p) => (
            <a href={p.tel} data-cta={p === hero.sales ? 'call-sales' : 'call-service'} key={p.tel}>
              <span className="lab">{p.label}</span>
              <span className="num">{p.number}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
