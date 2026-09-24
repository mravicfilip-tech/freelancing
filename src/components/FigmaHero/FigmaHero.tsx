import { useEffect, useRef, useState } from 'react';
import { ChestSlide } from './ChestSlide';
import { HeroPlanet } from '../HeroPlanet';
import { Bars } from './Bars';
import { useHeroEntrance } from './useHeroEntrance';
import { SiteNav } from './SiteNav';
import { useSlideCopy } from './useSlideCopy';
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

export function PresaleButton({
  wide = false,
  label = 'Join Presale',
  href = '#presale',
}: {
  wide?: boolean;
  label?: string;
  href?: string;
}) {
  return (
    <a
      className={`fh__btn fh__btn--primary${wide ? ' fh__btn--wide' : ''}`}
      href={href}
      onPointerEnter={blobOrigin}
      onPointerLeave={blobOrigin}
    >
      {label}
      <Chevron direction="right" />
    </a>
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
 *  then the chest, which draws itself in from its own line work. */
const SLIDES = [
  {
    id: 'globe',
    label: 'Payment corridors around the world',
    /* The headline is set in two tones, as every headline on the site is: the lead-in greys back
       and the line that carries the promise lands in full ink. */
    lead: 'The Future of',
    payoff: 'Global Payments',
    body:
      'Move money across borders with crypto-native infrastructure built for a faster, borderless ' +
      'financial world.',
  },
  {
    id: 'bars',
    label: 'Presale figures',
    lead: 'Crypto In.',
    payoff: 'Fiat Out.',
    body:
      'Move digital assets across borders and settle directly into local bank accounts \u2014 ' +
      'seamlessly, securely, and globally.',
  },
  {
    id: 'chest',
    label: 'The Remittix chest',
    lead: 'Unlock the',
    payoff: 'Unexpected.',
    body:
      'Remittix Mystery Boxes are here \u2014 discover exclusive RTX rewards, bonuses and prizes ' +
      'inside.',
    /* No mystery-box page exists yet, so this lands on the presale with the site's other
       placeholder anchors. Give it a real destination when there is one. */
    cta: 'Explore Mystery Boxes',
  },
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
      <div className="fh__slide" data-slide="chest" data-active={index === 2 || undefined} aria-hidden={index !== 2}>
        <ChestSlide active={index === 2} />
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
  /* The words lag the slider by one beat so the outgoing copy can clear its masks first. */
  const copy = SLIDES[useSlideCopy(root, slide)];
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

      <SiteNav />

      <div className="fh__main" data-node-id="2346:142">
        <div className="fh__intro">
          <div className="fh__introText">
            {/* The nodes stay put across a slide change so the words swap inside masks that are
                already translated out of view — see useSlideCopy. Keying them per slide would
                replace the elements and lose the out-state mid-swap. */}
            <h1 className="fh__title">
              <span className="fh__line">
                <span className="fh__lineInner fh__titleMuted">{copy.lead}</span>
              </span>
              <span className="fh__line">
                <span className="fh__lineInner">{copy.payoff}</span>
              </span>
            </h1>
            <p className="fh__body">{copy.body}</p>
          </div>
          <PresaleButton wide label={'cta' in copy ? copy.cta : undefined} />
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
