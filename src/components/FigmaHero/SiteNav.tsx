import { LangPicker } from './LangPicker';
import { ThemeToggle } from './ThemeToggle';
import { Chevron, PresaleButton, blobOrigin } from './FigmaHero';
import { useNavCondense } from './useNavCondense';
import { useNavMenu } from './useNavMenu';

/**
 * The bar is a table of contents for the page: one item per section, in the order they are read,
 * spread across its whole length rather than bunched at the end.
 *
 * Six, not seven — the FAQs come last on the page and are the one section a reader reaches by
 * getting there rather than by aiming for it, so dropping them buys the other six the design's
 * own 48px rhythm back and keeps the row on screen further down. The section itself is untouched,
 * and `#faq` still stops clear of the bar for anyone who arrives on the link.
 *
 * Every href resolves to a section on the home page (prefixed with `base` off it). The whitepaper is not one of them — it has no
 * anchor to land on — so it keeps its place in the footer, alongside the audits it belongs with.
 */
const NAV_LINKS = [
  ['Intro', '#hero'],
  ['How it works', '#how-it-works'],
  ['Ecosystem', '#ecosystem'],
  ['Tokenomics', '#tokenomics'],
  ['Roadmap', '#roadmap'],
  ['How to buy', '#how-to-buy'],
] as const;

/** The phone nav's trigger: three rules that cross when the panel is open. */
function MenuButton({ open, onClick, buttonRef }: { open: boolean; onClick: () => void; buttonRef: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="fh__burger"
      aria-expanded={open}
      aria-controls="fh-menu"
      aria-label={open ? 'Close menu' : 'Open menu'}
      onClick={onClick}
    >
      <span className="fh__burgerBars" aria-hidden="true">
        <i />
        <i />
      </span>
    </button>
  );
}


/**
 * The fixed nav bar and the phone sheet it opens, shared by every page. On the home page `base` is
 * empty and the links scroll to its sections; a page of its own passes '/' so they lead back there.
 * The bar reads its colours from the hero's token block, so a host other than `.fh` carries
 * `.fh-scope` (see FigmaHero.css).
 */
export function SiteNav({ base = '' }: { base?: string }) {
  const { condensed, scrolling } = useNavCondense();
  const menu = useNavMenu();

  return (
    <>
      <header className="fh__nav" data-node-id="2346:110" data-condensed={condensed || undefined} data-scrolling={scrolling || undefined} data-menu={menu.open || undefined}>
        <a className="fh__brand" href="/">
          <img src="/figma/logo.svg" alt="" width={33} height={17} />
          <span>Remittix</span>
        </a>
        <div className="fh__linksWrap">
          <nav className="fh__links" aria-label="Primary">
            {NAV_LINKS.map(([label, href]) => (
              <a key={label} href={base + href}>{label}</a>
            ))}
          </nav>
        </div>
        <div className="fh__navRight">
          <ThemeToggle />
          <LangPicker />
          <div className="fh__navButtons">
            <PresaleButton href={`${base}#presale`} />
            <a className="fh__btn fh__btn--ghost" href={`${base}#login`} onPointerEnter={blobOrigin} onPointerLeave={blobOrigin}>
              Login
            </a>
          </div>
          <MenuButton open={menu.open} onClick={() => menu.setOpen((v) => !v)} buttonRef={menu.trigger} />
        </div>
      </header>

      {/* The phone menu is a sheet, not a dropdown: it stands below the bar and runs to the foot of
          the screen, so what the bar drops on a narrow viewport — the links, both account actions
          and the language — gets the room it has on a desktop. It sits outside the bar and under it
          in the stack, so the pill and its close button stay legible over the frosted page.
          Join Presale stays in the bar, so the presale is never behind a tap. */}
      <div
        className="fh__scrim"
        data-open={menu.open || undefined}
        aria-hidden="true"
        onClick={() => menu.close(false)}
      />
      <div
        className="fh__menu"
        id="fh-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        ref={menu.panel}
        data-open={menu.open || undefined}
        inert={!menu.open}
      >
        {/* The two settings sit at the head of the sheet, not its foot. Below six links and two
            buttons they were off the bottom of a phone: changing the theme meant opening the menu
            and then scrolling it, which is a long way to go for a switch. */}
        <div className="fh__menuTop" style={{ '--i': 0 } as React.CSSProperties}>
          <span className="fh__menuFootLabel">Appearance</span>
          <ThemeToggle />
          <span className="fh__menuTopSep" aria-hidden="true" />
          <LangPicker />
        </div>

        <nav className="fh__menuLinks" aria-label="Primary">
          {NAV_LINKS.map(([label, href], i) => (
            <a
              key={label}
              href={base + href}
              style={{ '--i': i + 1 } as React.CSSProperties}
              onClick={() => menu.close(false)}
            >
              <span className="fh__menuIndex" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="fh__menuLabel">{label}</span>
              <Chevron direction="right" />
            </a>
          ))}
        </nav>

        <div className="fh__menuActions" style={{ '--i': NAV_LINKS.length + 1 } as React.CSSProperties}>
          <a
            className="fh__btn fh__btn--primary"
            href={`${base}#register`}
            onPointerEnter={blobOrigin}
            onPointerLeave={blobOrigin}
            onClick={() => menu.close(false)}
          >
            Create account
            <Chevron direction="right" />
          </a>
          <a
            className="fh__btn fh__btn--ghost"
            href={`${base}#login`}
            onPointerEnter={blobOrigin}
            onPointerLeave={blobOrigin}
            onClick={() => menu.close(false)}
          >
            Login
          </a>
        </div>

      </div>
    </>
  );
}
