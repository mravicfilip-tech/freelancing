// The two sections after the pinned story, Proizvodi and the footer, built in round 3 (items 8 and 9) on the story's own
// system. The same 12 column grid with a 48px margin and 24px gutters, hairlines as a pair of 1px lines, black at 18 percent
// beside white at 40 percent, and plus marks in solid ink at every crossing. Copy from ../copy.ts, rules in sections.css.
// AfterStory is what the story renders under its stage, the products first, then the footer.
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { SITE } from '../../content';
import { footer, proizvodi } from '../copy';
import { FooterLine } from './lineart';
import { Btn } from './ui';
import './sections.css';

// The five vertical grid lines of the story, columns 1, 4, 7, 10 and 13, as the --x1 to --x5 values sections.css sets.
const X = (n: number) => `var(--x${n})`;

// A plus mark at a crossing. The 9px box is placed so its centre pixel is the crossing, see .sx-p in sections.css.
const Plus = ({ style }: { style: CSSProperties }) => <i className="sx-p" style={style} aria-hidden="true" />;

// The rule across the top of a footer row, the verticals it uses and a plus mark where each meets the rule. The bottom of the
// last row passes ground, the ink rule the drawn trucks stand on, with its own marks.
function RowLines({ xs, ground }: { xs: number[]; ground?: boolean }) {
  return (
    <>
      <i className="sx-rule" aria-hidden="true" />
      {xs.map((n) => (
        <i className={`sx-vl${ground ? ' sx-vl-ground' : ''}`} style={{ left: X(n) }} aria-hidden="true" key={n} />
      ))}
      {xs.map((n) => (
        <Plus style={{ left: `calc(${X(n)} - 4px)`, top: -4 }} key={n} />
      ))}
      {ground ? (
        <>
          <i className="sx-ground" aria-hidden="true" />
          {xs.map((n) => (
            <Plus style={{ left: `calc(${X(n)} - 4px)`, top: 'calc(100% - 4px)' }} key={`g${n}`} />
          ))}
        </>
      ) : null}
    </>
  );
}

// The nodes of the cell lattice as fractions of its width and counts of rows, where a vertical meets a horizontal line.
// Columns 5 to 12 are cut in four equal units. The lead spans two units and two rows, two cells in the last row span two units.
const NODES: [number, number][] = [
  [0, 0], [0.5, 0], [0.75, 0], [1, 0],
  [0.5, 1], [0.75, 1], [1, 1],
  [0, 2], [0.5, 2], [0.75, 2], [1, 2],
  [0, 3], [0.5, 3], [1, 3],
];

export function Products() {
  const c = proizvodi;
  const cells = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [seen, setSeen] = useState(false);

  // The cells wait hidden until the lattice scrolls into view, then reveal in a stagger. With reduced motion, or without
  // the observer, nothing is hidden at all.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const el = cells.current;
    if (!el) return;
    setArmed(true);
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="sx sx-products" aria-labelledby="proizvodi-naslov" data-after-story>
      <i className="sx-vl sx-vl-full" style={{ left: X(1) }} aria-hidden="true" />
      <i className="sx-vl sx-vl-full" style={{ left: X(5) }} aria-hidden="true" />
      <div className="sx-frame">
        <i className="sx-rule sx-rule-t" aria-hidden="true" />
        <i className="sx-rule sx-rule-b" aria-hidden="true" />
        <Plus style={{ left: `calc(${X(1)} - 4px)`, top: -4 }} />
        <Plus style={{ left: `calc(${X(1)} - 4px)`, top: 'calc(100% - 4px)' }} />

        <div className="sx-left">
          <div>
            <p className="sx-label">
              <span>{c.label}</span>
              <span className="sx-total">
                {c.total} {c.unit}
              </span>
            </p>
            <h2 className="sx-title" id="proizvodi-naslov">
              {c.title.map((t) => (
                <span className="sx-ln" key={t}>
                  {t}
                </span>
              ))}
            </h2>
          </div>
          <div className="sx-foot">
            <p className="sx-lede">{c.lede}</p>
            <Btn href={c.cta.href} kind="primary" cta="products">
              {c.cta.label}
            </Btn>
          </div>
        </div>

        <div className={`sx-cells${armed ? ' is-armed' : ''}${seen ? ' is-in' : ''}`} ref={cells}>
          {c.cells.map((p, i) => (
            <a
              className={`sx-cell${p.lead ? ' sx-cell-lead' : ''}${i > 4 ? ' sx-cell-wide' : ''}${i > 2 ? ' sx-cell-t' : ''}`}
              href={p.href}
              style={{ '--i': i } as CSSProperties}
              data-cta="product"
              key={p.name}
            >
              <span className="sx-in">
                <span className="sx-top">
                  <span className="sx-range">{p.range}</span>
                  <span className="sx-count">
                    {p.count} {c.unit}
                  </span>
                </span>
                <span className="sx-fig">
                  <img className="sx-img" src={p.img} alt={p.alt} loading="lazy" decoding="async" />
                </span>
                <span className="sx-name">
                  <span className="sx-ul">{p.name}</span>
                </span>
                <span className="sx-cap">{p.cap}</span>
              </span>
            </a>
          ))}
          {NODES.map(([px, py]) => (
            <i className="sx-p sx-p-n" style={{ '--px': px, '--py': py } as CSSProperties} aria-hidden="true" key={`${px}-${py}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// The footer on pale grey, so the red Linde logo block sits on a legal ground (guideline p.12). Row one the two numbers, row two
// the logos, the address and the nav, row three the drawn trucks on the bottom rule, the copyright under the rule.
export function Footer() {
  return (
    <footer className="sx sx-footer" id="kontakt" data-after-story>
      <span id="sadrzaj" />
      <div className="sx-row sx-r1">
        <RowLines xs={[1, 3, 5]} />
        {footer.phones.map((p, i) => (
          <div className="sx-c sx-phone" style={{ gridColumn: i === 0 ? '1 / 7' : '7 / 13' }} key={p.label}>
            <p className="sx-lab">{p.label}</p>
            <a className="sx-num" href={p.tel} data-cta={p.cta}>
              {p.number}
            </a>
            <a className="sx-mail" href={`mailto:${p.email}`}>
              {p.email}
            </a>
          </div>
        ))}
      </div>

      <div className="sx-row sx-r2">
        <RowLines xs={[1, 3, 4, 5]} />
        <div className="sx-c sx-brand" style={{ gridColumn: '1 / 7' }}>
          <a className="sx-logos" href={`${SITE}/`}>
            <img src="/brand/linde-mh.svg" width={160} height={96} alt="Linde Material Handling" />
            <img src="/brand/ekotehnika.svg" width={160} height={33} alt="Ekotehnika, početna strana" />
          </a>
        </div>
        <address className="sx-c sx-adr" style={{ gridColumn: '7 / 10' }}>
          <h3 className="sx-lab">{footer.labels.address}</h3>
          {footer.address.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </address>
        <nav className="sx-c sx-nav" style={{ gridColumn: '10 / 13' }} aria-label="Navigacija u podnožju">
          <h3 className="sx-lab">{footer.labels.nav}</h3>
          <ul>
            {footer.nav.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sx-row sx-r3">
        <RowLines xs={[1, 2, 3, 4, 5]} ground />
        <div className="sx-trucks">
          <FooterLine />
        </div>
      </div>

      <div className="sx-row sx-base">
        <p style={{ gridColumn: '1 / 7' }}>{footer.copyright}</p>
        <p style={{ gridColumn: '7 / 13' }}>{footer.legal}</p>
      </div>
    </footer>
  );
}

export function AfterStory() {
  return (
    <>
      <Products />
      <Footer />
    </>
  );
}
