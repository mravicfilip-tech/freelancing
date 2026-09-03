import { useEffect, useRef } from 'react';

/**
 * The four isometric bars from the Figma hero (public/figma/bars.svg), inlined so GSAP can draw
 * them. While `active`, the strokes draw in bar by bar, the fills fade up, and the bars then keep
 * easing to new heights like a live chart. Leaving the slide reverts everything, so the draw
 * replays on every return.
 */
export function Bars({ active }: { active: boolean }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!active || !svg) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let revert: (() => void) | null = null;

    // GSAP is only loaded when the slide is first shown, so it never delays the hero's first paint.
    import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const bars = Array.from(svg.querySelectorAll<SVGGElement>('.bars__bar'));
        // Idle: live data. Each bar keeps easing to a new height from its base on its own rhythm,
        // and its cap flicks indigo as the value changes, so the chart reads as updating.
        const rand = (a: number, b: number) => a + Math.random() * (b - a);
        const nextValue = (bar: SVGGElement, cap: Element | null) => {
          gsap.to(bar, {
            scaleY: rand(0.86, 1.1),
            transformOrigin: '50% 100%',
            duration: rand(1.4, 2.6),
            ease: 'power2.inOut',
            onComplete: () => {
              gsap.delayedCall(rand(0.4, 1.6), () => nextValue(bar, cap));
            },
          });
          if (cap) gsap.fromTo(cap, { stroke: '#b3b5f5' }, { stroke: '#DADEE2', duration: 1.2, ease: 'power1.out' });
        };

        const entry = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            bars.forEach((bar, i) => {
              gsap.delayedCall(i * 0.35, () => nextValue(bar, bar.firstElementChild));
            });
          },
        });

        bars.forEach((bar, i) => {
          const strokes = Array.from(bar.querySelectorAll<SVGGeometryElement>('path, rect'));
          const at = i * 0.16;
          strokes.forEach((el) => {
            const len = el.getTotalLength();
            const fill = Number(el.getAttribute('fill-opacity') ?? 1);
            gsap.set(el, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
            entry.to(el, { strokeDashoffset: 0, duration: 1.1 }, at);
            entry.to(el, { fillOpacity: fill, duration: 0.6, ease: 'power1.out' }, at + 0.55);
          });
          entry.fromTo(bar, { y: 18 }, { y: 0, duration: 1.0, ease: 'power3.out' }, at);
        });
      }, svg);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [active]);

  return (
    <svg ref={ref} className="bars" viewBox="0 0 606 521" width={605} height={520} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Bar a: x 4–135, the shortest */}
      <g className="bars__bar" data-bar="a">
        <path d="M62.354 281C66.1804 278.791 72.3841 278.791 76.2104 281L132.502 313.5C136.328 315.709 136.328 319.291 132.502 321.5L77.0765 353.5C73.2501 355.709 67.0464 355.709 63.22 353.5L6.9284 321C3.10206 318.791 3.10205 315.209 6.9284 313L62.354 281Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="161" transform="matrix(0.866025 0.5 0 1 6.92773 321)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="161" transform="matrix(0.866025 -0.5 0 1 77.0762 353.5)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M4.05859 317C4.05859 318.562 5.15527 319.976 6.92835 321V482C5.15527 480.976 4.05859 479.562 4.05859 478V317Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M63.2197 353.5C67.0461 355.709 73.2498 355.709 77.0761 353.5V514.5C73.2498 516.709 67.0461 516.709 63.2197 514.5V353.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M135.372 317.5C135.372 319.062 134.275 320.476 132.502 321.5V482.5C134.275 481.476 135.372 480.062 135.372 478.5V317.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
      {/* Bar b: x 162–293 */}
      <g className="bars__bar" data-bar="b">
        <path d="M220.354 123C224.18 120.791 230.384 120.791 234.21 123L290.502 155.5C294.328 157.709 294.328 161.291 290.502 163.5L235.076 195.5C231.25 197.709 225.046 197.709 221.22 195.5L164.928 163C161.102 160.791 161.102 157.209 164.928 155L220.354 123Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="323" transform="matrix(0.866025 0.5 0 1 164.928 163)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="323" transform="matrix(0.866025 -0.5 0 1 235.076 195.5)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M162.059 159C162.059 160.562 163.155 161.976 164.928 163V486C163.155 484.976 162.059 483.562 162.059 482V159Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M221.22 195.5C225.046 197.709 231.25 197.709 235.076 195.5V518.5C231.25 520.709 225.046 520.709 221.22 518.5V195.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M293.372 159.5C293.372 161.062 292.275 162.476 290.502 163.5V486.5C292.275 485.476 293.372 484.062 293.372 482.5V159.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
      {/* Bar c: x 311–442, the tallest */}
      <g className="bars__bar" data-bar="c">
        <path d="M369.354 4C373.18 1.79086 379.384 1.79086 383.21 4L439.502 36.5C443.328 38.7091 443.328 42.2909 439.502 44.5L384.076 76.5C380.25 78.7091 374.046 78.7091 370.22 76.5L313.928 44C310.102 41.7909 310.102 38.2091 313.928 36L369.354 4Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="442" transform="matrix(0.866025 0.5 0 1 313.928 44)" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="442" transform="matrix(0.866025 -0.5 0 1 384.076 76.5)" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M311.059 40C311.059 41.5621 312.155 42.9763 313.928 44V486C312.155 484.976 311.059 483.562 311.059 482V40Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M370.22 76.5C374.046 78.7091 380.25 78.7091 384.076 76.5V518.5C380.25 520.709 374.046 520.709 370.22 518.5V76.5Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M442.372 40.5C442.372 42.0621 441.275 43.4763 439.502 44.5V486.5C441.275 485.476 442.372 484.062 442.372 482.5V40.5Z" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
      {/* Bar d: x 470–601, the rounded cap */}
      <g className="bars__bar" data-bar="d">
        <rect width="81" height="80" rx="8" transform="matrix(0.866025 0.5 -0.866025 0.5 535.282 232)" fill="white" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="65" height="208" transform="matrix(0.866025 0.5 0 1 472.928 276)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <rect width="64" height="208" transform="matrix(0.866025 -0.5 0 1 543.076 308.5)" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M470.059 272C470.059 273.562 471.155 274.976 472.928 276V484C471.155 482.976 470.059 481.562 470.059 480V272Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M529.22 308.5C533.046 310.709 539.25 310.709 543.076 308.5V516.5C539.25 518.709 533.046 518.709 529.22 516.5V308.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
        <path d="M601.372 272.5C601.372 274.062 600.275 275.476 598.502 276.5V484.5C600.275 483.476 601.372 482.062 601.372 480.5V272.5Z" fill="white" fillOpacity="0.24" stroke="#DADEE2" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
