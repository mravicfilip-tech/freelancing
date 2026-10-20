// Variant switcher, the studio's reference copy. DOCTRINE.md, trigger "Variant switcher".
//
// A floating bar that moves between the variants of one page and the baseline they compete with.
// Copy this file into the app (for example src/components/dev/VariantSwitcher.tsx), mount it once at
// the root inside the router, and pass it the list and the current location. It renders nothing on a
// route that is not in the list, so one mount covers every variant set.
//
//   <VariantSwitcher
//     variants={[{ key: '0', label: 'Baseline', short: 'Base', href: '/lobby?compare' }, { key: '1', label: 'Social lagoon', href: '/variants/1' }]}
//     location={useLocation()}
//     navigate={useNavigate()}
//     indexHref="/variants"
//   />
//
// An entry matches when the path is the same and every query key in its href is present, with the
// same value when the href gives one. A baseline at /lobby?compare shows the bar only when reached
// from the switcher, and options of one page such as ?btn=1 to ?btn=5 are entries of their own.
// Keys, when no field has focus and no modifier is held. [ and ] step, a digit jumps to that entry.
// Several option sets on one page, such as a hero pick and a card pick, mount one bar each, stacked
// with `bottom`, and every bar but the first sets `keyboard={false}` so a digit moves one set only.
// It hides itself for automated browsers, so shots and variant boards stay clean. Add ?switcher to
// the URL to show it in a shot. React only, no Tailwind, no router import, its own scoped styles.

import { useEffect, useMemo, useState, type MouseEvent } from 'react';

export type SwitcherVariant = {
  /** The digit that jumps to it. Defaults to its position, starting at 1. */
  key?: string;
  label: string;
  /** What its button says. Defaults to its key, so a baseline can read Base. */
  short?: string;
  href: string;
  /** One line on what the variant is, shown for the current one and as a tooltip. */
  note?: string;
};

type Props = {
  variants: SwitcherVariant[];
  location: { pathname: string; search: string };
  /** The app's router navigate. Without it the bar does a full page load. */
  navigate?: (href: string) => void;
  /** A page that lists every variant, linked from the bar when given. */
  indexHref?: string;
  /** Text on the bar's handle. */
  title?: string;
  /** Distance from the bottom of the viewport in px, so several bars can stack. Default 16. */
  bottom?: number;
  /** Whether [ ] and the digits move this bar. Default true. Turn it off on every stacked bar but one. */
  keyboard?: boolean;
};

const STORE = 'studio-variant-switcher-collapsed';

const CSS = `
.vsw{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;display:flex;align-items:center;gap:8px;padding:6px;border-radius:16px;
background:rgba(11,6,20,.92);border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 24px rgba(0,0,0,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
font:600 14px/20px system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;max-width:calc(100vw - 32px)}
.vsw *{box-sizing:border-box}
.vsw-handle{padding:0 8px 0 10px;color:rgba(255,255,255,.72);white-space:nowrap}
.vsw-list{display:flex;gap:4px;margin:0;padding:0;list-style:none}
.vsw-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:36px;height:36px;padding:0 10px;border-radius:10px;border:0;
background:rgba(255,255,255,.08);color:rgba(255,255,255,.86);font:inherit;text-decoration:none;cursor:pointer;white-space:nowrap}
.vsw-btn:hover{background:rgba(255,255,255,.16);color:#fff}
.vsw-btn[aria-current="page"]{background:#fff;color:#0b0614}
.vsw-btn:focus-visible{outline:2px solid #b47cff;outline-offset:2px}
.vsw-now{display:flex;flex-direction:column;min-width:0;max-width:340px;padding:0 6px}
.vsw-now b{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vsw-now span{font-weight:500;color:rgba(255,255,255,.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vsw-sep{width:1px;align-self:stretch;margin:4px 2px;background:rgba(255,255,255,.14)}
.vsw-icon{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@media (max-width:900px){.vsw-now{display:none}}
`;

function matches(v: SwitcherVariant, loc: { pathname: string; search: string }) {
  const url = new URL(v.href, 'http://x');
  if (url.pathname !== loc.pathname) return false;
  const have = new URLSearchParams(loc.search);
  // A key with a value must match it, so ?btn=1 and ?btn=2 are two entries. A bare key only has to be there.
  for (const [k, v] of url.searchParams) if (!have.has(k) || (v !== '' && have.get(k) !== v)) return false;
  return true;
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(STORE) === '1';
  } catch {
    return false;
  }
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="vsw-icon" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function VariantSwitcher({ variants, location, navigate, indexHref, title = 'Variants', bottom = 16, keyboard = true }: Props) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const hidden = useMemo(() => typeof navigator !== 'undefined' && navigator.webdriver && !new URLSearchParams(location.search).has('switcher'), [location.search]);
  const current = variants.findIndex((v) => matches(v, location));
  const keyOf = (v: SwitcherVariant, i: number) => v.key ?? String(i + 1);

  const go = (href: string) => (navigate ? navigate(href) : window.location.assign(href));
  const step = (d: number) => go(variants[(current + d + variants.length) % variants.length].href);

  useEffect(() => {
    if (current < 0 || hidden || !keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === '[') step(-1);
      else if (e.key === ']') step(1);
      else {
        const i = variants.findIndex((v, n) => keyOf(v, n) === e.key);
        if (i >= 0 && i !== current) go(variants[i].href);
        else return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (current < 0 || hidden) return null;

  const toggle = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(STORE, c ? '0' : '1');
      } catch {
        /* the choice just is not remembered */
      }
      return !c;
    });
  };
  const link = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!navigate || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href);
  };
  const now = variants[current];

  return (
    <nav className="vsw" aria-label={`Design variants, ${title}`} style={{ bottom }}>
      <style>{CSS}</style>
      {collapsed ? (
        <button type="button" className="vsw-btn" onClick={toggle} aria-expanded={false} title="Show the variant switcher">
          {title} {keyOf(now, current)} of {variants.length}
          <Icon d="M6 15l6-6 6 6" />
        </button>
      ) : (
        <>
          <span className="vsw-handle">{title}</span>
          <button type="button" className="vsw-btn" onClick={() => step(-1)} aria-label="Previous variant" title="Previous, [">
            <Icon d="M15 18l-6-6 6-6" />
          </button>
          <ul className="vsw-list">
            {variants.map((v, i) => (
              <li key={v.href}>
                <a
                  href={v.href}
                  onClick={link(v.href)}
                  className="vsw-btn"
                  aria-current={i === current ? 'page' : undefined}
                  aria-label={`${v.label}${v.note ? `, ${v.note}` : ''}`}
                  title={`${v.label}${v.note ? `. ${v.note}` : ''} (key ${keyOf(v, i)})`}
                >
                  {v.short ?? keyOf(v, i)}
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className="vsw-btn" onClick={() => step(1)} aria-label="Next variant" title="Next, ]">
            <Icon d="M9 18l6-6-6-6" />
          </button>
          <span className="vsw-sep" aria-hidden="true" />
          <span className="vsw-now" aria-live="polite">
            <b>
              {now.short ? '' : `${keyOf(now, current)}. `}
              {now.label}
            </b>
            {now.note && <span>{now.note}</span>}
          </span>
          {indexHref && (
            <a href={indexHref} onClick={link(indexHref)} className="vsw-btn" aria-label="All variants" title="All variants">
              <Icon d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
            </a>
          )}
          <button type="button" className="vsw-btn" onClick={toggle} aria-expanded={true} aria-label="Hide the variant switcher" title="Hide">
            <Icon d="M6 9l6 6 6-6" />
          </button>
        </>
      )}
    </nav>
  );
}
