// The frame of a shop page, the homepage's own top row in flow, not over a scene. The two logos to the homepage, the nav with Prodavnica
// or Kontakt as the page and the shop's categories under Prodavnica, the two phone buttons and the one primary, the same classes as HeroFrame so it looks the same (heroframe.css).
// On a screen held upright the row is the logos only, 120px, and scrolls away, and the bar at the foot has the menu, the call and the
// quote, the homepage's phone bar. The menu sheet stands over the page.
import { createPortal } from 'react-dom';
import { hero } from '../content';
import { BtnInner } from '../story2/shell/ui';
import { hrefOf, links, sheetLinks, useMenu } from '../ui/HeroFrame';
import { ServicesMega, ShopMega, ShopSheetItem, type LinkFn } from '../ui/ShopNav';
import { Link } from './route';
import '../ui/heroframe.css';

// a link inside the shop, the shop's own Link, a page of the shop opens without a reload
const shopLink: LinkFn = (href, children, className, current) =>
  href.startsWith('/') ? (
    <Link href={href} className={className} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );

// page is the label of the nav link the page stands under, sheet the row of the phone's menu sheet when it differs, Najam under Usluge
export function ShopFrame({ page, sheet: row = page }: { page: string; sheet?: string }) {
  const menu = useMenu();
  const nav = links.map((l) => ({ ...l, current: l.label === page }));
  const sheet = sheetLinks.map((l) => ({ ...l, current: l.label === row }));
  const anchor = (l: (typeof nav)[number], className?: string) =>
    l.local ? (
      <Link href={hrefOf(l)} aria-current={l.current ? 'page' : undefined} className={className}>
        {l.label}
      </Link>
    ) : l.href === '/' ? (
      <a href="/" className={className}>
        {l.label}
      </a>
    ) : (
      <a href={hrefOf(l)} className={className}>
        {l.label}
      </a>
    );
  return (
    <div className="hf sp-hf" data-tone="ink">
      <a className="hf-skip" href="#sp-main">
        Preskoči na sadržaj
      </a>
      <header className="hf-top">
        <a className="hf-logo" href="/" aria-label="Ekotehnika, početna strana">
          <img src="/brand/linde-mh.svg" width={160} height={96} alt="Linde Material Handling" />
          <span className="hf-wm">
            <img className="wm-ink" src="/brand/ekotehnika.svg" width={160} height={33} alt="Ekotehnika" />
          </span>
        </a>
        <nav className="hf-nav" aria-label="Glavna navigacija">
          <ul>
            {nav.map((l) => (
              <li key={l.label} className={l.mega ? 'hf-has-sub' : undefined}>
                {anchor(l)}
                {l.mega === 'shop' ? <ShopMega link={shopLink} /> : l.mega === 'services' ? <ServicesMega link={shopLink} /> : null}
              </li>
            ))}
          </ul>
        </nav>
        <div className="hf-actions">
          <a className="btn btn-secondary btn-phone" href={hero.sales.tel} data-cta="call-sales">
            <BtnInner>
              {hero.sales.label} <span className="num">{hero.sales.number}</span>
            </BtnInner>
          </a>
          <a className="btn btn-secondary btn-phone" href={hero.service.tel} data-cta="call-service">
            <BtnInner>
              {hero.service.label} <span className="num">{hero.service.number}</span>
            </BtnInner>
          </a>
          <Link className="btn btn-primary hf-quote-top" href="/kontakt?tema=kupovina" data-cta="quote">
            <BtnInner>{hero.quote.label}</BtnInner>
          </Link>
        </div>
      </header>

      {typeof document === 'undefined'
        ? null
        : createPortal(
            // the homepage's phone bar exactly, it once also carried sp-bar, the filter bar's class, whose display flex drew it on every
            // screen under the footer (Filip 18 November, "what is this menu here remove it")
            <div className="hf-bar" data-menu={menu.open ? '' : undefined}>
              <button
                type="button"
                className="btn btn-secondary hf-bar-menu"
                ref={menu.button}
                aria-expanded={menu.open}
                aria-controls="sp-menu"
                aria-label="Meni"
                onClick={() => menu.setOpen(true)}
              >
                <BtnInner>Meni</BtnInner>
              </button>
              <a className="btn btn-secondary btn-phone hf-bar-call" href={hero.sales.tel} data-cta="call-sales" aria-label={`${hero.sales.label}, ${hero.sales.number}`}>
                <BtnInner>{hero.sales.label}</BtnInner>
              </a>
              <Link className="btn btn-primary hf-bar-quote" href="/kontakt?tema=kupovina" data-cta="quote">
                <BtnInner>{hero.quote.label}</BtnInner>
              </Link>
            </div>,
            document.body,
          )}

      <div className="hf-menu sp-menu" id="sp-menu" ref={menu.sheet} role="dialog" aria-modal="true" aria-label="Meni" hidden={!menu.open}>
        <div className="hf-menu-head">
          <span className="hf-menu-name">Meni</span>
          <button type="button" className="btn btn-secondary hf-menu-close" ref={menu.close} aria-label="Zatvori meni" onClick={() => menu.setOpen(false)}>
            <BtnInner>Zatvori</BtnInner>
          </button>
        </div>
        <ul className="hf-menu-links" onClick={(e) => (e.target as HTMLElement).closest('a') && menu.setOpen(false)}>
          {sheet.map((l) =>
            l.mega === 'shop' ? (
              <ShopSheetItem label={l.label} href={hrefOf(l)} current={l.current} link={shopLink} key={l.label} />
            ) : (
              <li key={l.label}>{anchor(l)}</li>
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
