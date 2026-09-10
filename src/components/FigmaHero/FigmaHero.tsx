import { useEffect, useRef, useState } from 'react';
import { LangPicker } from './LangPicker';
import { ThemeToggle } from './ThemeToggle';
import { SplineSlide } from './SplineSlide';
import { HeroPlanet } from '../HeroPlanet';
import { Bars } from './Bars';
import { useHeroEntrance } from './useHeroEntrance';
import { useNavCondense } from './useNavCondense';
import { useNavMenu } from './useNavMenu';
import { PLANET_ENABLED, PLANET_STATIC } from '../../heroVariant';
import './FigmaHero.css';

/**
 * Hero implemented from the Figma design "Remittix Redesign", node 2346:102 ("Hero Banner v1").
 * Layout, type, colours and copy follow the design; the countdown and figures are live-able.
 */

const PRESALE_END = Date.UTC(2026, 9, 15, 12, 0, 0); // 15 Oct 2026 12:00 UTC
const USD_RAISED = 32_000_000;
const USD_TARGET = 36_000_000;
const TOKENS_SOLD = 8_885_000;
const TOKENS_TARGET = 9_000_000;
const STAGE = '10/10';
const PROGRESS = 0.22; // filled share of the progress bar

/**
 * The bar is a table of contents for the page: one item per section, in the order they are read,
 * spread across its whole length rather than bunched at the end.
 *
 * Six, not seven — the FAQs come last on the page and are the one section a reader reaches by
 * getting there rather than by aiming for it, so dropping them buys the other six the design's
 * own 48px rhythm back and keeps the row on screen further down. The section itself is untouched,
 * and `#faq` still stops clear of the bar for anyone who arrives on the link.
 *
 * Every href resolves to a section on this page. The whitepaper is not one of them — it has no
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

/** Live countdown to `target`, ticking every second. All zeros once the target has passed. */
function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, target - now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    days: pad(Math.floor(left / 86_400_000)),
    hours: pad(Math.floor((left % 86_400_000) / 3_600_000)),
    minutes: pad(Math.floor((left % 3_600_000) / 60_000)),
    seconds: pad(Math.floor((left % 60_000) / 1000)),
    ended: left === 0,
  };
}

export function Chevron({ direction = 'down' }: { direction?: 'down' | 'right' | 'left' }) {
  return <img className={`fh__chevron fh__chevron--${direction}`} src="/figma/chevron.svg" alt="" width={11} height={6} />;
}

/**
 * Button hover, variant 03 from public/button-hovers.html: the hover circle grows from the point
 * the pointer entered and shrinks back to the point it left. The anchor's --x/--y position the
 * circle; the CSS in FigmaHero.css does the rest.
 */
export function blobOrigin(e: React.PointerEvent<HTMLAnchorElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
}

export function PresaleButton({ wide = false }: { wide?: boolean }) {
  return (
    <a
      className={`fh__btn fh__btn--primary${wide ? ' fh__btn--wide' : ''}`}
      href="#presale"
      onPointerEnter={blobOrigin}
      onPointerLeave={blobOrigin}
    >
      Join Presale
      <Chevron direction="right" />
    </a>
  );
}

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

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="fh__unit">
      <span className="fh__digits">
        {/* Keyed on the value so each change remounts the digits and replays the tick animation. */}
        <span key={value} className="fh__digitsValue">{value}</span>
      </span>
      <span className="fh__unitLabel">{label}</span>
    </div>
  );
}

/** The hero graphic: one slide per visual. The corridors globe, the bars from the Figma design,
 *  then the Spline scene — which is fetched only once a reader actually reaches it. */
const SLIDES = [
  { id: 'globe', label: 'Payment corridors around the world' },
  { id: 'bars', label: 'Presale figures' },
  { id: 'spline', label: 'Remittix in 3D' },
] as const;

function GraphicSlides({ index }: { index: number }) {
  const globeHost = useRef<HTMLDivElement>(null);
  return (
    <div className="fh__viewport" role="region" aria-roledescription="carousel" aria-label="Hero graphic">
      <div
        ref={globeHost}
        className="fh__slide fh__slide--globe"
        data-slide="globe"
        data-active={index === 0 || undefined}
        aria-hidden={index !== 0}
      >
        {PLANET_ENABLED && (
          <HeroPlanet hostRef={globeHost} variant="figma-corridors" layout="capture" scroll={false} forceStatic={PLANET_STATIC} active={index === 0} />
        )}
      </div>
      <div className="fh__slide" data-slide="bars" data-active={index === 1 || undefined} aria-hidden={index !== 1}>
        <Bars active={index === 1} />
      </div>
      <div className="fh__slide" data-slide="spline" data-active={index === 2 || undefined} aria-hidden={index !== 2}>
        <SplineSlide active={index === 2} />
      </div>
    </div>
  );
}

/** Segment bars (the active one stretches), a counter, and a pair of arrows. */
function SlideControls({ index, onChange }: { index: number; onChange: (next: number) => void }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="fh__sliderControls">
      <div className="fh__segments" role="tablist" aria-label="Choose slide">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={slide.label}
            className="fh__segment"
            data-active={i === index || undefined}
            onClick={() => onChange(i)}
          >
            <span />
          </button>
        ))}
      </div>
      <span className="fh__counter" aria-live="polite">
        <span className="fh__counterCurrent">{pad(index + 1)}</span>
        <span className="fh__counterSep" aria-hidden="true">/</span>
        {pad(SLIDES.length)}
      </span>
      <div className="fh__arrows">
        <button type="button" className="fh__sliderArrow" onClick={() => onChange(index - 1)} aria-label="Previous slide">
          <Chevron direction="left" />
        </button>
        <button type="button" className="fh__sliderArrow" onClick={() => onChange(index + 1)} aria-label="Next slide">
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}

export function FigmaHero() {
  const { days, hours, minutes, seconds, ended } = useCountdown(PRESALE_END);
  const [slide, setSlide] = useState(0);
  const goToSlide = (next: number) => setSlide((next + SLIDES.length) % SLIDES.length);
  const root = useRef<HTMLElement>(null);
  const condensed = useNavCondense();
  const menu = useNavMenu();
  useHeroEntrance(root, {
    progress: PROGRESS,
    usd: USD_RAISED,
    usdTarget: USD_TARGET,
    tokens: TOKENS_SOLD,
    tokensTarget: TOKENS_TARGET,
  });
  const whole = (n: number) => n.toLocaleString('en-US');
  const usd = `${whole(USD_RAISED)}/${whole(USD_TARGET)}`;
  const tokens = `${whole(TOKENS_SOLD)}/${whole(TOKENS_TARGET)}`;

  return (
    <section ref={root} className="fh" id="hero" data-node-id="2346:102" data-entrance="pending">
      <div className="fh__frame" aria-hidden="true" />

      {/* The nav is fixed, so a spacer stands in for it in the hero's flow. */}
      <div className="fh__navSpacer" aria-hidden="true" />

      <header className="fh__nav" data-node-id="2346:110" data-condensed={condensed || undefined} data-menu={menu.open || undefined}>
        <a className="fh__brand" href="/">
          <img src="/figma/logo.svg" alt="" width={33} height={17} />
          <span>Remittix</span>
        </a>
        <div className="fh__linksWrap">
          <nav className="fh__links" aria-label="Primary">
            {NAV_LINKS.map(([label, href]) => (
              <a key={label} href={href}>{label}</a>
            ))}
          </nav>
        </div>
        <div className="fh__navRight">
          <ThemeToggle />
          <LangPicker />
          <div className="fh__navButtons">
            <PresaleButton />
            <a className="fh__btn fh__btn--ghost" href="#login" onPointerEnter={blobOrigin} onPointerLeave={blobOrigin}>
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
        <nav className="fh__menuLinks" aria-label="Primary">
          {NAV_LINKS.map(([label, href], i) => (
            <a
              key={label}
              href={href}
              style={{ '--i': i } as React.CSSProperties}
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

        <div className="fh__menuActions" style={{ '--i': NAV_LINKS.length } as React.CSSProperties}>
          <a
            className="fh__btn fh__btn--primary"
            href="#register"
            onPointerEnter={blobOrigin}
            onPointerLeave={blobOrigin}
            onClick={() => menu.close(false)}
          >
            Create account
            <Chevron direction="right" />
          </a>
          <a
            className="fh__btn fh__btn--ghost"
            href="#login"
            onPointerEnter={blobOrigin}
            onPointerLeave={blobOrigin}
            onClick={() => menu.close(false)}
          >
            Login
          </a>
        </div>

        <div className="fh__menuFoot" style={{ '--i': NAV_LINKS.length + 1 } as React.CSSProperties}>
          <span className="fh__menuFootLabel">Appearance</span>
          <ThemeToggle />
        </div>
        <div className="fh__menuFoot" style={{ '--i': NAV_LINKS.length + 2 } as React.CSSProperties}>
          <span className="fh__menuFootLabel">Language</span>
          <LangPicker />
        </div>
      </div>

      <div className="fh__main" data-node-id="2346:142">
        <div className="fh__intro">
          <div className="fh__introText">
            <h1 className="fh__title">
              <span className="fh__line">
                <span className="fh__lineInner">Cross-border</span>
              </span>
              <span className="fh__line">
                <span className="fh__lineInner">
                  Payments <span className="fh__titleMuted">Reinvented</span>
                </span>
              </span>
            </h1>
            <p className="fh__body">
              Remittix enables users to pay fiat into any bank account around the world using crypto,
              by just simply connecting your wallet.
            </p>
          </div>
          <PresaleButton wide />
        </div>
        <div className="fh__graphic">
          <GraphicSlides index={slide} />
        </div>
        <SlideControls index={slide} onChange={goToSlide} />
      </div>

      <footer className="fh__footer" data-node-id="2346:152">
        <div className="fh__price">
          <div className="fh__priceHead">
            <p className="fh__priceTitle">Buy Now Before Price Rise</p>
            <p className="fh__stage">Stage {STAGE}</p>
          </div>
          <div
            className="fh__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(PROGRESS * 100)}
            aria-label="Presale progress"
          >
            <div className="fh__progressFill" style={{ width: `${PROGRESS * 100}%` }}>
              <span className="fh__progressGlow" aria-hidden="true" />
            </div>
          </div>
          <div className="fh__stats">
            <p>
              <span>USD raised:</span>
              <strong className="fh__figure">
                <span data-count="usd">{usd}</span>
                <span className="fh__figureGhost" aria-hidden="true">{usd}</span>
              </strong>
            </p>
            <p>
              <span>Tokens sold:</span>
              <strong className="fh__figure">
                <span data-count="tokens">{tokens}</span>
                <span className="fh__figureGhost" aria-hidden="true">{tokens}</span>
              </strong>
            </p>
          </div>
        </div>
        <div className="fh__countdown" role="timer" aria-live="off" aria-label={ended ? 'Presale has ended' : 'Presale ends in'}>
          <Unit value={days} label="days" />
          <span className="fh__sep" aria-hidden="true">:</span>
          <Unit value={hours} label="hours" />
          <span className="fh__sep" aria-hidden="true">:</span>
          <Unit value={minutes} label="minutes" />
          <span className="fh__sep" aria-hidden="true">:</span>
          <Unit value={seconds} label="seconds" />
        </div>
      </footer>
    </section>
  );
}
