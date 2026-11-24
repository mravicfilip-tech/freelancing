import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GoldenTicket } from './GoldenTicket';
import { TokenLaunch } from './TokenLaunch';

const SLIDES = ['Token Launch Strategy Call', 'Golden Ticket'];
const EVERY = 10_000;

/** Previous, the slides as dots, next: set in each card's kicker row, so it is in the same place on both. */
function PromoNav({ index, onGo }: { index: number; onGo: (i: number) => void }) {
  return (
    <div className="promos__nav">
      <button type="button" className="promos__arrow" aria-label="Previous campaign" onClick={() => onGo(index - 1)}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M10 3.5 5.5 8l4.5 4.5" />
        </svg>
      </button>
      <span className="promos__dots">
        {SLIDES.map((label, i) => (
          <button key={label} type="button" className="promos__dot" aria-label={`Show ${label}`} aria-current={i === index ? 'true' : undefined} onClick={() => onGo(i)} />
        ))}
      </span>
      <button type="button" className="promos__arrow" aria-label="Next campaign" onClick={() => onGo(index + 1)}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
      </button>
    </div>
  );
}

/**
 * The two campaigns as one slider across the page: the founders' live AMA first, the Golden Ticket
 * second, each its full card. The controls sit in each card's kicker row; on touch a swipe turns
 * it. It moves on by itself every ten seconds while it is on screen and nobody is over it, and
 * stops for good once someone uses it (and never with reduced motion). Each card plays its
 * entrance the first time it slides into view, and only the one showing runs its electricity.
 *
 * The slider is the height of the card showing, easing between the two as it turns: beside their
 * stages the two cards are the same height anyway, but stacked (a tablet, a phone) they are not,
 * and holding the shorter to the taller left a hole in it.
 */
export function PromoSlider() {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [touched, setTouched] = useState(false);
  const [seen, setSeen] = useState(false);
  const swipe = useRef<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const n = SLIDES.length;

  // it only moves on by itself while it is on screen
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the slider takes the height of the card showing
  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return;
    const slides = Array.from(vp.querySelectorAll<HTMLElement>('.promos__slide'));
    const fit = () => {
      const h = slides[index]?.offsetHeight;
      if (h) vp.style.height = `${h}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    slides.forEach((s) => ro.observe(s));
    return () => ro.disconnect();
  }, [index]);

  const go = (i: number, byHand = true) => {
    setIndex(((i % n) + n) % n);
    if (byHand) setTouched(true);
  };

  useEffect(() => {
    if (!seen || held || touched || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => go(index + 1, false), EVERY);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, held, touched, seen]);

  const nav: ReactNode = <PromoNav index={index} onGo={go} />;
  const slide = (i: number, card: ReactNode) => (
    <div className="promos__slide" aria-hidden={i !== index || undefined} inert={i !== index} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${SLIDES[i]}`}>
      {card}
    </div>
  );

  return (
    <section
      ref={root}
      className="promos"
      aria-roledescription="carousel"
      aria-label="Campaigns"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div
        ref={viewport}
        className="promos__viewport"
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') swipe.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => void (swipe.current = null)}
      >
        <div className="promos__track" style={{ '--i': index } as React.CSSProperties}>
          {slide(0, <TokenLaunch active={index === 0} nav={nav} />)}
          {slide(1, <GoldenTicket active={index === 1} nav={nav} />)}
        </div>
      </div>
    </section>
  );
}
