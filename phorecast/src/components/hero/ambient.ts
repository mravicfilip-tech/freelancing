// Idle life. The hero is a market, not a poster: prices move, the live dot
// breathes, the floating cards drift on their own phases, and a packet of light
// runs the slide-4 circuit. Every loop is collected so it can be paused the
// moment the hero leaves the viewport, and none of it starts under reduced
// motion.

import { gsap } from 'gsap';
import { REDUCED, drift } from '../../lib/motion';

type Anim = gsap.core.Animation;

const q = <T extends Element = HTMLElement>(root: ParentNode, sel: string) =>
  Array.from(root.querySelectorAll<T>(sel));

/* -------------------------------------------------------------- live prices */

interface Money {
  prefix: string;
  suffix: string;
  decimals: number;
  grouped: boolean;
  base: number;
}

/** Reads a rendered figure back into its parts so it can be re-rendered the same. */
function readMoney(text: string): Money | null {
  const m = text.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const digits = m[2];
  const dot = digits.lastIndexOf('.');
  return {
    prefix: m[1],
    suffix: m[3],
    decimals: dot === -1 ? 0 : digits.length - dot - 1,
    grouped: digits.includes(','),
    base: Number(digits.replace(/,/g, '')),
  };
}

const render = (m: Money, v: number) =>
  m.prefix +
  (m.grouped
    ? v.toLocaleString('en-US', { minimumFractionDigits: m.decimals, maximumFractionDigits: m.decimals })
    : v.toFixed(m.decimals)) +
  m.suffix;

/**
 * The market snapshot actually moves. Each row walks on its own clock so the
 * four never change together, and every walk is bounded to a fraction of a
 * percent of the figure the design shipped — any single frame still reads as
 * the design, and an up row never turns into a down row.
 */
function liveTickers(root: ParentNode, bag: Anim[]) {
  q(root, '.hero__foot .ticker').forEach((card, i) => {
    const priceEl = card.querySelector<HTMLElement>('.ticker__price');
    const pctEl = card.querySelector<HTMLElement>('.ticker__pill span');
    const arrow = card.querySelector<HTMLElement>('.ticker__trend');
    if (!priceEl || !pctEl) return;
    const price = readMoney(priceEl.textContent ?? '');
    const pct = readMoney(pctEl.textContent ?? '');
    if (!price || !pct) return;

    const sign = pct.base < 0 ? -1 : 1;
    const shown = { p: price.base, c: Math.abs(pct.base) };

    const tick = () => {
      bag.push(
        gsap.to(shown, {
          p: price.base * (1 + gsap.utils.random(-0.0022, 0.0022)),
          c: Math.abs(pct.base) + gsap.utils.random(-0.06, 0.06),
          duration: 0.55,
          ease: 'power2.out',
          onUpdate: () => {
            priceEl.textContent = render(price, shown.p);
            pctEl.textContent = render(pct, sign * shown.c);
          },
        }),
      );
      if (arrow) bag.push(gsap.fromTo(arrow, { y: -2 }, { y: 0, duration: 0.45, ease: 'power2.out' }));
    };

    // repeatRefresh re-rolls the dwell every loop, so the four rows drift apart
    // instead of settling into a pattern.
    const loop = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: 1.1 + i * 0.45 });
    loop.call(tick).to({}, { duration: () => gsap.utils.random(1.9, 3.5) });
    bag.push(loop);
  });
}

/**
 * Settles a figure onto the number the design ships, starting a hair below it.
 * Used by the entrance so the ticker row lands rather than simply appearing.
 */
export function countFromRatio(
  tl: gsap.core.Timeline,
  el: HTMLElement,
  ratio: number,
  duration: number,
  at: gsap.Position,
) {
  const m = readMoney(el.textContent ?? '');
  if (!m) return;
  const o = { v: m.base * ratio };
  tl.to(o, {
    v: m.base,
    duration,
    ease: 'power2.out',
    onUpdate: () => { el.textContent = render(m, o.v); },
    onComplete: () => { el.textContent = render(m, m.base); },
  }, at);
}

/* ------------------------------------------------------------- shared idles */

/** The eyebrow's live dot, doing what a live dot does. */
function livePulse(root: ParentNode, bag: Anim[]) {
  const dots = q(root, '.eyebrow__dot');
  if (!dots.length) return;
  bag.push(
    gsap.to(dots, {
      scale: 1.18,
      opacity: 0.55,
      duration: 1.15,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      transformOrigin: '50% 50%',
    }),
  );
}

/** The CSS glow discs breathe — only until the shader takes the layer over. */
function breatheCssGlow(root: ParentNode): Anim[] {
  return q(root, '.hero__glow').map((g, i) =>
    gsap.to(g, {
      scale: 1.03,
      duration: 6 + i * 0.7,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.5,
    }),
  );
}

/* ------------------------------------------------------------ per-slide idle */

function slideIdle(slide: ParentNode, id: string, bag: Anim[]) {
  const push = (list: Anim[]) => bag.push(...list);

  if (id === 'account') {
    // Three depths, three rhythms: the big cards barely move, the minis carry
    // more, the badges and the pill carry the most.
    push(drift(q(slide, '.pred, .mcard'), { distance: 4, duration: 6.5 }));
    push(drift(q(slide, '.mini'), { distance: 6, duration: 5.2 }));
    push(drift(q(slide, '.toast, .hv2__tile, .hv2__onchain'), { distance: 7, duration: 4.4 }));
    push(drift(q(slide, '.acct-pill'), { distance: 5, duration: 5.8 }));
    // The odds bars settle and re-settle, the way a live book does.
    q(slide, '.mini__bar span').forEach((bar, i) =>
      bag.push(
        gsap.to(bar, {
          scaleX: 0.975,
          transformOrigin: '0% 50%',
          duration: 3.4 + i * 0.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.8,
        }),
      ),
    );
    return;
  }

  if (id === 'bonus') {
    // The matched half of the stack keeps a slow shimmer, so the bonus column
    // is the part of the diagram that reads as alive.
    q(slide, '.stack__col--bonus .stack__bar').forEach((bar, i) =>
      bag.push(
        gsap.to(bar, {
          scaleX: 1.012,
          transformOrigin: '0% 50%',
          duration: 2.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.16,
        }),
      ),
    );
    push(drift(q(slide, '.stack__tile, .stack__tag'), { distance: 5, duration: 5 }));
    return;
  }

  if (id === 'future') {
    // A packet of light runs the circuit: the trace path is reused as a short
    // bright dash that travels the whole geometry and starts again.
    q<SVGGeometryElement>(slide, '.hv4__trace').forEach((path, i) => {
      const len = path.getTotalLength();
      if (!len) return;
      gsap.set(path, { opacity: 0.9, strokeDasharray: `26 ${len - 26}`, strokeDashoffset: 0 });
      bag.push(
        gsap.to(path, { strokeDashoffset: -len, duration: 7.5, ease: 'none', repeat: -1, delay: i * 3.75 }),
      );
    });
    // The dotted wire itself creeps, one dash period at a time.
    q(slide, '.hv4__wire').forEach((wire) =>
      bag.push(gsap.to(wire, { strokeDashoffset: -6, duration: 1.6, ease: 'none', repeat: -1 })),
    );
    push(drift(q(slide, '.hv4__chip'), { distance: 7, duration: 5 }));
    push(drift(q(slide, '.hv4__pill, .hv4__tag'), { distance: 5, duration: 5.6 }));
    push(drift(q(slide, '.hv4__dot'), { distance: 3, duration: 4.2 }));
    q(slide, '.hv4__ring').forEach((ring, i) =>
      bag.push(
        gsap.to(ring, {
          scale: 1.015,
          duration: 5 + i,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          transformOrigin: '50% 50%',
          delay: i * 0.6,
        }),
      ),
    );
  }
}

/* ---------------------------------------------------------------- the whole */

export interface Ambient {
  /** Rebinds the per-slide idles. Pass null to run only the shared ones. */
  setSlide(id: string, slide: HTMLElement | null): void;
  /** Called once the shader owns the glow, so the CSS discs stop breathing. */
  shaderLive(): void;
  stop(): void;
}

const kill = (bag: Anim[]) => {
  bag.forEach((t) => {
    t.kill();
    const targets = (t as gsap.core.Tween).targets?.() as Element[] | undefined;
    if (targets?.length) gsap.set(targets, { clearProps: 'transform,opacity,strokeDasharray,strokeDashoffset' });
  });
  bag.length = 0;
};

export function startAmbient(el: HTMLElement): Ambient {
  if (REDUCED) return { setSlide() {}, shaderLive() {}, stop() {} };

  let glowBag = breatheCssGlow(el);
  const sharedBag: Anim[] = [];
  let slideBag: Anim[] = [];
  livePulse(el, sharedBag);

  // Idle work stops dead when the hero leaves the viewport and picks up when it
  // comes back, so nothing is burning frames behind the fold.
  let running = true;
  const io = new IntersectionObserver(([entry]) => {
    const on = entry.isIntersecting;
    if (on === running) return;
    running = on;
    for (const bag of [glowBag, sharedBag, slideBag]) bag.forEach((t) => (on ? t.resume() : t.pause()));
  });
  io.observe(el);

  return {
    setSlide(id, slide) {
      kill(slideBag);
      slideBag = [];
      if (!slide) return;
      slideIdle(slide, id, slideBag);
      if (id === 'mark') liveTickers(el, slideBag);
      if (!running) slideBag.forEach((t) => t.pause());
    },
    shaderLive() {
      kill(glowBag);
      glowBag = [];
    },
    stop() {
      io.disconnect();
      kill(glowBag);
      kill(sharedBag);
      kill(slideBag);
    },
  };
}
