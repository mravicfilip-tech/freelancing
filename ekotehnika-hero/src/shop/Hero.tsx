// The hero of the shop's first page, Filip 18 November, "need to add a hero to this page with button, slider images to promote new
// products". One slide for the shop itself, then the old site's own three slides with their words as the client wrote them (captured
// 8 October, briefs/hero-rebuild/screenshots/03), the MT15 C offer, the counterbalance trucks and the order picker. The pictures are the
// Drive's. The words stand on the white beside the picture, never over it. A slide changes every 7 seconds and holds while a hand or the
// focus is on the hero, the tab is hidden, or the visitor asks for less motion. A swipe on the picture moves it too.
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { CATEGORIES, PRODUCTS } from './data';
import { Link } from './route';
import { Cell } from './parts';

type Slide = {
  id: string;
  tab: string;
  kicker: string;
  title: string;
  line?: string;
  price?: { label: string; value: string };
  cta: { label: string; href: string };
  img: string;
  alt: string;
  fit: 'cover' | 'contain';
  focus?: string;
};

export const SLIDES: Slide[] = [
  {
    id: 'prodavnica',
    tab: 'Prodavnica',
    kicker: 'Prodavnica',
    title: 'Novi Linde viljuškari',
    line: `${PRODUCTS.length} modela u ${CATEGORIES.length} kategorija. Izaberite vrstu viljuškara, a ponudu za model vam šaljemo na upit.`,
    cta: { label: 'Pogledajte sve modele', href: '/prodavnica/svi-modeli' },
    img: '/shop/hero/range.webp',
    alt: 'Linde viljuškari svih vrsta, jedan pored drugog u hali',
    fit: 'cover',
    focus: '50% 70%',
  },
  {
    // the offer of the old site's first slide, price as shown there on 8 October, Filip to confirm it still holds
    id: 'mt15c',
    tab: 'Linde transporter MT15 C',
    kicker: 'Linde transporter MT15 C',
    title: 'Odličan elektro paletar na akciji!',
    price: { label: 'Akcija', value: '1.390 €' },
    cta: { label: 'Saznajte više', href: '/prodavnica/niskopodizna-vozila/mt15-c' },
    img: '/shop/mt15-c.webp',
    alt: 'Linde MT15 C, ručni elektro paletar',
    fit: 'contain',
  },
  {
    id: 'ceoni',
    tab: 'Dizel i gasni viljuškari',
    kicker: 'Dizel viljuškari i gasni viljuškari',
    title: 'Čeoni viljuškari, savršeni u svakom detalju',
    cta: { label: 'Saznajte više', href: '/prodavnica/dizel-i-plinski-ceoni-viljuskari' },
    img: '/shop/hero/ceoni.webp',
    alt: 'Linde čeoni viljuškar u skladišnoj hali',
    fit: 'cover',
    focus: '55% 60%',
  },
  {
    id: 'komisioniranje',
    tab: 'Viljuškar za komisioniranje',
    kicker: 'Viljuškar za komisioniranje',
    title: 'Viljuškar sastavljen za čas',
    cta: { label: 'Saznajte više', href: '/prodavnica/viljuskari-za-komisioniranje' },
    img: '/shop/hero/komisioniranje.webp',
    alt: 'Linde N20 viljuškar za komisioniranje u prolazu skladišta',
    fit: 'cover',
    focus: '50% 55%',
  },
];

const EVERY = 7000;
const still = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Hero() {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [calm] = useState(still);
  const playing = !held && !hidden && !calm;
  const n = SLIDES.length;
  const go = useCallback((i: number) => setAt(((i % n) + n) % n), [n]);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ x: number; id: number } | null>(null);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => go(at + 1), EVERY);
    return () => window.clearTimeout(t);
  }, [at, playing, go]);

  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  const key = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -at : e.key === 'End' ? n - 1 - at : 0;
    if (!d) return;
    e.preventDefault();
    const i = (((at + d) % n) + n) % n;
    go(i);
    tabs.current[i]?.focus();
  };
  const down = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, id: e.pointerId };
  };
  const up = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 48) go(at + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      className="sp-frame sp-hero"
      aria-roledescription="karusel"
      aria-label="Izdvojeno iz prodavnice"
      data-playing={playing || undefined}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHeld(false)}
    >
      <h1 className="sr-only">Prodavnica, novi Linde viljuškari</h1>
      <Cell span={2} className="sp-hero-text">
        <div className="sp-hero-stack" aria-live={playing ? 'off' : 'polite'}>
          {SLIDES.map((s, i) => (
            <div
              className="sp-hero-slide"
              id={`slide-${s.id}`}
              role="tabpanel"
              aria-roledescription="slajd"
              aria-label={`${i + 1} od ${n}, ${s.tab}`}
              aria-hidden={i !== at}
              data-on={i === at || undefined}
              key={s.id}
              // the slides that are not on screen keep out of the tab order
              inert={i !== at ? true : undefined}
            >
              <p className="sp-lab">{s.kicker}</p>
              <p className="sp-hero-t">{s.title}</p>
              {s.line ? <p className="sp-lede">{s.line}</p> : null}
              {s.price ? (
                <p className="sp-price">
                  <span className="sp-price-l">{s.price.label}</span>
                  <span className="sp-price-v">{s.price.value}</span>
                </p>
              ) : null}
              <Link className="btn btn-primary" href={s.cta.href} data-cta={`hero-${s.id}`}>
                <BtnInner>{s.cta.label}</BtnInner>
              </Link>
            </div>
          ))}
        </div>
      </Cell>
      <Cell span={2} className="sp-hero-pic">
        <div className="sp-hero-imgs" onPointerDown={down} onPointerUp={up} onPointerCancel={() => (swipe.current = null)}>
          {SLIDES.map((s, i) => (
            <img
              className={`is-${s.fit}`}
              src={s.img}
              alt={i === at ? s.alt : ''}
              aria-hidden={i !== at}
              data-on={i === at || undefined}
              style={s.focus ? { objectPosition: s.focus } : undefined}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              key={s.id}
            />
          ))}
        </div>
      </Cell>
      <Cell span={4} className="sp-hero-nav">
        <div className="sp-hero-tabs" role="tablist" aria-label="Slajdovi" onKeyDown={key}>
          {SLIDES.map((s, i) => (
            <button
              type="button"
              role="tab"
              aria-selected={i === at}
              aria-controls={`slide-${s.id}`}
              tabIndex={i === at ? 0 : -1}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              onClick={() => go(i)}
              key={s.id}
            >
              <span className="sp-hero-tab-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="sp-hero-tab-t">{s.tab}</span>
              <i className="sp-hero-bar" aria-hidden="true" style={{ animationDuration: `${EVERY}ms` }} />
            </button>
          ))}
        </div>
        <div className="sp-hero-arrows">
          <button type="button" className="btn btn-secondary sp-arrow is-prev" aria-label="Prethodni slajd" onClick={() => go(at - 1)}>
            <BtnInner>Prethodni</BtnInner>
          </button>
          <button type="button" className="btn btn-secondary sp-arrow is-next" aria-label="Sledeći slajd" onClick={() => go(at + 1)}>
            <BtnInner>Sledeći</BtnInner>
          </button>
        </div>
      </Cell>
    </section>
  );
}
