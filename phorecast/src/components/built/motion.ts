// The entrance for "Built for the Way You Trade".
//
// One timeline, directed rather than staggered: the heading leads, the left
// card arrives alone and is already drawing itself before the right card lands,
// the network builds left to right, and self-custody is the last thing to
// appear. Type moves on expo, linework draws on power2.inOut, discs and nodes
// land on power3 — different materials, different curves.
//
// Everything animates *from* a visible baseline and the timeline clears its own
// inline styles at the end, so a script that never runs leaves the section
// exactly as the CSS draws it, and a reduced-motion visitor — who gets the
// whole thing via `progress(1)` — lands on that same finished state.

import type { SectionMotion } from '../../lib/motion';

/** The section timeline, as `useSectionMotion` hands it over. */
type TL = SectionMotion['tl'];

/** Everything the entrance writes an inline transform or opacity to. */
const TOUCHED = [
  '.built__glow',
  '.built__head',
  '.built__head > *',
  '.eyebrow__dot',
  '.bt-card',
  '.bt-label',
  '.bt1 > *',
  '.bt1__rings > *',
  '.bt1__text > *',
  '.bt2 > *',
  '.built__copy > *',
].join(', ');

export interface EntranceHooks {
  /** 0..1 bloom sent to the glow shader while the section arrives. */
  heat: (v: number) => void;
  /** Fired once the timeline has cleared up; the ambient driver takes over. */
  done: () => void;
}

export function buildBuilt({ q, tl }: SectionMotion, hooks: EntranceHooks) {
  const one = (s: string, root?: ParentNode) =>
    (root ? root.querySelector<HTMLElement>(s) : q(s)[0]) ?? undefined;
  const cols = q('.built__col');
  const cards = q('.bt-card');

  /* ------------------------------------------------------------ the light */

  const glow = one('.built__glow');
  if (glow) {
    tl.from(glow, { opacity: 0, scale: 0.72, duration: 1.5, ease: 'power2.out', clearProps: 'transform,opacity' }, 0);
  }
  // The shader blooms on the same curve, then settles to its ambient level.
  const heat = { v: 1 };
  hooks.heat(1);
  tl.to(heat, { v: 0, duration: 1.6, ease: 'power2.out', onUpdate: () => hooks.heat(heat.v) }, 0);

  /* ---------------------------------------------------------- the heading */

  const dot = one('.eyebrow__dot');
  if (dot) tl.from(dot, { scale: 0, opacity: 0, duration: 0.5, ease: 'power3.out' }, 0);
  const eyebrow = one('.eyebrow');
  if (eyebrow) tl.from(eyebrow, { y: 14, opacity: 0, duration: 0.55, ease: 'power3.out' }, 0.04);
  const title = one('.built__title');
  if (title) tl.from(title, { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0.1);
  const sub = one('.built__sub');
  if (sub) tl.from(sub, { y: 16, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.26);

  /* ------------------------------------------------------------ the cards */

  // The left card leads and is drawing itself by the time the right one lands.
  cards.forEach((card, i) => {
    tl.from(
      card,
      { y: 30, scale: 0.982, opacity: 0, duration: 0.8, ease: 'expo.out', transformOrigin: '50% 60%' },
      0.3 + i * 0.16,
    );
    tl.from(
      Array.from(card.querySelectorAll<HTMLElement>('.bt-label')),
      { y: 8, opacity: 0, duration: 0.45, stagger: 0.05, ease: 'power3.out' },
      0.58 + i * 0.1,
    );
  });

  buildCardOne(tl, one);
  buildCardTwo(tl, one);

  /* ------------------------------------------------------------- the copy */

  cols.forEach((col, i) => {
    const at = 0.74 + i * 0.12;
    const t = one('.built__col-title', col);
    const b = one('.built__col-body', col);
    const c = one('.built__cta', col);
    if (t) tl.from(t, { y: 16, opacity: 0, duration: 0.6, ease: 'expo.out' }, at);
    if (b) tl.from(b, { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out' }, at + 0.08);
    if (c) tl.from(c, { y: 12, opacity: 0, duration: 0.55, ease: 'power3.out' }, at + 0.18);
  });

  /* ------------------------------------------------------------- hand off */

  // Land on the CSS design exactly, then let the ambient driver take the wheel.
  tl.set(q(TOUCHED), { clearProps: 'transform,opacity,willChange' }, '>');
  tl.eventCallback('onComplete', hooks.done);
}

function buildCardOne(tl: TL, one: (s: string) => HTMLElement | undefined) {
  const dot = one('.bt1__dot');
  const line = one('.bt1__line');
  const smear = one('.bt1__smear');
  const you = one('.bt1__you');
  // `.map(one)` would hand Array.map's index through as the root argument.
  const rings = ['.bt1__ring-disc', '.bt1__ring-mid', '.bt1__ring-outer']
    .map((s) => one(s))
    .filter(Boolean) as HTMLElement[];
  const coin = one('.bt1__coin');
  const text = one('.bt1__text');

  if (dot) tl.from(dot, { scale: 0.3, opacity: 0, duration: 0.45, ease: 'power3.out' }, 0.5);
  // The link draws, and the pulse rides it in.
  if (line) tl.from(line, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, ease: 'power2.inOut' }, 0.52);
  if (smear) tl.from(smear, { x: -46, opacity: 0, duration: 0.55, ease: 'power2.out' }, 0.56);
  if (you) tl.from(you, { opacity: 0, duration: 0.4, ease: 'none' }, 0.62);
  // It lands, and the market rings out from the coin.
  if (rings.length) {
    tl.from(
      rings,
      { scale: 0.5, opacity: 0, duration: 0.7, stagger: 0.075, transformOrigin: '50% 50%', ease: 'power3.out' },
      0.7,
    );
  }
  if (coin) tl.from(coin, { scale: 0.35, opacity: 0, duration: 0.55, ease: 'power3.out' }, 0.76);
  if (text) {
    tl.from(
      Array.from(text.children) as HTMLElement[],
      { y: 12, opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out' },
      0.86,
    );
  }
}

function buildCardTwo(tl: TL, one: (s: string) => HTMLElement | undefined) {
  const main = one('.bt2__main');
  const fan = one('.bt2__fan');
  const smear = one('.bt2__smear');
  const lock = one('.bt2__node--lock');
  const group = one('.bt2');
  const nodes = group
    ? Array.from(group.querySelectorAll<HTMLElement>('.bt2__node'))
        .filter((n) => n !== lock)
        .sort((a, b) => nx(a) - nx(b))
    : [];

  if (main) tl.from(main, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.62, ease: 'power2.inOut' }, 0.62);
  if (nodes.length) {
    tl.from(nodes, { scale: 0.45, opacity: 0, duration: 0.55, stagger: 0.055, ease: 'power3.out' }, 0.7);
  }
  if (fan) tl.from(fan, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.55, ease: 'power2.inOut' }, 0.86);
  if (smear) tl.from(smear, { x: -40, opacity: 0, duration: 0.55, ease: 'power2.out' }, 0.94);
  // The late accent: settlement is the last thing on screen.
  if (lock) tl.from(lock, { scale: 0.45, opacity: 0, duration: 0.6, ease: 'expo.out' }, 1.02);
}

const nx = (el: Element) => Number.parseFloat(getComputedStyle(el).getPropertyValue('--x')) || 0;
