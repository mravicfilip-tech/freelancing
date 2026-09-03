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

/** Each bar's faces in viewBox units: the left face's top-left corner and the face height. */
const FACES = {
  a: { x: 6.928, y: 321, h: 161 },
  b: { x: 164.928, y: 163, h: 323 },
  c: { x: 313.928, y: 44, h: 442 },
  d: { x: 472.928, y: 276, h: 208 },
} as const;
type BarId = keyof typeof FACES;

/** Outline of a bar's two faces and front edge (the design's glow is clipped to this shape). */
function silhouette({ x, y, h }: { x: number; y: number; h: number }) {
  const fx = x + 56.29; // left face's front edge (0.866 × 65)
  const gx = x + 70.15; // right face's front edge, across the rounded corner
  const rx = gx + 55.43; // right face's outer edge (0.866 × 64)
  const fy = y + 32.5; // front top, 0.5 × 65 below the corners
  return `M${x} ${y}L${fx} ${fy}L${gx} ${fy}L${rx} ${y + 0.5}V${y + 0.5 + h}L${gx} ${fy + h}L${fx} ${fy + h}L${x} ${y + h}Z`;
}

/** The design's lime glow, positioned for one bar; lit on the bar that is rising. */
function Glow({ bar }: { bar: BarId }) {
  const f = FACES[bar];
  const bottom = f.y + 32.5 + f.h;
  return (
    <g className="bars__glow" data-bar={bar} opacity={bar === 'c' ? 0.45 : 0} clipPath={`url(#bars-clip-${bar})`}>
      <ellipse cx={f.x + 95.5} cy={bottom - 51.4} rx="181" ry="258" fill="url(#bars-glow-fill)" filter="url(#bars-glow-blur)" />
    </g>
  );
}

/**
 * The presale slide from the Figma hero: four isometric bars (inlined from the design so GSAP can
 * draw them), a lime glow on the tallest, and a rate chip floating by each bar. While `active`,
 * the strokes draw in bar by bar, the fills fade up, the chips pop in, and the slide then keeps
 * moving like a live chart: every few seconds one bar rises and takes the glow while the other
 * three sink, the chips ride on the caps, and each figure ticks once to a value a few percent
 * along. Leaving the slide reverts everything, so the draw replays on every return.
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
        const chipOf = (bar: SVGGElement) => root.querySelector<HTMLElement>(`.bars__chip[data-bar="${bar.dataset.bar}"]`);
        const innerOf = (bar: SVGGElement) => chipOf(bar)?.querySelector<HTMLElement>('.bars__chipInner') ?? null;
        const rand = (a: number, b: number) => a + Math.random() * (b - a);

        // Each bar's footprint in viewBox units, measured from its faces before anything moves
        // (the glow's blurred ellipse would otherwise stretch the tallest bar's box far below it).
        // Bars scale from their base; a chip follows its bar's cap by the same distance in CSS px.
        const R = svg.getBoundingClientRect();
        const k0 = R.width / 606;
        const geom = new Map(
          bars.map((bar) => {
            let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
            bar.querySelectorAll(':scope > path, :scope > rect').forEach((el) => {
              const r = el.getBoundingClientRect();
              top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); left = Math.min(left, r.left); right = Math.max(right, r.right);
            });
            return [bar, { top: (top - R.top) / k0, bottom: (bottom - R.top) / k0, cx: ((left + right) / 2 - R.left) / k0 }] as const;
          }),
        );
        const unit = () => svg.getBoundingClientRect().width / 606;
        const scaleBar = (bar: SVGGElement, s: number) => {
          const g = geom.get(bar)!;
          gsap.set(bar, { scaleY: s, svgOrigin: `${g.cx} ${g.bottom}` });
          const chip = chipOf(bar);
          if (chip) gsap.set(chip, { y: -(s - 1) * (g.bottom - g.top) * unit() });
        };
        const current = new Map<SVGGElement, number>(bars.map((bar) => [bar, 1]));
        const glowOf = (bar: SVGGElement) => root.querySelector<SVGGElement>(`.bars__glow[data-bar="${bar.dataset.bar}"]`);
        // How far a bar may grow before its cap (and the chip above it) leaves the slide.
        const headroom = (bar: SVGGElement) => {
          const g = geom.get(bar)!;
          return 1 + Math.max(0, g.top - 12) / (g.bottom - g.top);
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

        // Idle: live data as a relay. Each cycle one bar (never the same twice) rises and lights up
        // while the other three sink and go dark; every bar's chip rides its cap and its figure
        // ticks a few percent the same way.
        let leader: SVGGElement | undefined = bars[2]; // BTC is lit when the slide arrives, as in the design
        const cycle = () => {
          const others = bars.filter((bar) => bar !== leader);
          leader = others[Math.floor(Math.random() * others.length)];
          const duration = rand(1.8, 2.6);
          bars.forEach((bar) => {
            const lead = bar === leader;
            const factor = lead ? Math.max(1.04, Math.min(rand(1.12, 1.25), headroom(bar))) : rand(0.6, 0.85);
            const proxy = { s: current.get(bar) ?? 1 };
            gsap.to(proxy, {
              s: factor,
              duration: duration * rand(0.9, 1.1),
              ease: 'power2.inOut',
              onUpdate: () => {
                current.set(bar, proxy.s);
                scaleBar(bar, proxy.s);
              },
            });
            const glow = glowOf(bar);
            if (glow) gsap.to(glow, { opacity: lead ? 0.5 : 0, duration: 0.9, ease: 'power1.inOut' });
            if (lead && bar.firstElementChild) gsap.fromTo(bar.firstElementChild, { stroke: '#b3b5f5' }, { stroke: '#DADEE2', duration: 1.4, ease: 'power1.out' });
            const chip = CHIPS.find((c) => c.bar === bar.dataset.bar);
            const num = chip && chipNum(chip.bar);
            if (chip && num) tickTo(chip, num, chip.base * (1 + (factor - 1) * 0.08), lead);
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
          const strokes = Array.from(bar.querySelectorAll<SVGGeometryElement>(':scope > path, :scope > rect'));
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
      // The counters wrote into the DOM outside GSAP's control; put the design values back.
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
        {(Object.keys(FACES) as BarId[]).map((bar) => (
          <clipPath id={`bars-clip-${bar}`} key={bar}>
            <path d={silhouette(FACES[bar])} />
          </clipPath>
        ))}
      </defs>
      {/* Bar a: x 4–135, the shortest */}
      <g className="bars__bar" data-bar="a">
        <path d="M62.354 281C66.1804 278.791 72.3841 278.791 76.2104 281L132.502 313.5C136.328 315.709 136.328 319.291 132.502 321.5L77.0765 353.5C73.2501 355.709 67.0464 355.709 63.22 353.5L6.9284 321C3.10206 318.791 3.10205 315.209 6.9284 313L62.354 281Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="161" transform="matrix(0.866025 0.5 0 1 6.92773 321)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="161" transform="matrix(0.866025 -0.5 0 1 77.0762 353.5)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M4.05859 317C4.05859 318.562 5.15527 319.976 6.92835 321V482C5.15527 480.976 4.05859 479.562 4.05859 478V317Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M63.2197 353.5C67.0461 355.709 73.2498 355.709 77.0761 353.5V514.5C73.2498 516.709 67.0461 516.709 63.2197 514.5V353.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <Glow bar="a" />
        <path d="M135.372 317.5C135.372 319.062 134.275 320.476 132.502 321.5V482.5C134.275 481.476 135.372 480.062 135.372 478.5V317.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
      {/* Bar b: x 162–293 */}
      <g className="bars__bar" data-bar="b">
        <path d="M220.354 123C224.18 120.791 230.384 120.791 234.21 123L290.502 155.5C294.328 157.709 294.328 161.291 290.502 163.5L235.076 195.5C231.25 197.709 225.046 197.709 221.22 195.5L164.928 163C161.102 160.791 161.102 157.209 164.928 155L220.354 123Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="323" transform="matrix(0.866025 0.5 0 1 164.928 163)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="323" transform="matrix(0.866025 -0.5 0 1 235.076 195.5)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M162.059 159C162.059 160.562 163.155 161.976 164.928 163V486C163.155 484.976 162.059 483.562 162.059 482V159Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M221.22 195.5C225.046 197.709 231.25 197.709 235.076 195.5V518.5C231.25 520.709 225.046 520.709 221.22 518.5V195.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <Glow bar="b" />
        <path d="M293.372 159.5C293.372 161.062 292.275 162.476 290.502 163.5V486.5C292.275 485.476 293.372 484.062 293.372 482.5V159.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
      {/* Bar c: x 311–442, the tallest */}
      <g className="bars__bar" data-bar="c">
        <path d="M369.354 4C373.18 1.79086 379.384 1.79086 383.21 4L439.502 36.5C443.328 38.7091 443.328 42.2909 439.502 44.5L384.076 76.5C380.25 78.7091 374.046 78.7091 370.22 76.5L313.928 44C310.102 41.7909 310.102 38.2091 313.928 36L369.354 4Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="442" transform="matrix(0.866025 0.5 0 1 313.928 44)" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="442" transform="matrix(0.866025 -0.5 0 1 384.076 76.5)" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M311.059 40C311.059 41.5621 312.155 42.9763 313.928 44V486C312.155 484.976 311.059 483.562 311.059 482V40Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M370.22 76.5C374.046 78.7091 380.25 78.7091 384.076 76.5V518.5C380.25 520.709 374.046 520.709 370.22 518.5V76.5Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <Glow bar="c" />
        <path d="M442.372 40.5C442.372 42.0621 441.275 43.4763 439.502 44.5V486.5C441.275 485.476 442.372 484.062 442.372 482.5V40.5Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
      {/* Bar d: x 470–601, the rounded cap */}
      <g className="bars__bar" data-bar="d">
        <rect width="81" height="80" rx="8" transform="matrix(0.866025 0.5 -0.866025 0.5 535.282 232)" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="208" transform="matrix(0.866025 0.5 0 1 472.928 276)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="208" transform="matrix(0.866025 -0.5 0 1 543.076 308.5)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M470.059 272C470.059 273.562 471.155 274.976 472.928 276V484C471.155 482.976 470.059 481.562 470.059 480V272Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M529.22 308.5C533.046 310.709 539.25 310.709 543.076 308.5V516.5C539.25 518.709 533.046 518.709 529.22 516.5V308.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <Glow bar="d" />
        <path d="M601.372 272.5C601.372 274.062 600.275 275.476 598.502 276.5V484.5C600.275 483.476 601.372 482.062 601.372 480.5V272.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
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
