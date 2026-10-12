// The two sections after the pinned story, Proizvodi and the footer, built in round 3 (items 8 and 9) on the story's own
// system. The same 12 column grid with a 48px margin and 24px gutters, hairlines as a pair of 1px lines, black at 18 percent
// beside white at 40 percent, and plus marks in solid ink at every crossing. Copy from ../copy.ts, rules in sections.css.
// AfterStory is what the story renders under its stage, the products first, then the footer.
import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { SITE } from '../../content';
import { closing, footer, proizvodi } from '../copy';
import { wipeAt } from './motion';
import { Btn, Fill } from './ui';
import './sections.css';

// The five vertical grid lines of the story, columns 1, 4, 7, 10 and 13, as the --x1 to --x5 values sections.css sets.
const X = (n: number) => `var(--x${n})`;

// A plus mark at a crossing. The 9px box is placed so its centre pixel is the crossing, see .sx-p in sections.css.
const Plus = ({ style }: { style: CSSProperties }) => <i className="sx-p" style={style} aria-hidden="true" />;

// The rule across the top of a footer row, the verticals it uses and a plus mark where each meets the rule. The bottom of the
// last row passes ground, the ink rule the trucks stand on, with its own marks.
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

// The text reveal of the story beats, for sections that sit after the story clock. The same parts, a data-wipe block wipe from
// ui.tsx and a Fill letter fill, driven by --bx and --tv through wipeAt in motion.ts, but started by an IntersectionObserver when
// a block scrolls into view and run on real time. A block is any element marked data-reveal, the value is its extra start delay
// in ms. It starts when its first wipe or fill enters the screen, and each wipe runs 720ms, the hero's own pace, 80ms after the one
// before. Nothing fades. With reduced motion, or without the observer, nothing is armed and every part shows its end state.
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const WIPE_MS = 720;
const STEP_MS = 80;
const FILL_MS = 1100;

function useReveal(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const raf = new Set<number>();
    type Block = { delay: number; wipes: { el: HTMLElement; order: number; last: string }[]; fills: HTMLElement[]; maxOrder: number };
    const blocks = new Map<HTMLElement, Block>();
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          const B = blocks.get(e.target as HTMLElement);
          if (!B) continue;
          if (e.isIntersecting) {
            io.unobserve(e.target);
            run(B);
          } else if (e.boundingClientRect.top < 0) {
            io.unobserve(e.target);
            end(B);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );

    el.querySelectorAll<HTMLElement>('[data-reveal]').forEach((g) => {
      const wipes = Array.from(g.querySelectorAll<HTMLElement>('[data-wipe]')).map((w) => ({ el: w, order: Number(w.dataset.wipe ?? 0), last: '' }));
      const fills = Array.from(g.querySelectorAll<HTMLElement>('[data-fill]'));
      const first = g.querySelector<HTMLElement>('[data-wipe], [data-fill]');
      if (!first) return;
      // armed, the bar waits off to the left of its part and the part is hidden under it
      for (const w of wipes) {
        w.el.style.setProperty('--bx', '-100%');
        w.el.style.setProperty('--tv', 'hidden');
      }
      fills.forEach((f) => f.setAttribute('data-live', ''));
      blocks.set(first, { delay: Number(g.dataset.reveal) || 0, wipes, fills, maxOrder: Math.max(0, ...wipes.map((w) => w.order)) });
      io.observe(first);
    });

    // An anchor jump or a fast fling can carry a block from below the screen to above it with no frame in between, which the
    // observer never reports. A scroll check shows those blocks in their end state at once.
    let sc = 0;
    const past = () => {
      sc = 0;
      blocks.forEach((B, first) => {
        if (first.getBoundingClientRect().top >= 0) return;
        io.unobserve(first);
        blocks.delete(first);
        end(B);
      });
    };
    const onScroll = () => {
      if (!sc) sc = requestAnimationFrame(past);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    function end(B: Block) {
      for (const W of B.wipes) {
        W.el.style.setProperty('--bx', '100%');
        W.el.style.setProperty('--tv', 'inherit');
      }
      B.fills.forEach((f) => f.querySelectorAll('.fl').forEach((l) => l.classList.add('on')));
    }

    function run(B: Block) {
      const t0 = performance.now() + B.delay;
      const fillAt = t0 + B.maxOrder * STEP_MS + WIPE_MS * 0.5;
      const letters = B.fills.map((f) => Array.from(f.querySelectorAll<HTMLElement>('.fl')));
      const on = B.fills.map(() => 0);
      let id = 0;
      const tick = () => {
        raf.delete(id);
        const now = performance.now();
        let busy = false;
        for (const W of B.wipes) {
          const p = clamp01((now - t0 - W.order * STEP_MS) / WIPE_MS);
          const key = String(Math.round(p * 240));
          if (key !== W.last) {
            W.last = key;
            const w = wipeAt(p);
            W.el.style.setProperty('--bx', `${w.bx.toFixed(1)}%`);
            W.el.style.setProperty('--tv', w.shown ? 'inherit' : 'hidden');
          }
          if (p < 1) busy = true;
        }
        const f = clamp01((now - fillAt) / FILL_MS);
        letters.forEach((ls, i) => {
          const n = Math.round(f * ls.length);
          for (let k = on[i]; k < n; k++) ls[k]?.classList.add('on');
          on[i] = Math.max(on[i], n);
          if (f < 1) busy = true;
        });
        if (busy) {
          id = requestAnimationFrame(tick);
          raf.add(id);
        }
      };
      id = requestAnimationFrame(tick);
      raf.add(id);
    }

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (sc) cancelAnimationFrame(sc);
      raf.forEach(cancelAnimationFrame);
    };
  }, [root]);
}

export function Products() {
  const c = proizvodi;
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section className="sx sx-products" ref={root} aria-labelledby="proizvodi-naslov" data-after-story>
      <i className="sx-vl sx-vl-full" style={{ left: X(1) }} aria-hidden="true" />
      <i className="sx-vl sx-vl-full" style={{ left: X(5) }} aria-hidden="true" />
      <div className="sx-frame">
        <i className="sx-rule sx-rule-t" aria-hidden="true" />
        <i className="sx-rule sx-rule-b" aria-hidden="true" />
        <Plus style={{ left: `calc(${X(1)} - 4px)`, top: -4 }} />
        <Plus style={{ left: `calc(${X(1)} - 4px)`, top: 'calc(100% - 4px)' }} />

        <div className="sx-left">
          <div data-reveal="0">
            <p className="sx-label" data-wipe={1}>
              <span>{c.label}</span>
              <span className="sx-total">
                {c.total} {c.unit}
              </span>
            </p>
            <h2 className="sx-title" id="proizvodi-naslov">
              {c.title.map((t, i) => (
                <span className="sx-ln" data-wipe={2 + i} key={t}>
                  {t}
                </span>
              ))}
            </h2>
          </div>
          <div className="sx-foot" data-reveal="0">
            <Fill text={c.lede} className="sx-lede" />
            <Btn href={c.cta.href} kind="primary" order={2} cta="products">
              {c.cta.label}
            </Btn>
          </div>
        </div>

        <div className="sx-cells">
          {c.cells.map((p, i) => (
            <a
              className={`sx-cell${p.lead ? ' sx-cell-lead' : ''}${i > 4 ? ' sx-cell-wide' : ''}${i > 2 ? ' sx-cell-t' : ''}`}
              href={p.href}
              data-cta="product"
              data-reveal={i * 70}
              key={p.name}
            >
              <span className="sx-in">
                <span className="sx-top">
                  <span className="sx-range" data-wipe={1}>
                    {p.range}
                  </span>
                </span>
                <span className="sx-fig" data-wipe={2}>
                  <img className="sx-img" src={p.img} alt={p.alt} loading="lazy" decoding="async" />
                </span>
                <span className="sx-name" data-wipe={3}>
                  <span className="sx-ul">{p.name}</span>
                </span>
                <span className="sx-cap" data-wipe={4}>
                  {p.cap}
                </span>
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

// The closing section, a get in touch ask between Proizvodi and the footer. The grid carries four delivery photos in from the left and
// right edges as the section scrolls in, two a side, each exactly filling a cell. Verticals at columns 1, 3, 5, 9, 11 and 13 and
// four rows of --row. The photos stair step, so no two cross a row they share while they travel.
const CLOSE_X = [1, 3, 5, 9, 11, 13];
const CLOSE_ROWS = [0, 1, 2, 3, 4];
// from column, to column, first row, the side it flows in from, and when its move starts in the section's scroll
const PHOTOS = [
  { a: 1, b: 3, r: 0, from: 'l', at: 0 },
  { a: 3, b: 5, r: 2, from: 'l', at: 0.2 },
  { a: 9, b: 11, r: 2, from: 'r', at: 0.3 },
  { a: 11, b: 13, r: 0, from: 'r', at: 0.1 },
] as const;

export function Closing() {
  const c = closing;
  const root = useRef<HTMLElement>(null);

  // The photos are scroll linked. p runs from 0 as the section's top meets the bottom of the window to 1 once it is a tenth of the
  // window from the top, each photo starts at its own point in that run and eases out. --k is the share of the way still to go, 0 in place.
  // With reduced motion nothing runs and the photos stay in their cells.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ph = Array.from(el.querySelectorAll<HTMLElement>('.sx-ph'));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const p = clamp01((vh - el.getBoundingClientRect().top) / (vh * 0.9));
      ph.forEach((n, i) => {
        const q = clamp01((p - PHOTOS[i].at) / 0.6);
        n.style.setProperty('--k', String((1 - q) * (1 - q)));
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useReveal(root);

  return (
    <section className="sx sx-closing" ref={root} aria-labelledby="kontakt-naslov">
      <div className="sx-cframe">
        <i className="sx-rule sx-rule-t" aria-hidden="true" />
        <i className="sx-rule sx-rule-b" aria-hidden="true" />
        {[1, 2, 3].flatMap((r) => [
          <i className="sx-rule sx-hl-l" style={{ top: `calc(${r} * var(--row))` }} aria-hidden="true" key={`l${r}`} />,
          <i className="sx-rule sx-hl-r" style={{ top: `calc(${r} * var(--row))` }} aria-hidden="true" key={`r${r}`} />,
        ])}
        {CLOSE_X.map((n) => (
          <i className={`sx-vl sx-vl-frame${n === 1 || n === 13 ? ' sx-vl-ext' : ''}`} style={{ left: `var(--c${n})` }} aria-hidden="true" key={n} />
        ))}
        {PHOTOS.map((p, i) => (
          <div
            className={`sx-ph sx-ph-${p.from}`}
            style={{ left: `var(--c${p.a})`, width: `calc(var(--c${p.b}) - var(--c${p.a}))`, top: `calc(${p.r} * var(--row))`, '--cl': `var(--c${p.a})` } as CSSProperties}
            key={i}
          >
            <img src={c.photos[i].src} alt={c.photos[i].alt} loading="lazy" decoding="async" />
          </div>
        ))}
        {CLOSE_X.flatMap((n) =>
          CLOSE_ROWS.map((r) => <Plus style={{ left: `calc(var(--c${n}) - 4px)`, top: `calc(${r} * var(--row) - 4px)` }} key={`${n}-${r}`} />),
        )}

        <div className="sx-mid" data-reveal="0">
          <p className="sx-label" data-wipe={1}>
            {c.label}
          </p>
          <h2 className="sx-ctitle" id="kontakt-naslov">
            {c.line.map((t, i) => (
              <span className="sx-ln" data-wipe={2 + i} key={t}>
                {t}
              </span>
            ))}
          </h2>
          <Fill text={c.text} className="sx-clede" />
          <Btn href={c.cta.href} kind="primary" order={4} cta="quote">
            {c.cta.label}
          </Btn>
        </div>
      </div>
    </section>
  );
}

// The footer on pale grey, so the red Linde logo block sits on a legal ground (guideline p.12). Row one the two numbers, row two
// the logos, the address and the nav, standing on the ground rule, the copyright under the rule. The truck row of 22:30 is gone,
// scenery for the footer comes later from its own branch.
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
        <RowLines xs={[1, 3, 4, 5]} ground />
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
      <Closing />
      <Footer />
    </>
  );
}
