// The hero of the shop's first page, Filip 18 November, "need to add a hero to this page with button, slider images to promote new
// products", then "do better more attractive hero/slider, use inspiration we did for CTA banner and previous inspirations I gave you".
// Two of his references meet here. The store hero of the round 2 board (ui-pass/refs/02, big words on the left, a collage of layered
// pictures on the right) and the homepage's closing banner (the hairline grid, the pictures flowing in along it, one primary). Each slide
// is its words on the white, and a collage, a photo, a second photo over its edge, the model's cut out render on a pale tile, and a fact
// of the model, each coming in from its own side when the slide changes. One slide for the shop, then the old site's own three slides with
// their words as the client wrote them (captured 8 October). A slide changes every 7 seconds and holds while a hand or the focus is on
// the hero, the tab is hidden, or the visitor asks for less motion. A swipe moves it too.
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { CATEGORIES, PRODUCTS, fmt, productBySlug } from './data';
import { Link } from './route';
import { Cell, Rule } from './parts';

type Slide = {
  id: string;
  tab: string;
  kicker: string;
  title: string;
  line?: string;
  price?: { label: string; value: string };
  cta: { label: string; href: string };
  more?: { label: string; href: string };
  main: { src: string; alt: string; fit?: 'cover' | 'contain'; focus?: string };
  second?: { src: string; focus?: string };
  model?: string;
};

export const SLIDES: Slide[] = [
  {
    id: 'prodavnica',
    tab: 'Prodavnica',
    kicker: 'Prodavnica',
    title: 'Novi Linde viljuškari',
    line: `${PRODUCTS.length} modela u ${CATEGORIES.length} kategorija. Izaberite vrstu viljuškara, a ponudu za model vam šaljemo na upit.`,
    cta: { label: 'Pogledajte sve modele', href: '/prodavnica/svi-modeli' },
    main: { src: '/shop/hero/range.webp', alt: 'Linde viljuškari svih vrsta, jedan pored drugog u hali', focus: '50% 70%' },
    second: { src: '/shop/hero/range-2.webp', focus: '50% 60%' },
    model: 'x20-do-x35',
  },
  {
    // the offer of the old site's first slide, price as shown there on 8 October, Filip to confirm it still holds
    id: 'mt15c',
    tab: 'Linde transporter MT15 C',
    kicker: 'Linde transporter MT15 C',
    title: 'Odličan elektro paletar na akciji!',
    price: { label: 'Akcija', value: '1.390 €' },
    cta: { label: 'Saznajte više', href: '/prodavnica/niskopodizna-vozila/mt15-c' },
    more: { label: 'Niskopodizna vozila', href: '/prodavnica/niskopodizna-vozila' },
    main: { src: '/shop/mt15-c.webp', alt: 'Linde MT15 C, ručni elektro paletar', fit: 'contain' },
    model: 'mt15-c',
  },
  {
    id: 'ceoni',
    tab: 'Dizel i gasni viljuškari',
    kicker: 'Dizel viljuškari i gasni viljuškari',
    title: 'Čeoni viljuškari, savršeni u svakom detalju',
    cta: { label: 'Saznajte više', href: '/prodavnica/dizel-i-plinski-ceoni-viljuskari' },
    main: { src: '/shop/hero/ceoni.webp', alt: 'Linde čeoni viljuškar u skladišnoj hali', focus: '55% 60%' },
    second: { src: '/shop/hero/ceoni-2.webp', focus: '40% 50%' },
    model: 'h20-do-h35',
  },
  {
    id: 'komisioniranje',
    tab: 'Viljuškar za komisioniranje',
    kicker: 'Viljuškar za komisioniranje',
    title: 'Viljuškar sastavljen za čas',
    cta: { label: 'Saznajte više', href: '/prodavnica/viljuskari-za-komisioniranje' },
    main: { src: '/shop/hero/komisioniranje.webp', alt: 'Linde N20 viljuškar za komisioniranje u prolazu skladišta', focus: '50% 55%' },
    second: { src: '/shop/hero/komisioniranje-2.webp', focus: '45% 50%' },
    model: 'n20-do-n25-c',
  },
];

const EVERY = 7000;
const OUT = 420;
const still = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// the collage of a slide, its layers come in on their own sides, see .sp-col in shop.css
function Collage({ s, state }: { s: Slide; state: 'in' | 'out' }) {
  const m = s.model ? productBySlug(s.model) : undefined;
  return (
    <div className={`sp-col is-${state}${s.price ? ' has-price' : ''}`} aria-hidden={state === 'out'}>
      <div className={`sp-col-main is-${s.main.fit ?? 'cover'}`}>
        <img src={s.main.src} alt={state === 'in' ? s.main.alt : ''} style={s.main.focus ? { objectPosition: s.main.focus } : undefined} decoding="async" draggable={false} />
      </div>
      {s.second ? (
        <div className="sp-col-second">
          <img src={s.second.src} alt="" style={s.second.focus ? { objectPosition: s.second.focus } : undefined} decoding="async" draggable={false} />
        </div>
      ) : null}
      {s.price ? (
        <div className="sp-col-price">
          <span className="sp-col-price-l">{s.price.label}</span>
          <span className="sp-col-price-v">{s.price.value}</span>
        </div>
      ) : m?.thumb ? (
        <div className="sp-col-tile">
          <img src={m.thumb} alt="" decoding="async" draggable={false} />
        </div>
      ) : null}
      {m && (m.kg !== null || m.mm !== null) ? (
        <div className="sp-col-chip">
          <span className="sp-col-chip-l">Linde {m.code}</span>
          <span className="sp-col-chip-v">
            {m.kg !== null ? (
              <>
                {fmt(m.kg)} <span>kg</span>
              </>
            ) : (
              <>
                {fmt(m.mm!)} <span>mm</span>
              </>
            )}
          </span>
          <span className="sp-col-chip-s">{m.kg !== null ? 'nosivost' : 'visina podizanja'}</span>
        </div>
      ) : null}
    </div>
  );
}

export function Hero() {
  const [at, setAt] = useState(0);
  const [out, setOut] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [calm] = useState(still);
  const playing = !held && !hidden && !calm;
  const n = SLIDES.length;
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ x: number; id: number } | null>(null);
  const clear = useRef(0);

  const now = useRef(0);
  const go = useCallback(
    (i: number) => {
      const next = ((i % n) + n) % n;
      const cur = now.current;
      if (cur === next) return;
      now.current = next;
      setOut(cur);
      setAt(next);
      window.clearTimeout(clear.current);
      clear.current = window.setTimeout(() => setOut(null), OUT);
    },
    [n],
  );

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => go(at + 1), EVERY);
    return () => window.clearTimeout(t);
  }, [at, playing, go]);

  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => {
      document.removeEventListener('visibilitychange', on);
      window.clearTimeout(clear.current);
    };
  }, []);

  // the pictures of every slide are asked for at once, so a slide never comes in before its pictures
  useEffect(() => {
    SLIDES.forEach((s) => [s.main.src, s.second?.src].forEach((src) => src && (new Image().src = src)));
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
  const s = SLIDES[at];

  return (
    <section
      className="sp-frame sp-hero"
      aria-roledescription="karusel"
      aria-label="Izdvojeno iz prodavnice"
      data-playing={playing || undefined}
      data-calm={calm || undefined}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHeld(false)}
    >
      <h1 className="sr-only">Prodavnica, novi Linde viljuškari</h1>
      <Cell span={2} className="sp-hero-text">
        {/* the counter and the two arrows over the words, Filip 18 November, "style this slider better" */}
        <div className="sp-hero-top">
          <p className="sp-hero-count" aria-hidden="true">
            <span>{String(at + 1).padStart(2, '0')}</span> / {String(n).padStart(2, '0')}
          </p>
          <div className="sp-hero-arrows">
            <button type="button" className="btn btn-secondary sp-arrow is-prev" aria-label="Prethodni slajd" onClick={() => go(at - 1)}>
              <BtnInner>Prethodni</BtnInner>
            </button>
            <button type="button" className="btn btn-secondary sp-arrow is-next" aria-label="Sledeći slajd" onClick={() => go(at + 1)}>
              <BtnInner>Sledeći</BtnInner>
            </button>
          </div>
        </div>
        {/* the words of the slide on screen only, a new slide's words come in again with the site's one text animation, a fade */}
        <div className="sp-hero-slide" id={`slide-${s.id}`} role="tabpanel" aria-roledescription="slajd" aria-label={`${at + 1} od ${n}, ${s.tab}`} aria-live={playing ? 'off' : 'polite'} key={s.id}>
          <p className="sp-lab">{s.kicker}</p>
          <p className="sp-hero-t">{s.title}</p>
          {s.line ? <p className="sp-lede">{s.line}</p> : null}
          <div className="sp-hero-acts">
            <Link className="btn btn-primary" href={s.cta.href} data-cta={`hero-${s.id}`}>
              <BtnInner>{s.cta.label}</BtnInner>
            </Link>
            {s.more ? (
              <Link className="btn btn-secondary" href={s.more.href}>
                <BtnInner>{s.more.label}</BtnInner>
              </Link>
            ) : null}
          </div>
        </div>
      </Cell>
      <Cell span={2} className="sp-hero-pic">
        <div className="sp-hero-imgs" onPointerDown={down} onPointerUp={up} onPointerCancel={() => (swipe.current = null)}>
          {out !== null ? <Collage s={SLIDES[out]} state="out" key={`out-${SLIDES[out].id}`} /> : null}
          <Collage s={s} state="in" key={`in-${s.id}`} />
        </div>
      </Cell>
      {/* the slides as four tabs, one in each frame of the grid, each tab a cell drawing its own lines. The line over the tab on screen
          fills black while the slides run. */}
      <div className="sp-hero-tabs" role="tablist" aria-label="Slajdovi" onKeyDown={key}>
        {SLIDES.map((x, i) => {
          const m = x.model ? productBySlug(x.model) : undefined;
          return (
            <button
              type="button"
              role="tab"
              className="sp-cell sp-hero-tab"
              aria-selected={i === at}
              aria-controls={`slide-${x.id}`}
              tabIndex={i === at ? 0 : -1}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              onClick={() => go(i)}
              key={x.id}
            >
              <Rule />
              <i className="sp-hero-bar" aria-hidden="true" style={{ animationDuration: `${EVERY}ms` }} />
              <span className="sp-hero-thumb" aria-hidden="true">
                {m?.thumb ? <img src={m.thumb} alt="" /> : null}
              </span>
              <span className="sp-hero-tab-x">
                <span className="sp-hero-tab-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="sp-hero-tab-t">{x.tab}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
