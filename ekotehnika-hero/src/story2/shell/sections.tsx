// The normal page sections after the pinned story, plan part D. The statement with the marquee rows, Proizvodi with a
// list, a staggered grid and a photo collage, the client wall, the closing band and the footer. Copy from ../copy.ts.
// No grid on these beyond their own cell hairlines. Notched edges are SVG paths, plan B5.
import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { SITE } from '../../content';
import { closing, footer, klijenti, proizvodi, statement } from '../copy';
import { FooterLine } from './lineart';
import { formatCount, outCubic, range } from './motion';
import { Arrow } from './ui';

// One wide tab notch, 320px wide and 40px deep with 24px corners and 16px fillets, in the colour of the section below.
export function Notch({ color }: { color: string }) {
  return (
    <div className="notch" aria-hidden="true">
      <svg width="320" height="40" viewBox="0 0 320 40" focusable="false">
        <path d="M0 40 A16 16 0 0 0 16 24 A24 24 0 0 1 40 0 H280 A24 24 0 0 1 304 24 A16 16 0 0 0 320 40 Z" fill={color} />
      </svg>
    </div>
  );
}

const reducedNow = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DRIFT = 50;

const Plus = () => <i className="plus" aria-hidden="true" />;

// ---- D1, the statement ------------------------------------------------------------------------------------------
// Two rows run edge to edge in opposite directions with the scroll, the photo card sits in the middle and the rows pass
// behind it.
export function Statement() {
  const root = useRef<HTMLElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedNow()) return;
    const el = root.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      const b = el.getBoundingClientRect();
      const p = range(window.innerHeight - b.top, 0, window.innerHeight + b.height);
      // a short drift in opposite directions, so a full phrase of each row always stays clear of the card
      if (r1.current) r1.current.style.transform = `translate3d(${((1 - p) * DRIFT).toFixed(1)}px,0,0)`;
      if (r2.current) r2.current.style.transform = `translate3d(${(-(1 - p) * DRIFT).toFixed(1)}px,0,0)`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // the last copy of a row has no closing plus, so row two ends on its phrase at the right edge
  const row = (text: string, closing = true) =>
    [0, 1, 2].map((i) => (
      <Fragment key={i}>
        <span>{text}</span>
        {closing || i < 2 ? <Plus /> : null}
      </Fragment>
    ));

  return (
    <section className="s2-sec s2-statement" id="sadrzaj" data-after-story ref={root} aria-labelledby="s2-statement-title">
      <Notch color="var(--white)" />
      <p className="s2-label st-label">{statement.label}</p>
      <h2 className="sr-only" id="s2-statement-title">
        {statement.rows.join('. ')}
      </h2>
      <div className="st-stage">
        <div className="st-rows" aria-hidden="true">
          <div className="st-row st-row-1" ref={r1}>
            {row(statement.rows[0])}
          </div>
          <div className="st-row st-row-2" ref={r2}>
            {row(statement.rows[1], false)}
          </div>
        </div>
        <figure className="st-card">
          <img src={statement.photo.src} alt={statement.photo.alt} width={800} height={1000} loading="lazy" decoding="async" />
        </figure>
      </div>
    </section>
  );
}

// ---- D2, Proizvodi ----------------------------------------------------------------------------------------------
export function Products() {
  const c = proizvodi;
  return (
    <section className="s2-sec s2-prod" aria-labelledby="s2-prod-title">
      <div className="sec-grid">
        <header className="prod-head">
          <h2 className="s2-title" id="s2-prod-title">
            {c.title}
          </h2>
          <p className="s2-lede prod-lede">
            {c.lede[0]}
            <br />
            {c.lede[1]}
          </p>
        </header>

        <ul className="plist">
          {c.list.map((p) => (
            <li key={p.name}>
              <a href={p.href}>
                <span className="pl-name">
                  <span className="pl-a">{p.name}</span>
                  <span className="pl-b" aria-hidden="true">
                    {p.count} modela
                  </span>
                </span>
                <img src={p.img} alt="" width={120} height={80} loading="lazy" decoding="async" />
                <span className="pl-count">({p.count})</span>
                <span className="pl-go" aria-hidden="true">
                  <Arrow />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <ul className="pcards">
          {c.cards.map((p) => (
            <li className="pcard" key={p.name}>
              <img src={p.img} alt={p.alt} width={600} height={450} loading="lazy" decoding="async" />
              <div className="ctab">
                <b>{p.name}</b>
                <span>{p.type}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="collage">
          <div className="co-text">
            <p className="s2-label">Isporuka</p>
            <a className="btn btn-primary" href={c.cta.href} data-cta="quote">
              <span className="btn-t">
                {c.cta.label}
                <Arrow />
              </span>
            </a>
          </div>
          {c.photos.map((ph, i) => (
            <figure className={`co co-${i + 1}`} key={ph.src}>
              <img src={ph.src} alt={ph.alt} width={800} height={1000} loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- D3, the client wall ----------------------------------------------------------------------------------------
const WALL_COLS = 6;

export function Clients() {
  const c = klijenti;
  const rows = Math.ceil(c.cells.length / WALL_COLS);
  const num = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = num.current;
    if (!el || reducedNow()) return;
    el.textContent = '0+';
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / 800);
          el.textContent = formatCount(c.count * outCubic(p)) + '+';
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [c.count]);

  return (
    <section className="s2-sec s2-clients" aria-labelledby="s2-clients-title">
      <div className="sec-grid">
        <div className="cl-head">
          <p className="s2-label" id="s2-clients-title">
            {c.label}
          </p>
          <p className="cl-claim">
            <b ref={num}>{formatCount(c.count)}+</b> klijenata
          </p>
        </div>
        <ul className="wall" style={{ '--rows': rows } as CSSProperties}>
          {c.cells.map((cell) => (
            <li className={cell.dummy ? 'wc wc-dummy' : 'wc'} key={cell.name} aria-hidden={cell.dummy ? true : undefined}>
              <span>{cell.name}</span>
            </li>
          ))}
          {Array.from({ length: (rows + 1) * (WALL_COLS + 1) }, (_, i) => (
            <i
              className="gp"
              style={{ left: `${((i % (WALL_COLS + 1)) / WALL_COLS) * 100}%`, top: `${(Math.floor(i / (WALL_COLS + 1)) / rows) * 100}%` }}
              aria-hidden="true"
              key={`p${i}`}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---- D4, the closing band and the footer ------------------------------------------------------------------------
export function Closing() {
  return (
    <section className="s2-sec s2-closing" aria-labelledby="s2-closing-title">
      <div className="sec-grid">
        <h2 className="s2-title" id="s2-closing-title">
          {closing.line.map((l) => (
            <span className="ln-s" key={l}>
              {l}
            </span>
          ))}
        </h2>
        <a className="btn btn-primary" href={closing.cta.href} data-cta="quote">
          <span className="btn-t">
            {closing.cta.label}
            <Arrow />
          </span>
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="s2-footer" id="kontakt">
      <Notch color="var(--grey-pale)" />
      <div className="sec-grid ft-grid">
        <a className="ft-logo" href={`${SITE}/`}>
          <img src="/brand/linde-mh.svg" width={160} height={96} alt="Linde Material Handling" />
          <img src="/brand/ekotehnika.svg" width={160} height={33} alt="Ekotehnika, početna strana" />
        </a>
        <div className="ft-hitan">
          <p className="s2-label">{footer.service.label}</p>
          <a className="ft-num" href={footer.service.tel} data-cta="call-service">
            {footer.service.number}
          </a>
        </div>
        <nav className="ft-col ft-nav" aria-label="Navigacija u podnožju">
          <h3 className="s2-label">Navigacija</h3>
          <ul>
            {footer.nav.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <address className="ft-col ft-adr">
          <h3 className="s2-label">Adresa</h3>
          {footer.address.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </address>
        <div className="ft-col ft-kon">
          <h3 className="s2-label">Kontakt</h3>
          {footer.phones.map((p) => (
            <p key={p.label}>
              <a href={p.tel} data-cta={p.label === 'Prodaja' ? 'call-sales' : 'call-service'}>
                {p.label} {p.number}
              </a>
            </p>
          ))}
          {footer.emails.map((e) => (
            <p key={e}>
              <a href={`mailto:${e}`}>{e}</a>
            </p>
          ))}
        </div>
      </div>
      <div className="ft-ground">
        <FooterLine />
      </div>
      <div className="sec-grid ft-base">
        <p>{footer.copyright}</p>
        <p>{footer.legal}</p>
      </div>
    </footer>
  );
}
