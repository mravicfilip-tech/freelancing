// Variant 5, Sistem. The second half of the Terminal Industries reel in Linde colours. A lit
// forklift at dusk is scanned into glowing edges, breaks into particles, and the particles settle
// into a dark floor of rounded tiles under converging smoke beams, while white type is revealed
// word by word. A frosted white panel with a notched top then slides up over the scene with a
// light headline, a quiet row of service names and three frosted cards.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScrollStory, clamp01, range, smooth } from '../../scroll/useScrollStory';
import { SITE, hero, pillars } from '../../content';
import { SceneContents, type Clock } from './Scene';
import { Well } from './Well';
import './v5.css';

const LENGTH = 8000;
const REDUCED_P = 0.235;

// Statement one is the hero headline from content.ts, broken into the reel's centred lines.
const second = hero.headline[1].split(' ');
const SAY1 = [hero.headline[0].split(' '), second.slice(0, 4), second.slice(4)];
// dummy, statement two
const SAY2 = [
  ['Jedan', 'partner,', 'jedan', 'sistem'],
  ['za', 'celu', 'vašu', 'flotu.'],
];

const LINKS = [
  { label: 'Novi', href: pillars[0].href },
  { label: 'Polovni', href: pillars[3].href },
  { label: 'Najam', href: pillars[1].href },
  { label: 'Servis', href: pillars[2].href },
];

// dummy, the card kickers
const KICKERS: Record<string, string> = { novi: '01 Nova flota', najam: '02 Od jednog dana', servis: '03 Na terenu' };
const CARDS = pillars.filter((p) => p.id !== 'polovni') as (typeof pillars)[number][];

function Words({ lines, refs }: { lines: string[][]; refs: React.MutableRefObject<HTMLSpanElement[]> }) {
  let i = 0;
  return (
    <>
      {lines.map((line, li) => (
        <span className="v5-line" key={li}>
          {line.map((w) => {
            const k = i++;
            return (
              <span
                key={k}
                className="v5-w"
                ref={(el) => {
                  if (el) refs.current[k] = el;
                }}
              >
                {w}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.6 1.6 0 0 1-1.7 1.6A16.5 16.5 0 0 1 3.4 5.2 1.6 1.6 0 0 1 5 3.5z" />
    </svg>
  );
}

// The panel's top edge, a recessed middle between two shoulders, eased like the reel.
function notchPath(w: number, h: number) {
  const R = 22;
  const d = 22;
  const x1 = Math.round(w * 0.165);
  const x2 = Math.round(w * 0.835);
  const c = 34;
  return [
    `M0 ${R}`,
    `Q0 0 ${R} 0`,
    `L${x1} 0`,
    `C${x1 + c * 0.55} 0 ${x1 + c * 0.45} ${d} ${x1 + c} ${d}`,
    `L${x2 - c} ${d}`,
    `C${x2 - c * 0.45} ${d} ${x2 - c * 0.55} 0 ${x2} 0`,
    `L${w - R} 0`,
    `Q${w} 0 ${w} ${R}`,
    `L${w} ${h}`,
    `L0 ${h}`,
    'Z',
  ].join(' ');
}

export default function Variant5({ reduced }: { reduced: boolean }) {
  const { stageRef, progress } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.07 });
  // Reduced motion holds the reel's signature frame, the truck half lines and half particles.
  const clock = useMemo<Clock>(() => ({ p: () => (reduced ? REDUCED_P : progress.current) }), [reduced, progress]);
  const navRef = useRef<HTMLElement>(null);
  const kickRef = useRef<HTMLParagraphElement>(null);
  const say1 = useRef<HTMLHeadingElement>(null);
  const say2 = useRef<HTMLParagraphElement>(null);
  const w1 = useRef<HTMLSpanElement[]>([]);
  const w2 = useRef<HTMLSpanElement[]>([]);
  const panel = useRef<HTMLElement>(null);
  const panelIn = useRef<HTMLDivElement>(null);
  const h2b = useRef<HTMLHeadingElement>(null);
  const invalidate = useRef<(() => void) | null>(null);
  const [mainOn, setMainOn] = useState(true);
  const [wellsOn, setWellsOn] = useState(false);

  // Shape the notch to the panel's size.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const fit = () => {
      el.style.clipPath = `path('${notchPath(el.offsetWidth, el.offsetHeight + 4)}')`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const cache = new WeakMap<HTMLElement, string>();
    const set = (el: HTMLElement | null, css: string) => {
      if (!el || cache.get(el) === css) return;
      cache.set(el, css);
      el.style.cssText = css;
    };
    const reveal = (l: number, y = 0.36) =>
      l >= 1 ? 'opacity:1' : `opacity:${l.toFixed(3)};filter:blur(${((1 - l) * 12).toFixed(2)}px);transform:translateY(${((1 - l) * y).toFixed(3)}em)`;
    const words = (els: HTMLSpanElement[], a: number, b: number) => {
      const n = els.length;
      const win = 0.028;
      const step = (b - a - win) / Math.max(1, n - 1);
      els.forEach((el, i) => set(el, reveal(smooth(range(progress.current, a + i * step, a + i * step + win)))));
    };
    const block = (el: HTMLElement | null, a: number, b: number) => {
      const o = 1 - smooth(range(progress.current, a, b));
      set(el, o >= 1 ? '' : `opacity:${o.toFixed(3)};filter:blur(${((1 - o) * 10).toFixed(2)}px);transform:translateY(${(-(1 - o) * 40).toFixed(1)}px)`);
    };
    let main = true;
    let wells = false;
    let theme = 'dark';
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = progress.current;
      const vh = window.innerHeight;
      block(kickRef.current, 0.0, 0.035);
      words(w1.current, 0.1, 0.215);
      block(say1.current, 0.3, 0.345);
      words(w2.current, 0.405, 0.51);
      block(say2.current, 0.585, 0.625);

      // Panel rise, then the panel's own content scrolls up to the cards.
      const inner = panelIn.current;
      const head = h2b.current;
      if (panel.current && inner && head) {
        const rise = smooth(range(p, 0.6, 0.705));
        const maxScroll = Math.max(0, head.offsetTop - 118);
        const scroll = smooth(range(p, 0.705, 0.93)) * maxScroll;
        const y = vh * (1 - rise) + 30 * (1 - rise) - scroll;
        panel.current.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        inner.querySelectorAll<HTMLElement>('[data-rv]').forEach((el) => {
          const top = y + el.offsetTop;
          const l = clamp01((vh * 0.98 - top) / (vh * 0.28));
          set(el, reveal(smooth(l), 1.2));
        });
        const t = y + 10 < 104 ? 'light' : 'dark';
        if (t !== theme && navRef.current) {
          theme = t;
          navRef.current.dataset.theme = t;
        }
      }
      const m = p < 0.735;
      if (m !== main) {
        main = m;
        setMainOn(m);
      }
      const w = p > 0.6;
      if (w !== wells) {
        wells = w;
        setWellsOn(w);
      }
      if (main) invalidate.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, progress]);

  const panelEl = (
    <section className={`v5-panel${reduced ? ' is-still' : ''}`} ref={panel} aria-labelledby="v5-panel-h">
      <div className="v5-panel-in" ref={panelIn}>
        {/* dummy, panel headline */}
        <h2 className="v5-h2" id="v5-panel-h" data-rv>
          Pokrećemo skladišta širom Srbije, od 1997.
        </h2>
        <ul className="v5-marks" aria-label="Usluge" data-rv>
          <li>
            <span className="v5-mk v5-mk1">Novi viljuškari</span>
          </li>
          <li>
            <span className="v5-mk v5-mk2">Najam</span>
          </li>
          <li>
            <span className="v5-mk v5-mk3">Servis</span>
          </li>
        </ul>
        {/* dummy, second headline */}
        <h2 className="v5-h2 v5-h2b" ref={h2b} data-rv>
          Počnite sa jednim viljuškarom.
          <br />
          Rastite svojim tempom.
        </h2>
        <a className="v5-btn v5-btn-r v5-btn-lg" href={hero.quote.href} data-cta="quote" data-rv>
          {hero.quote.label}
        </a>
        <div className="v5-cards">
          {CARDS.map((c) => (
            <article className="v5-card" key={c.id} data-rv>
              <p className="v5-kick">{KICKERS[c.id]}</p>
              <h3>{c.name}</h3>
              <p className="v5-line-t">{c.line}</p>
              <div className="v5-well">
                <Well kind={c.id as 'novi' | 'najam' | 'servis'} active={wellsOn} still={reduced} />
              </div>
              <a className="v5-more" href={c.href}>
                {c.more}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className={`v5${reduced ? ' is-reduced' : ''}`}>
      <div className="v5-stage" ref={stageRef}>
        <div className="v5-canvas" aria-hidden="true">
          <Canvas shadows="soft" dpr={[1, 1.5]} frameloop={reduced || !mainOn ? 'demand' : 'always'} camera={{ fov: 30, near: 0.1, far: 200, position: [0.7, 0.72, 7.4] }} gl={{ antialias: true }}>
            <SceneContents clock={clock} invalidateRef={invalidate} />
          </Canvas>
        </div>
        <div className="v5-shade" aria-hidden="true" />

        <p className="v5-kicker" ref={kickRef}>
          {hero.kicker}
        </p>
        <h1 className="v5-say" ref={say1}>
          <Words lines={SAY1} refs={w1} />
        </h1>
        <p className="v5-say" ref={say2} aria-hidden={reduced ? 'true' : undefined}>
          <Words lines={SAY2} refs={w2} />
        </p>

        {!reduced && panelEl}

        <header className="v5-nav" ref={navRef} data-theme="dark">
          <a className="v5-logo" href={SITE} aria-label="Ekotehnika, početna strana">
            <img src="/brand/linde-mh.png" alt="Linde Material Handling" width={56} height={34} />
            <img src="/brand/ekotehnika.png" alt="Ekotehnika" width={88} height={24} />
          </a>
          <nav aria-label="Glavna navigacija">
            <ul>
              {LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <a className="v5-phone" href={hero.sales.tel} data-cta="call-sales">
            <PhoneIcon />
            <span className="v5-phone-l">{hero.sales.label}</span>
            <span>{hero.sales.number}</span>
          </a>
          <a className="v5-btn v5-btn-w" href={hero.service.tel} data-cta="call-service" aria-label={`${hero.service.label}, ${hero.service.number}`}>
            {hero.service.label}
          </a>
          <a className="v5-btn v5-btn-r" href={hero.quote.href} data-cta="quote">
            {hero.quote.label}
          </a>
        </header>
      </div>
      {reduced && panelEl}
    </div>
  );
}
