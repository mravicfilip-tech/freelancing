import { useEffect, useMemo, useRef } from 'react';
import chestMarkup from './chest.svg?raw';
import { useChest, type ChestId } from './chestVariant';
import './ChestSlide.css';

/**
 * The hero's third slide: the line-art chest from Figma (node 2767:55).
 *
 * The export is 226 separately named stroke segments in one `crate-lines` group — the designer
 * split it that way, so the crate is drawn rather than shown. Every direction below is the same
 * drawing; they differ in the order the segments arrive, what the drawing settles into, and what
 * the field around it does meanwhile.
 *
 * The asset is inlined at build time rather than fetched: the segments have to be in the document
 * to be animated individually, and a 31KB file is not worth a request and a flash of nothing.
 */

/** A measured segment: where its middle sits in viewBox units, and how long its stroke is. */
type Seg = { el: SVGPathElement; len: number; cx: number; cy: number };

/** How long the whole crate takes to draw itself in, per direction. */
const DRAW = 1.5;

/** The lid is the top of the box; everything below the cut is the body it lifts off. */
const LID_CUT = 0.38;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * The dotted field behind the chest. Each direction gets the one that suits it, and they are all
 * built from the site's own dot-and-dash language rather than a new decoration.
 */
function Backdrop({ variant }: { variant: ChestId }) {
  if (variant === '1') {
    return (
      <>
        <div className="chest__floor" aria-hidden="true" />
        <div className="chest__shadow" aria-hidden="true" />
      </>
    );
  }
  if (variant === '2') {
    return (
      <>
        <div className="chest__rules" aria-hidden="true" />
        <div className="chest__scan" aria-hidden="true" />
      </>
    );
  }
  if (variant === '3') {
    return (
      <svg className="chest__rings" viewBox="0 0 400 400" aria-hidden="true">
        <circle className="chest__ring chest__ring--a" cx="200" cy="200" r="178" />
        <circle className="chest__ring chest__ring--b" cx="200" cy="200" r="150" />
      </svg>
    );
  }
  if (variant === '4') {
    // A field rather than a texture: the dots have to be elements to twinkle one at a time.
    return (
      <div className="chest__field" aria-hidden="true">
        {Array.from({ length: 96 }, (_, i) => (
          <i key={i} style={{ left: `${(i % 12) * 9 + 3}%`, top: `${Math.floor(i / 12) * 11 + 6}%` }} />
        ))}
      </div>
    );
  }
  return (
    <div className="chest__sparks" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

export function ChestSlide({ active }: { active: boolean }) {
  const variant = useChest();
  const host = useRef<HTMLDivElement>(null);
  // The markup is a build-time constant from this repo. `preserveAspectRatio` is the one thing the
  // export gets wrong for our box — it ships `none`, which would stretch the crate to the slide's
  // shape — so it is corrected here rather than by editing the asset's bytes.
  const markup = useMemo(() => chestMarkup.replace('preserveAspectRatio="none"', 'preserveAspectRatio="xMidYMid meet"'), []);

  useEffect(() => {
    const root = host.current;
    if (!active || !root) return;
    const svg = root.querySelector('svg');
    if (!svg) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: { revert: () => void } | undefined;
    let live = true;

    // Measure once. getBBox is a layout read, so all 226 happen together before anything is set.
    const segs: Seg[] = Array.from(svg.querySelectorAll<SVGPathElement>('path[id^="seg-"]')).map((el) => {
      const b = el.getBBox();
      return { el, len: el.getTotalLength(), cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
    });
    if (!segs.length) return;

    const ys = segs.map((s) => s.cy);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = maxY - minY || 1;
    const midX = (Math.min(...segs.map((s) => s.cx)) + Math.max(...segs.map((s) => s.cx))) / 2;
    const midY = (minY + maxY) / 2;
    const maxR = Math.max(...segs.map((s) => Math.hypot(s.cx - midX, s.cy - midY))) || 1;

    /** 0 at the bottom of the crate, 1 at its top. */
    const up = (s: Seg) => (maxY - s.cy) / span;
    /** 0 at the top, 1 at the bottom. */
    const down = (s: Seg) => (s.cy - minY) / span;
    const lid = (s: Seg) => down(s) < LID_CUT;

    /** When each segment starts drawing, per direction. */
    const delayOf = (s: Seg): number => {
      switch (variant) {
        case '1':
          return up(s) * DRAW;
        case '2':
          return down(s) * DRAW;
        case '3':
          return (Math.hypot(s.cx - midX, s.cy - midY) / maxR) * DRAW;
        case '4':
          return Math.random() * DRAW;
        default:
          // The body first, then the lid on top of it, with a beat between the two.
          return lid(s) ? DRAW * 0.62 + down(s) * DRAW * 0.3 : down(s) * DRAW * 0.55;
      }
    };

    import('gsap').then(({ gsap }) => {
      if (!live) return;
      ctx = gsap.context(() => {
        const lidEls = segs.filter(lid).map((s) => s.el);

        if (reduced) {
          // Drawn, not drawing: the still frame is the whole design for a reader who asked for it.
          gsap.set(
            segs.map((s) => s.el),
            { strokeDasharray: 'none', strokeDashoffset: 0, opacity: 1 },
          );
          root.dataset.motion = 'ready';
          return;
        }

        segs.forEach((s) => {
          gsap.set(s.el, { strokeDasharray: s.len, strokeDashoffset: s.len, opacity: 0 });
        });

        const tl = gsap.timeline();
        segs.forEach((s) => {
          const at = delayOf(s);
          tl.to(s.el, { opacity: 1, duration: 0.14, ease: 'none' }, at);
          tl.to(s.el, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, at);
          // Scatter lands each segment from a few px out, which is what makes it read as landing
          // rather than as an arbitrary order.
          if (variant === '4') {
            tl.fromTo(
              s.el,
              { x: rand(-9, 9), y: rand(-9, 9) },
              { x: 0, y: 0, duration: 0.5, ease: 'power3.out' },
              at,
            );
          }
        });

        root.dataset.motion = 'ready';

        // ---- what it settles into ----
        if (variant === '1') {
          gsap.to(svg, { y: -7, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
          gsap.to('.chest__shadow', { scaleX: 0.92, opacity: 0.5, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
        }

        if (variant === '2') {
          // The line keeps travelling, and each segment brightens as it goes by — the drawing is
          // done, so the loop re-reads it rather than redrawing it.
          const sweep = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: DRAW + 0.4 });
          sweep.fromTo('.chest__scan', { top: '4%', opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);
          sweep.to('.chest__scan', { top: '94%', duration: 2.2, ease: 'none' }, 0);
          sweep.to('.chest__scan', { opacity: 0, duration: 0.3 }, 2.0);
          segs.forEach((s) => {
            sweep.to(s.el, { opacity: 0.45, duration: 0.16, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.2 + down(s) * 1.9);
          });
        }

        if (variant === '3') {
          gsap.to('.chest__ring--a', { rotation: 360, duration: 34, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
          gsap.to('.chest__ring--b', { rotation: -360, duration: 26, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
          gsap.fromTo('.chest__rings', { opacity: 0 }, { opacity: 1, duration: 0.9, delay: DRAW * 0.4 });
        }

        if (variant === '4') {
          gsap.utils.toArray<HTMLElement>('.chest__field i').forEach((dot) => {
            gsap.fromTo(
              dot,
              { opacity: 0 },
              {
                opacity: rand(0.25, 0.9),
                duration: rand(0.8, 1.8),
                delay: rand(0, DRAW),
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
              },
            );
          });
        }

        if (variant === '5') {
          gsap.to(lidEls, { y: -12, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW + 0.3 });
          gsap.utils.toArray<HTMLElement>('.chest__sparks i').forEach((sp, i) => {
            gsap.fromTo(
              sp,
              { y: 0, opacity: 0, x: rand(-46, 46) },
              {
                y: rand(-70, -120),
                opacity: 0,
                keyframes: { opacity: [0, 0.85, 0] },
                duration: rand(2.2, 3.6),
                delay: DRAW + i * 0.22,
                repeat: -1,
                ease: 'power1.out',
              },
            );
          });
        }
      }, root);
    });

    return () => {
      live = false;
      ctx?.revert();
    };
  }, [active, variant]);

  return (
    <div ref={host} className="chest" data-variant={variant} data-motion="pending">
      <Backdrop variant={variant} />
      <div className="chest__art" dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  );
}
