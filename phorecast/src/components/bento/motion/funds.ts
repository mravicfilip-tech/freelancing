/**
 * Card B — "Your funds leave whenever you want".
 *
 * The diagram reads right to left as a custody chain: four market tiles hung on
 * the orange ring, a smart-contract chip, two orange nodes sitting on the
 * strokes, a withdraw chip, and the wallet ring with your wallet inside it. The
 * motion walks that chain in the direction the copy promises — out of the
 * markets, through the contracts, into your wallet — and then stops.
 *
 * LOAD-IN (2.0s, after the band's entrance has landed the card)
 *   The three circles and the glow arrive with the card; they are the diagram's
 *   frame. The wallet is the lead and holds the stage alone for half a second,
 *   because it is what the sentence is about. Then the two contract chips, then
 *   the four assets each with its label, then the two nodes.
 *
 * LOOP (5.8s of story, then 4.2s of nothing — 10.0s end to end)
 *   The four markets hand over in turn, each tile brightening and sliding a step
 *   toward the wallet. The smart-contract chip lifts to answer. The node on the
 *   orbit flares and releases a packet, which travels the whole 226 design pixels
 *   of the diagram — from that node, through the corridor between the two chips,
 *   into the wallet — while "Withdraw anytime" lifts under it. The node on the
 *   wallet ring flares as the packet lands, the wallet ring closes round in
 *   orange from that node, and the disc takes one pulse. Then the card is still
 *   for four seconds.
 *
 * Distances are written as percentages of each element's own box, never pixels,
 * so one build of the timeline is correct at every breakpoint — see `pct` in
 * shared.ts.
 *
 * ON THE PHONE it is the same seven beats at the same seven times, because the
 * phone's card is the same diagram turned a quarter-turn (Figma 526:305). The
 * two things a quarter-turn moves are directions and paths, and both are
 * re-derived rather than reused: a market tile hands its value on DOWNWARD
 * instead of leftward, a contract chip answers LEFTWARD instead of upward —
 * still the perpendicular of the packet's travel, which is what that step
 * means — and the packet's curve, the wallet ring's radius and the angle it
 * closes from are each mapped through the one rotation the layout applies. The
 * numbers are in `LANDSCAPE` and `PORTRAIT` below with the map beside them.
 * The orientation is measured off the artwork's own box, not a media query.
 *
 * The one beat that reads differently is the fourth: the phone has no corridor
 * to send the packet down, because it stacks the two chips across the line of
 * travel rather than along it, so the packet crosses over them instead. They
 * still answer as it passes, on the beats they always did.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { tok } from '../../../lib/theme';
import { bandStaged, onSectionReady, pct, pulse, q1, qa, unitOf, whileVisible } from './shared';

const NS = 'http://www.w3.org/2000/svg';

/* The diagram, in its own design pixels, at both of the orientations
   BoxCustody.css lays it out in.
   ---------------------------------------------------------------------------
   LANDSCAPE (464 x 215, Figma 365:936)
   Wallet ring: Ellipse 56 of ring-wallet.svg is r 46 about (46.5, 46.5) in a 93
   box BoxCustody.css parks at (8, 61) — so (54.5, 107.5) here.
   Node A's dot centre is (26, 71), which is 232 degrees round that circle the
   way an SVG circle is drawn (from three o'clock, clockwise), so the fill can
   start under the node and close back onto it.
   Node B's dot centre is (302, 108), on the right extreme of the dotted orbit.
   The corridor between the two chips — "Smart Contracts" ends at y 67, "Withdraw
   anytime" begins at y 144 — is clear, so the packet's curve is drawn to stay
   inside y 96..120 the whole way across.

   PORTRAIT (215 x 464, Figma 526:305)
   The phone draws that same group at -90deg, so every number above is re-derived
   through the one map BoxCustody.css states: (x, y) -> (y, 464 - x). Nothing
   here is reused blind and nothing is re-measured by hand — the wallet centre
   (54.5, 107.5) becomes (107.5, 409.5), the start angle loses the same quarter
   turn the frame did (232 - 90 = 142), and each of the packet path's four
   points is mapped in place, which is why the two `d` strings are the same
   curve twice.

   What does NOT survive the map is the corridor. The phone re-lays the two
   pills out around the ring rather than rotating them, and on screen they end
   up stacked ACROSS the packet's new line of travel — Smart Contracts at
   y 245..282 reaching to x 117, Withdraw at y 295..332 from x 95 — with no
   gap to thread. The packet therefore crosses them instead of dodging, painted
   over the top: the overlay is inserted before the wallet disc, which is after
   both pills in the markup. The two chips still answer under it on the same
   beats, which is what carries "through the contracts" either way. */
type Geometry = {
  w: number; h: number;
  wx: number; wy: number;
  nodeA: number;
  packet: string;
};
const WALLET_R = 46;
const LANDSCAPE: Geometry = {
  w: 464, h: 215,
  wx: 54.5, wy: 107.5,
  nodeA: 232,
  packet: 'M302 108 C 248 84 132 132 78 107.5',
};
const PORTRAIT: Geometry = {
  w: 215, h: 464,
  wx: 107.5, wy: 409.5,
  nodeA: 142,
  packet: 'M108 162 C 84 216 132 332 107.5 386',
};

export function funds(card: HTMLElement): () => void {
  if (REDUCED) return () => {};

  /* Every colour this loop writes, read once, here, at BUILD time -- beside
     the two `getComputedStyle(...).borderTopColor` reads further down, which
     is the place LIGHTMODE.md 4.3 names and the place the rest of the repo
     already uses. Never at module scope: the theme is not known there, and a
     value cached there could never be re-read.
     Re-reading on a theme change is Bento.tsx's job: its card-motion effect
     takes the theme epoch as a dependency, which tears these four modules down
     and builds them again, exactly as useSectionMotion does for the band.
     The fallbacks are the literals this file shipped with, so a missing
     property yields today's dark value rather than nothing. */
  const C = {
    ring: tok('--bento-fd-ring', '#ff632a'),
    wire: tok('--bento-fd-wire', '#f26246'),
    head: tok('--bento-fd-head', '#ff8a5c'),
    tileLit: tok('--bento-fd-tile-lit', 'brightness(1.7)'),
    chipLit: tok('--bento-fd-chip-lit', 'rgba(255, 138, 92, 0.75)'),
    flare: tok('--bento-fd-flare', '0 0 12px rgba(255, 251, 248, 0.9)'),
    flare0: tok('--bento-fd-flare-0', '0 0 0px rgba(255, 251, 248, 0)'),
  };

  const art = q1(card, '.custody__art');
  const disc = q1(card, '.custody__wallet-disc');
  /* Both wallet glyphs: the desktop's outlined one and the phone's solid one
     ship together and the breakpoint hides one of them (BoxCustody.tsx). The
     hidden one is `display: none`, so a tween on it writes a style nobody
     paints — which is exactly right, and much better than a selector that
     picks the wrong one and leaves the visible glyph out of the load-in. */
  const icons = qa(card, '.custody__wallet-icon');
  const walletLabel = q1(card, '.custody__label--wallet');
  const tiles = qa(card, '.custody__tile');
  const labels = qa(card, '.custody__label:not(.custody__label--wallet)');
  const chips = qa(card, '.custody__pill');
  const nodes = qa(card, '.custody__node');
  if (!art || !disc || !icons.length || !walletLabel || tiles.length < 4 || chips.length < 2 || nodes.length < 2) {
    return () => {};
  }

  /* Which way up is the card? Measured rather than matched against a media
     query, because the geometry is the thing that has to agree and the box is
     the geometry: the landscape group is 464 x 215 and the portrait one is
     215 x 464, so a card taller than it is wide is the phone. A card that has
     not been laid out reads 0 x 0 and falls to landscape, which is the
     orientation whose start state is already on the page. */
  const box = art.getBoundingClientRect();
  const portrait = box.height > box.width;
  const G = portrait ? PORTRAIT : LANDSCAPE;

  /* One overlay for both added layers. Neither exists in the resting design —
     they are the beat — so they are built here rather than shipped in the
     markup, sized in the card's own `--u`, which a descendant resolves normally
     even though the card that declares it cannot read it back. */
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${G.w} ${G.h}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.style.cssText = `left:0;top:0;width:calc(${G.w} * var(--u));height:calc(${G.h} * var(--u));`
    + 'overflow:visible;pointer-events:none';

  const ring = document.createElementNS(NS, 'circle');
  ring.setAttribute('cx', String(G.wx));
  ring.setAttribute('cy', String(G.wy));
  ring.setAttribute('r', String(WALLET_R));
  ring.setAttribute('stroke', C.ring);
  ring.setAttribute('stroke-width', '2');
  ring.setAttribute('stroke-linecap', 'round');
  ring.setAttribute('transform', `rotate(${G.nodeA} ${G.wx} ${G.wy})`);

  const wire = document.createElementNS(NS, 'path');
  wire.setAttribute('d', G.packet);
  wire.setAttribute('stroke', C.wire);
  wire.setAttribute('stroke-width', '1.6');
  wire.setAttribute('stroke-linecap', 'round');

  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('r', '4.2');
  head.setAttribute('fill', C.head);

  svg.append(ring, wire, head);
  art.insertBefore(svg, disc);

  const CIRC = 2 * Math.PI * WALLET_R;
  const WIRE_LEN = wire.getTotalLength();
  const TRAIL = 46;

  const u = unitOf(art, G.w);

  /* The two directions every beat below is written in, once, in whichever axis
     points that way at this orientation. `toward` is the step a market tile
     takes handing its value on -- toward the wallet, which is to the LEFT along
     the landscape group and, after the quarter turn, DOWN the phone. `aside` is
     the step a contract chip takes to answer, which is the perpendicular of the
     packet's travel in both cases: up on the desktop, left on the phone. Eleven
     design pixels either way, as a percentage of the element's own box, so the
     tween survives a resize (see `pct` in shared.ts). */
  const toward = (el: HTMLElement) => (portrait
    ? { yPercent: pct(el, 11, u) }
    : { xPercent: pct(el, -11, u, 'x') });
  const TOWARD_BACK = portrait ? { yPercent: 0 } : { xPercent: 0 };
  const aside = (el: HTMLElement) => (portrait
    ? { xPercent: pct(el, -11, u, 'x') }
    : { yPercent: pct(el, -11, u) });
  const ASIDE_BACK = portrait ? { xPercent: 0 } : { yPercent: 0 };

  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state */
    gsap.set([disc, ...icons, ...nodes], { transformOrigin: '50% 50%' });
    gsap.set(tiles, { filter: 'brightness(1)', transformOrigin: '50% 50%' });
    gsap.set(ring, { strokeDasharray: CIRC, strokeDashoffset: CIRC, opacity: 0 });
    gsap.set(wire, { strokeDasharray: `${TRAIL} ${WIRE_LEN}`, strokeDashoffset: TRAIL, opacity: 0 });
    gsap.set(head, { opacity: 0 });
    if (staged) {
      gsap.set([disc, ...icons, walletLabel, ...chips, ...tiles, ...labels], { opacity: 0 });
      gsap.set([disc, ...icons], { scale: 0.9 });
      gsap.set([walletLabel, ...chips, ...tiles, ...labels], { y: 9 });
      gsap.set(nodes, { opacity: 0, scale: 0.55 });
    }

    /* ---------------------------------------------------------------- loop
       Every `fromTo` here states `immediateRender: false`. A `fromTo` writes its
       FROM value the moment it is created, even inside a paused timeline, and
       this loop is built in the same call that parks the artwork at its start
       state — so without it the loop would overwrite that start state before the
       load-in had a chance to animate away from it. */
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4.2 });

    // 1 — the four markets hand over, each sliding a step toward the wallet
    tiles.forEach((tile, i) => {
      const label = labels[i];
      const at = i * 0.16;
      pulse(loop, tile, at,
        // One filter FUNCTION either side, so GSAP interpolates the list
        // structurally instead of swapping it. In light `--bento-fd-tile-lit`
        // is brightness(0.78): a chip that has settled, not one gone white.
        { ...toward(tile), scale: 1.16, filter: C.tileLit },
        { ...TOWARD_BACK, scale: 1, filter: 'brightness(1)' }, 0.36, 0.72, 'transform');
      if (label) {
        pulse(loop, label, at, toward(label), TOWARD_BACK, 0.36, 0.72, 'transform');
      }
    });

    // 2 — the contract chip answers
    pulse(loop, chips[0], 0.9,
      { ...aside(chips[0]), scale: 1.05, borderColor: C.chipLit },
      { ...ASIDE_BACK, scale: 1, borderColor: getComputedStyle(chips[0]).borderTopColor }, 0.42, 0.8, 'transform,borderColor');

    // 3 — the node on the orbit flares and lets the packet go
    pulse(loop, nodes[1], 1.3, { scale: 2 }, { scale: 1 }, 0.3, 0.7, 'transform');

    // 4 — 226 design pixels of travel, from that node into the wallet
    const packet = { p: 0 };
    const ridePacket = () => {
      const pt = wire.getPointAtLength(packet.p * WIRE_LEN);
      head.setAttribute('cx', String(pt.x));
      head.setAttribute('cy', String(pt.y));
    };
    ridePacket();
    loop
      .to([wire, head], { opacity: 1, duration: 0.3, ease: 'sine.out' }, 1.5)
      .fromTo(packet, { p: 0 }, { p: 1, duration: 2, ease: 'power1.inOut', onUpdate: ridePacket, immediateRender: false }, 1.55)
      .fromTo(wire, { strokeDashoffset: TRAIL },
        { strokeDashoffset: -WIRE_LEN, duration: 2, ease: 'power1.inOut', immediateRender: false }, 1.55)
      .to([wire, head], { opacity: 0, duration: 0.45, ease: 'sine.inOut' }, 3.4);

    // 5 — the withdrawal, under the travelling packet
    pulse(loop, chips[1], 2.35,
      { ...aside(chips[1]), scale: 1.05, borderColor: C.chipLit },
      { ...ASIDE_BACK, scale: 1, borderColor: getComputedStyle(chips[1]).borderTopColor }, 0.42, 0.8, 'transform,borderColor');

    // 6 — it lands: the node on the wallet ring, the ring closing, the disc
    pulse(loop, nodes[0], 3.35, { scale: 2 }, { scale: 1 }, 0.3, 0.7, 'transform');
    loop
      .to(ring, { opacity: 1, duration: 0.3, ease: 'sine.out' }, 3.5)
      .fromTo(ring, { strokeDashoffset: CIRC }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out', immediateRender: false }, 3.6)
      .to(ring, { opacity: 0, duration: 0.7, ease: 'sine.inOut' }, 5.1);
    pulse(loop, disc, 4.25, { scale: 1.18 }, { scale: 1 }, 0.42, 0.9, 'transform');
    pulse(loop, walletLabel, 4.3,
      { textShadow: C.flare },
      { textShadow: C.flare0 }, 0.42, 0.9, 'textShadow');

    /* ------------------------------------------------------------- load-in
       Tile and label travel together, so the pairs are interleaved and the
       stagger is halved to keep the gap between assets at 0.1s. */
    const assets: HTMLElement[] = [];
    tiles.forEach((tile, i) => { assets.push(tile); if (labels[i]) assets.push(labels[i]); });

    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to([disc, ...icons], { opacity: 1, scale: 1, duration: 0.95, ease: 'expo.out' }, 0)
      .to(walletLabel, { opacity: 1, y: 0, duration: 0.75, ease: 'expo.out' }, 0.12)
      .to(chips, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.14 }, 0.45)
      .to(assets, { opacity: 1, y: 0, duration: 0.65, ease: 'expo.out', stagger: 0.05 }, 0.72)
      .to(nodes, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out', stagger: 0.12 }, 1.35);

    if (staged) stopReady = onSectionReady(card, () => intro.play());
    else { intro.progress(1, true); runLoop(); }
  }, card);

  return () => {
    stopReady();
    stopVisible();
    ctx.revert();
    svg.remove();
  };
}
