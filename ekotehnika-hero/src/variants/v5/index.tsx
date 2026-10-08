// Variant 5, Sistem. The second half of the Terminal Industries reel in Linde colours. A lit
// forklift at dusk is scanned into glowing edges, breaks into particles, and the particles settle
// into a dark floor of rounded tiles under converging smoke beams, while white type is revealed
// word by word. A frosted white panel with a notched top then slides up over the scene with a
// light headline, a quiet row of service names and three frosted cards. The shared nav sits on top.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScrollStory, clamp01, range, smooth } from '../../scroll/useScrollStory';
import { hero, pillars } from '../../content';
import { Nav, type NavTheme } from '../../ui/Nav';
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

// dummy, the card kickers
const KICKERS: Record<string, string> = { novi: 'Nova flota', najam: 'Od jednog dana', servis: 'Na terenu' };
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
  const kickRef = useRef<HTMLParagraphElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
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
  const [navTheme, setNavTheme] = useState<NavTheme>('dark');

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
    let theme: NavTheme = 'dark';
    const t0 = performance.now();
    // Offsets inside the panel, measured once and again on resize, never per frame.
    let rv: { el: HTMLElement; top: number }[] = [];
    let headTop = 0;
    const measure = () => {
      const inner = panelIn.current;
      if (!inner) return;
      rv = Array.from(inner.querySelectorAll<HTMLElement>('[data-rv]')).map((el) => ({ el, top: el.offsetTop }));
      headTop = h2b.current?.offsetTop ?? 0;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (panelIn.current) ro.observe(panelIn.current);
    document.fonts?.ready.then(measure);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = progress.current;
      const vh = window.innerHeight;
      // The headline arrives word by word on load, then holds over the scan until it lifts away.
      const since = (performance.now() - t0) / 1000;
      w1.current.forEach((el, i) => set(el, reveal(smooth(clamp01((since - 0.35 - i * 0.07) / 0.7)))));
      const lead = smooth(clamp01((since - 0.2) / 0.8));
      const out = 1 - smooth(range(p, 0.0, 0.045));
      const o = Math.min(lead, out);
      const lift = `opacity:${o.toFixed(3)};transform:translateY(${((1 - out) * -16).toFixed(1)}px)`;
      set(kickRef.current, o >= 1 ? 'opacity:1' : lift);
      set(subRef.current, o >= 1 ? 'opacity:1' : lift);
      block(say1.current, 0.33, 0.37);
      words(w2.current, 0.405, 0.51);
      block(say2.current, 0.585, 0.625);

      // Panel rise, then the panel's own content scrolls up to the cards.
      if (panel.current) {
        const rise = smooth(range(p, 0.6, 0.705));
        const maxScroll = Math.max(0, headTop - 118);
        const scroll = smooth(range(p, 0.705, 0.93)) * maxScroll;
        const y = vh * (1 - rise) + 30 * (1 - rise) - scroll;
        panel.current.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        for (const r of rv) {
          const l = clamp01((vh * 0.98 - (y + r.top)) / (vh * 0.28));
          set(r.el, reveal(smooth(l), 1.2));
        }
        const t: NavTheme = y + 10 < 104 ? 'glass' : 'dark';
        if (t !== theme) {
          theme = t;
          setNavTheme(t);
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
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced, progress]);

  const panelEl = (
    <section className={`v5-panel${reduced ? ' is-still' : ''}`} ref={panel} aria-labelledby="v5-panel-h">
      <div className="v5-panel-in" ref={panelIn}>
        {/* dummy, panel headline */}
        <h2 className="v5-h2" id="v5-panel-h" data-rv>
          Pokrećemo skladišta
          <br />
          širom Srbije, od 1997.
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

        <div className="v5-intro">
          <p className="v5-kicker" ref={kickRef}>
            {hero.kicker}
          </p>
          <h1 className="v5-say" ref={say1}>
            <Words lines={SAY1} refs={w1} />
          </h1>
          <p className="v5-sub" ref={subRef}>
            {hero.sub}
          </p>
        </div>
        {!reduced && (
          <p className="v5-say v5-say2" ref={say2}>
            <Words lines={SAY2} refs={w2} />
          </p>
        )}

        {!reduced && panelEl}

        <Nav theme={navTheme} />
      </div>
      {reduced && panelEl}
    </div>
  );
}
