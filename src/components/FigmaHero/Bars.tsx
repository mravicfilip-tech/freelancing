import { useEffect, useRef } from 'react';

/**
 * Floating rate chips from the Figma hero (node 2346:347), one per bar. Positions are shares of
 * the 605×521 slide; each chip's design value is the base its live figure moves around.
 */
const CHIPS = [
  { bar: 'a', label: 'SOL → USD', icon: '/figma/coin-sol.svg', prefix: '$', base: 215407.93, suffix: '', x: -10, y: 47.05, light: false },
  { bar: 'b', label: 'ETH → EUR', icon: '/figma/coin-eth.svg', prefix: '€', base: 126840.18, suffix: '', x: 17.25, y: 16.52, light: false },
  { bar: 'c', label: 'BTC → USD', icon: '/figma/coin-btc.svg', prefix: '', base: 10578827.24, suffix: ' tokens', x: 34.59, y: -3.82, light: true },
  { bar: 'd', label: 'USDT → GBP', icon: '/figma/coin-usdt.svg', prefix: '£', base: 74592.66, suffix: '', x: 71.26, y: 38.6, light: false },
] as const;
type Chip = (typeof CHIPS)[number];

const format = (chip: Chip, n: number) =>
  `${chip.prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${chip.suffix}`;

/**
 * Each bar's faces in viewBox units, from the Figma export (public/figma/bars.svg): the left
 * face's top-left corner and the face height. Everything else about a bar is derived from these,
 * so the faces can change height while the cap and the base keep their exact shape.
 */
const FACES = {
  a: { x: 6.928, y: 321, h: 161 },
  b: { x: 164.928, y: 163, h: 323 },
  c: { x: 313.928, y: 44, h: 442 },
  d: { x: 472.928, y: 276, h: 208 },
} as const;
type BarId = keyof typeof FACES;
type Face = { x: number; y: number; h: number };
const BAR_IDS = Object.keys(FACES) as BarId[];

/** The rounded hexagon cap of bars a–c, drawn at bar c's position; translated for the others. */
const CAP =
  'M369.354 4C373.18 1.79086 379.384 1.79086 383.21 4L439.502 36.5C443.328 38.7091 443.328 42.2909 439.502 44.5L384.076 76.5C380.25 78.7091 374.046 78.7091 370.22 76.5L313.928 44C310.102 41.7909 310.102 38.2091 313.928 36L369.354 4Z';

/** An outer vertical edge with its rounded top and bottom; `dir` is 1 on the left, -1 on the right. */
const edgeOuter = (x: number, t: number, b: number, dir: 1 | -1) =>
  `M${x} ${t}C${x} ${t + 1.562} ${x + dir * 1.097} ${t + 2.976} ${x + dir * 2.87} ${t + 4}V${b + 4}C${x + dir * 1.097} ${b + 2.976} ${x} ${b + 1.562} ${x} ${b}V${t}Z`;
/** The front edge where the two faces meet. */
const edgeFront = (x: number, t: number, b: number) =>
  `M${x} ${t}C${x + 3.826} ${t + 2.209} ${x + 10.03} ${t + 2.209} ${x + 13.856} ${t}V${b}C${x + 10.03} ${b + 2.209} ${x + 3.826} ${b + 2.209} ${x} ${b}V${t}Z`;
/** Outline of the two faces and front edge (the glow is clipped to it). */
const silhouette = ({ x, y, h }: Face) => {
  const fx = x + 56.29, gx = x + 70.15, rx = gx + 55.43, fy = y + 32.5;
  return `M${x} ${y}L${fx} ${fy}L${gx} ${fy}L${rx} ${y + 0.5}V${y + 0.5 + h}L${gx} ${fy + h}L${fx} ${fy + h}L${x} ${y + h}Z`;
};
/** The faces after growing by `dh`: the base stays put, the top moves up. */
const grown = (f: Face, dh: number): Face => ({ x: f.x, y: f.y - dh, h: f.h + dh });

const STROKE = { stroke: '#DADEE2', strokeWidth: 1.5 } as const;

/** One isometric bar, drawn from its face geometry. Bar c (the tallest) has solid faces. */
function Bar({ id }: { id: BarId }) {
  const f = FACES[id];
  const fo = id === 'c' ? 1 : 0.24;
  return (
    <g className="bars__bar" data-bar={id}>
      <g className="bars__cap">
        {id === 'd' ? (
          <rect width="81" height="80" rx="8" transform="matrix(0.866025 0.5 -0.866025 0.5 535.282 232)" fill="white" {...STROKE} />
        ) : (
          <path d={CAP} transform={`translate(${f.x - 313.928} ${f.y - 44})`} fill="white" {...STROKE} />
        )}
      </g>
      <rect className="bars__face" width="65" height={f.h} transform={`matrix(0.866025 0.5 0 1 ${f.x} ${f.y})`} fill="white" fillOpacity={fo} {...STROKE} />
      <rect className="bars__face" width="64" height={f.h} transform={`matrix(0.866025 -0.5 0 1 ${f.x + 70.148} ${f.y + 32.5})`} fill="white" fillOpacity={fo} {...STROKE} />
      <path className="bars__edgeL" d={edgeOuter(f.x - 2.87, f.y - 4, f.y - 4 + f.h, 1)} fill="white" fillOpacity="0.24" {...STROKE} />
      <path className="bars__edgeF" d={edgeFront(f.x + 56.292, f.y + 32.5, f.y + 32.5 + f.h)} fill="white" fillOpacity={fo} {...STROKE} />
      <g className="bars__glow" data-bar={id} opacity={id === 'c' ? 0.45 : 0} clipPath={`url(#bars-clip-${id})`}>
        <ellipse cx={f.x + 95.5} cy={f.y + 32.5 + f.h - 51.4} rx="181" ry="258" fill="url(#bars-glow-fill)" filter="url(#bars-glow-blur)" />
      </g>
      <path className="bars__edgeR" d={edgeOuter(f.x + 128.444, f.y - 3.5, f.y - 3.5 + f.h, -1)} fill="white" fillOpacity={fo} {...STROKE} />
    </g>
  );
}

/**
 * The presale slide from the Figma hero: four isometric bars, the design's lime glow on the
 * biggest, and a rate chip floating by each bar. While `active`, the strokes draw in bar by bar,
 * the fills fade up, the chips pop in, and the slide then moves like a live chart in a relay:
 * every few seconds one bar grows while the other three shrink. Only the faces change height —
 * the caps and bases keep their shape, the cap rides up with its chip — and the glow always sits
 * on whichever bar is tallest. Each figure ticks once per cycle. Leaving the slide reverts
 * everything, so the draw replays on every return. The biggest bar carries the design's "lit"
 * state (glow, solid faces and a white chip); the others sit in the default translucent state
 * with silver chips.
 */
export function Bars({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let revert: (() => void) | null = null;
    const chipNum = (bar: string) => root.querySelector<HTMLElement>(`.bars__chip[data-bar="${bar}"] .bars__chipNum`);

    // GSAP is only loaded when the slide is first shown, so it never delays the hero's first paint.
    import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const svg = root.querySelector<SVGSVGElement>('svg.bars')!;
        const bars = Array.from(root.querySelectorAll<SVGGElement>('.bars__bar'));
        const idOf = (bar: SVGGElement) => bar.dataset.bar as BarId;
        const chipOf = (bar: SVGGElement) => root.querySelector<HTMLElement>(`.bars__chip[data-bar="${idOf(bar)}"]`);
        const innerOf = (bar: SVGGElement) => chipOf(bar)?.querySelector<HTMLElement>('.bars__chipInner') ?? null;
        const glowOf = (bar: SVGGElement) => bar.querySelector<SVGGElement>('.bars__glow');
        const rand = (a: number, b: number) => a + Math.random() * (b - a);
        const unit = () => svg.getBoundingClientRect().width / 606; // CSS px per viewBox unit

        // Height of each bar's faces, as growth over the design (viewBox units).
        const growth = new Map<SVGGElement, number>(bars.map((bar) => [bar, 0]));
        const render = (bar: SVGGElement, dh: number) => {
          const f = FACES[idOf(bar)];
          const g = grown(f, dh);
          gsap.set(bar.querySelector('.bars__cap'), { y: -dh });
          bar.querySelectorAll<SVGRectElement>('.bars__face').forEach((r) => {
            r.setAttribute('y', String(-dh));
            r.setAttribute('height', String(g.h));
          });
          bar.querySelector('.bars__edgeL')!.setAttribute('d', edgeOuter(f.x - 2.87, g.y - 4, f.y - 4 + f.h, 1));
          bar.querySelector('.bars__edgeF')!.setAttribute('d', edgeFront(f.x + 56.292, g.y + 32.5, f.y + 32.5 + f.h));
          bar.querySelector('.bars__edgeR')!.setAttribute('d', edgeOuter(f.x + 128.444, g.y - 3.5, f.y - 3.5 + f.h, -1));
          root.querySelector(`#bars-clip-${idOf(bar)} path`)!.setAttribute('d', silhouette(g));
          const chip = chipOf(bar);
          if (chip) gsap.set(chip, { y: -dh * unit() });
        };

        // A figure changes once per move: the old value rolls up and out, the new one rolls in.
        const tickTo = (chip: Chip, num: HTMLElement, next: number, lead: boolean) => {
          gsap
            .timeline({ delay: 0.3 })
            .to(num, { yPercent: -60, opacity: 0, duration: 0.24, ease: 'power2.in' })
            .add(() => {
              num.textContent = format(chip, next);
            })
            .fromTo(num, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.36, ease: 'power2.out' });
          if (lead) gsap.fromTo(num, { color: '#4042d2' }, { color: '#122433', duration: 1.6, ease: 'power1.out', delay: 0.54 });
        };

        // Idle: live data as a relay. Each cycle one bar (never the same twice) grows while the
        // other three shrink; the glow moves to whichever bar ends up tallest; every chip rides
        // its cap and its figure ticks a few percent the same way.
        let leader: SVGGElement | undefined = bars[2];
        const cycle = () => {
          const others = bars.filter((bar) => bar !== leader);
          leader = others[Math.floor(Math.random() * others.length)];
          const duration = rand(1.8, 2.6);
          const target = new Map<SVGGElement, number>();
          bars.forEach((bar) => {
            const f = FACES[idOf(bar)];
            const headroom = f.y - 40 - 10; // the cap's top (40 above the faces) stays inside the slide
            target.set(bar, bar === leader ? Math.max(8, Math.min(rand(60, 130), headroom)) : -rand(0.15, 0.4) * f.h);
          });
          const capTop = (bar: SVGGElement) => FACES[idOf(bar)].y - target.get(bar)!;
          const tallest = bars.reduce((best, bar) => (capTop(bar) < capTop(best) ? bar : best));
          bars.forEach((bar) => {
            const lead = bar === leader;
            const proxy = { dh: growth.get(bar) ?? 0 };
            gsap.to(proxy, {
              dh: target.get(bar)!,
              duration: duration * rand(0.9, 1.1),
              ease: 'power2.inOut',
              onUpdate: () => {
                growth.set(bar, proxy.dh);
                render(bar, proxy.dh);
              },
            });
            const glow = glowOf(bar);
            // The glow hands over around the moment the bars cross, not when they set off.
            const big = bar === tallest;
            if (glow) gsap.to(glow, { opacity: big ? 0.5 : 0, duration: 0.9, delay: duration * 0.4, ease: 'power1.inOut' });
            // The biggest bar also has the design's solid faces; the rest go back to translucent.
            gsap.to(bar.querySelectorAll('.bars__face, .bars__edgeF, .bars__edgeR'), { fillOpacity: big ? 1 : 0.24, duration: 0.9, delay: duration * 0.4, ease: 'power1.inOut' });
            // …and its chip goes white, while the chip that was white returns to silver.
            const inner = innerOf(bar);
            if (inner) gsap.to(inner, { backgroundColor: big ? '#ffffff' : '#f1f3f4', duration: 0.9, delay: duration * 0.4, ease: 'power1.inOut' });
            if (lead) gsap.fromTo(bar.querySelector('.bars__cap > *'), { stroke: '#b3b5f5' }, { stroke: '#DADEE2', duration: 1.4, ease: 'power1.out' });
            const chip = CHIPS.find((c) => c.bar === idOf(bar));
            const num = chip && chipNum(chip.bar);
            if (chip && num) tickTo(chip, num, chip.base * (1 + (target.get(bar)! / FACES[idOf(bar)].h) * 0.08), lead);
          });
          gsap.delayedCall(duration + rand(0.6, 1.2), cycle);
        };

        const entry = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            gsap.delayedCall(0.6, cycle);
            // Each chip also bobs on its own rhythm, so the slide never sits still between cycles.
            bars.forEach((bar) => {
              const inner = innerOf(bar);
              if (inner) gsap.to(inner, { y: rand(-8, -4), duration: rand(2.2, 3.4), delay: rand(0, 1), yoyo: true, repeat: -1, ease: 'sine.inOut' });
            });
          },
        });

        bars.forEach((bar, i) => {
          const strokes = Array.from(bar.querySelectorAll<SVGGeometryElement>(':scope > path, :scope > rect, .bars__cap > *'));
          const at = i * 0.16;
          strokes.forEach((el) => {
            const len = el.getTotalLength();
            const fill = Number(el.getAttribute('fill-opacity') ?? 1);
            gsap.set(el, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
            entry.to(el, { strokeDashoffset: 0, duration: 1.1 }, at);
            entry.to(el, { fillOpacity: fill, duration: 0.6, ease: 'power1.out' }, at + 0.55);
          });
          entry.fromTo(bar, { y: 18 }, { y: 0, duration: 1.0, ease: 'power3.out' }, at);
          const inner = innerOf(bar);
          if (inner) entry.from(inner, { y: 16, scale: 0.9, opacity: 0, duration: 0.6, ease: 'back.out(1.8)' }, at + 0.85);
        });
        const litGlow = glowOf(bars[2]);
        if (litGlow) entry.fromTo(litGlow, { opacity: 0 }, { opacity: 0.45, duration: 1.2, ease: 'power1.out' }, 2 * 0.16 + 0.7);
      }, root);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
      // The relay wrote attributes and text outside GSAP's control; put the design back.
      root.querySelectorAll<SVGGElement>('.bars__bar').forEach((bar) => {
        const id = bar.dataset.bar as BarId;
        const f = FACES[id];
        bar.querySelectorAll<SVGRectElement>('.bars__face').forEach((r) => {
          r.setAttribute('y', '0');
          r.setAttribute('height', String(f.h));
        });
        bar.querySelector('.bars__edgeL')?.setAttribute('d', edgeOuter(f.x - 2.87, f.y - 4, f.y - 4 + f.h, 1));
        bar.querySelector('.bars__edgeF')?.setAttribute('d', edgeFront(f.x + 56.292, f.y + 32.5, f.y + 32.5 + f.h));
        bar.querySelector('.bars__edgeR')?.setAttribute('d', edgeOuter(f.x + 128.444, f.y - 3.5, f.y - 3.5 + f.h, -1));
        root.querySelector(`#bars-clip-${id} path`)?.setAttribute('d', silhouette(f));
      });
      CHIPS.forEach((chip) => {
        const num = chipNum(chip.bar);
        if (num) num.textContent = format(chip, chip.base);
      });
    };
  }, [active]);

  return (
    <div ref={ref} className="barsSlide">
      <svg className="bars" viewBox="0 0 606 521" width={605} height={520} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          {/* The design's lime glow: a blurred gradient ellipse, clipped to whichever bar carries it. The
              filter and gradient are relative to the ellipse so one of each serves all four bars. */}
          <filter id="bars-glow-blur" x="-0.2" y="-0.2" width="1.4" height="1.4" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="31.8" />
          </filter>
          <linearGradient id="bars-glow-fill" x1="1" y1="0" x2="0" y2="0">
            <stop stopColor="#F5F7FA" />
            <stop offset="1" stopColor="#F9FF38" />
          </linearGradient>
          {BAR_IDS.map((id) => (
            <clipPath id={`bars-clip-${id}`} key={id}>
              <path d={silhouette(FACES[id])} />
            </clipPath>
          ))}
        </defs>
        {BAR_IDS.map((id) => (
          <Bar id={id} key={id} />
        ))}
      </svg>
      {CHIPS.map((chip) => (
        <div
          key={chip.bar}
          className={`bars__chip${chip.light ? ' bars__chip--light' : ''}`}
          data-bar={chip.bar}
          style={{ '--x': `${chip.x}%`, '--y': `${chip.y}%` } as React.CSSProperties}
        >
          <div className="bars__chipInner">
            <span className="bars__chipLabel">
              {chip.label}
              <img src={chip.icon} alt="" width={14} height={14} />
            </span>
            <span className="bars__chipValue">
              <span className="bars__chipNum">{format(chip, chip.base)}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
