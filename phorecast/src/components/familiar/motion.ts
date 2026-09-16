// Motion for "Familiar Trading" (Figma 244:1465).
//
// One entrance timeline, built by `useSectionMotion` the first time the section
// is on screen: the light wakes and the horizon opens along the bottom edge, the
// phone arrives and fills in, the cards fall into formation around it, and the
// chips pop up off the crest.
//
// Once that has settled a second, separate layer gives the floating cards a slow
// idle drift and a light scroll parallax. It is not part of the entrance — it is
// paused whenever the section is off screen and killed with the component.
//
// Everything animates *from* the rendered baseline, so a section whose script
// never ran is simply the static design. `prefers-reduced-motion: reduce` gets
// the finished state (`useSectionMotion` seeks the timeline to its end) and no
// idle motion at all.
//
// `?still=1` is a review helper, in the spirit of `?slide=`: the entrance still
// runs, the idle layer never starts, so a screenshot at rest can be diffed
// against the static design pixel for pixel.

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { EASE, REDUCED, revealUp, useSectionMotion } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';

/** Cards arrive from above and a hair past their mark, then settle onto it. */
const LAND = 'back.out(1.1)';

/** Where the entrance is over, in ms — when the idle layer may take over. */
const SETTLED = 1750;

const STILL =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('still');

/** One design pixel, the same unit the stylesheet lays the stage out in. */
const unit = (el: HTMLElement) =>
  (el.querySelector<HTMLElement>('.fam__stage')?.clientWidth || 1920) / 1920;

function build({ el, q, tl }: SectionMotion) {
  const one = (selector: string) => el.querySelector<HTMLElement>(selector);
  const u = unit(el);

  /** A card falls into formation: in from its own side, down, and slightly past. */
  const land = (
    target: HTMLElement | null,
    at: number,
    { x = 0, y = -38, scale = 1.06, duration = 0.58 } = {},
  ) => {
    if (!target) return;
    tl.from(
      target,
      {
        x: x * u,
        y: y * u,
        scale,
        duration,
        ease: LAND,
        transformOrigin: '50% 60%',
        clearProps: 'transform',
      },
      at,
    ).from(target, { opacity: 0, duration: 0.28, ease: 'power2.out', clearProps: 'opacity' }, at);
  };

  // 1 — The light wakes. The glow stack swells, and the horizon ellipse drops
  // back onto its mark, which opens the bright crest up from the bottom edge.
  tl.from(
    q('.fam__g'),
    {
      scale: 0.9,
      opacity: 0.3,
      duration: 1,
      stagger: 0.06,
      ease: 'power2.out',
      transformOrigin: '50% 70%',
      clearProps: 'transform,opacity',
    },
    0,
  );
  const horizon = one('.fam__horizon');
  if (horizon) {
    tl.from(horizon, { y: -54 * u, duration: 0.9, ease: 'expo.out', clearProps: 'transform' }, 0.05);
  }

  // 2 — The heading.
  const head = [one('.fam__copy--left .eyebrow'), one('.fam__title')].filter(
    (n): n is HTMLElement => !!n,
  );
  revealUp(tl, head, { y: 26 * u, duration: 0.62, stagger: 0.09, at: 0.12 });

  // 3 — The phone arrives, then its screen fills in behind the glass.
  const phone = one('.fam__phone');
  if (phone) {
    tl.from(
      phone,
      {
        y: 88 * u,
        scale: 0.95,
        opacity: 0,
        duration: 0.78,
        ease: 'expo.out',
        transformOrigin: '50% 80%',
        clearProps: 'transform,opacity',
      },
      0.16,
    );
  }
  tl.from(
    q('.fam__screen > *'),
    { y: 26 * u, opacity: 0, duration: 0.5, stagger: 0.055, ease: EASE, clearProps: 'transform,opacity' },
    0.4,
  );

  // 4 — The cards settle around it, furthest back first.
  q('.fam__ghost').forEach((ghost, i) =>
    land(ghost, 0.5 + i * 0.07, { x: 34, y: -30, scale: 1.08, duration: 0.62 }),
  );
  land(one('.fam__mkt--ecb'), 0.56, { x: -30 });
  land(one('.fam__mkt--nvda'), 0.66, { x: -16, y: -44 });
  land(one('.fam__pred'), 0.8, { x: 32, y: -34 });

  // 5 — The supporting copy and the call to action.
  revealUp(tl, q('.fam__copy--right > *'), { y: 24 * u, duration: 0.6, stagger: 0.08, at: 0.62 });

  // 6 — The chips come up off the horizon.
  tl.from(
    q('.fam__chips > *'),
    {
      y: 20 * u,
      scale: 0.8,
      opacity: 0,
      duration: 0.46,
      stagger: 0.05,
      ease: 'back.out(1.5)',
      transformOrigin: '50% 50%',
      clearProps: 'transform,opacity',
    },
    0.98,
  );
}

/* Idle layer --------------------------------------------------------------- */

interface FloatSpec {
  selector: string;
  /** Peak drift in design pixels; the sign sets which way the card leaves rest. */
  distance: number;
  duration: number;
  delay: number;
  /** Parallax, as a fraction of the card's distance from the viewport centre. */
  strength: number;
}

const FLOAT: FloatSpec[] = [
  { selector: '.fam__mkt--ecb', distance: -6, duration: 4.6, delay: 0, strength: 0.05 },
  { selector: '.fam__mkt--nvda', distance: 5, duration: 5.2, delay: 0.5, strength: 0.05 },
  { selector: '.fam__pred', distance: -5, duration: 5, delay: 0.25, strength: 0.06 },
  { selector: '.fam__ghost--a', distance: 4, duration: 6, delay: 0.8, strength: 0.08 },
  { selector: '.fam__ghost--b', distance: -4, duration: 5.6, delay: 0.35, strength: 0.07 },
];

interface FloatLayer {
  play(): void;
  pause(): void;
  destroy(): void;
}

/**
 * Local primitive: drift *and* parallax on the same element.
 *
 * The shared `drift` and `parallax` helpers each own `y`, so running both on one
 * card leaves them fighting over the transform. This keeps the two offsets apart
 * and writes their sum once, through a single rAF for the whole group. It starts
 * paused, so a caller can hold it back until the entrance has landed.
 */
function floatLayer(items: Array<FloatSpec & { el: HTMLElement }>): FloatLayer {
  const nodes = items.map((item) => {
    const set = gsap.quickSetter(item.el, 'y', 'px');
    const offset = { drift: 0, parallax: 0 };
    const write = () => set(offset.drift + offset.parallax);
    const tween = gsap.to(offset, {
      drift: item.distance,
      duration: item.duration,
      delay: item.delay,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: true,
      onUpdate: write,
    });
    return { el: item.el, strength: item.strength, offset, write, tween };
  });

  let live = false;
  let frame = 0;

  const pass = () => {
    frame = 0;
    const mid = innerHeight / 2;
    for (const n of nodes) {
      const r = n.el.getBoundingClientRect();
      // Take this layer's own offset back out, so the reading is of where the
      // card rests rather than of where the layer has already put it.
      const centre = r.top + r.height / 2 - (n.offset.drift + n.offset.parallax);
      n.offset.parallax = (centre - mid) * -n.strength;
      n.write();
    }
  };

  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(pass);
  };

  const play = () => {
    if (live) return;
    live = true;
    nodes.forEach((n) => n.tween.play());
    addEventListener('scroll', onScroll, { passive: true });
    pass();
  };

  const pause = () => {
    if (!live) return;
    live = false;
    nodes.forEach((n) => n.tween.pause());
    removeEventListener('scroll', onScroll);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const destroy = () => {
    pause();
    nodes.forEach((n) => {
      n.tween.kill();
      gsap.set(n.el, { clearProps: 'transform' });
    });
  };

  return { play, pause, destroy };
}

/** The section ref: entrance timeline plus the idle layer behind it. */
export function useFamiliarMotion(): RefObject<HTMLElement | null> {
  const ref = useSectionMotion<HTMLElement>(build, { threshold: 0.12 });

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED || STILL) return;

    const u = unit(el);
    const items = FLOAT.flatMap((spec) => {
      const node = el.querySelector<HTMLElement>(spec.selector);
      return node ? [{ ...spec, el: node, distance: spec.distance * u }] : [];
    });
    if (!items.length) return;

    const layer = floatLayer(items);
    let visible = false;
    let settled = false;
    let timer = 0;

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) {
          layer.pause();
          return;
        }
        if (settled) layer.play();
        else if (!timer) {
          timer = window.setTimeout(() => {
            timer = 0;
            settled = true;
            if (visible) layer.play();
          }, SETTLED);
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      layer.destroy();
    };
  }, [ref]);

  return ref;
}
