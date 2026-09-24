/**
 * Card B: "Your Funds Stay Yours".
 *
 * The diagram reads right to left as a custody chain: four market tiles on the
 * orange ring, a smart-contract chip, two orange nodes on the strokes, a
 * withdraw chip, and the wallet ring with the wallet inside it. The motion
 * walks that chain the way the copy reads: out of the markets, through the
 * contracts, into the wallet.
 *
 * Design rule for the band: one object comes out first, the rest follow. The
 * node on the orbit releases the packet alone, with nothing else moving for
 * half a second; everything after answers it (the markets in turn, the chips as
 * the packet reaches them, the wallet as it lands). The tiles step and light
 * but do not scale, so they don't compete with the packet. Inside the market
 * beat the first tile answers alone, then the other three closer together
 * (T_LEAD / T_GAP / T_STEP).
 *
 * LOAD-IN (about 1.55s, after the band's entrance has landed the card)
 *   The circles and the glow arrive with the card. The wallet leads alone for
 *   a third of a second, then the two contract chips, then the four assets with
 *   their labels, then the two nodes. Keep it short: it plays only after the
 *   band's entrance has finished.
 *
 * LOOP (6.25s of motion, then 4.75s still: 11.0s end to end)
 *   The orbit node flares and releases a packet, which travels 226 design px
 *   through the corridor between the chips into the wallet over 2.8s. The
 *   markets hand over in turn behind it, each tile stepping 9 design px toward
 *   the wallet; each chip lifts as the packet passes. On landing the wallet
 *   node flares, the wallet ring closes in orange from that node, and the disc
 *   pulses once.
 *
 * No glow or text-shadow halo here by design; the landing is carried by the
 * ring closing and the disc's pulse.
 *
 * Distances are percentages of each element's own box, never pixels, so one
 * build of the timeline is correct at every breakpoint (see `pct` in
 * shared.ts).
 *
 * On the phone the card is the same diagram turned a quarter-turn (Figma
 * 526:305), with the same beats at the same times. Directions and paths are
 * re-derived: tiles hand on downward instead of leftward, chips answer
 * leftward instead of upward (still perpendicular to the packet), and the
 * packet curve, ring centre and start angle are mapped through the layout's
 * rotation (see `LANDSCAPE` and `PORTRAIT`). The orientation is measured from
 * the artwork's own box, not a media query. The phone has no corridor between
 * the chips, so the packet crosses over them.
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
   box BoxCustody.css parks at (8, 61), so (54.5, 107.5) here.
   Node A's dot centre is (26, 71), which is 232 degrees round that circle the
   way an SVG circle is drawn (from three o'clock, clockwise), so the fill can
   start under the node and close back onto it.
   Node B's dot centre is (302, 108), on the right extreme of the dotted orbit.
   The corridor between the two chips ("Smart Contracts" ends at y 67, "Withdraw
   anytime" begins at y 144) is clear, so the packet's curve stays inside
   y 96..120 the whole way across.

   PORTRAIT (215 x 464, Figma 526:305)
   The phone draws that same group at -90deg, so every number above is re-derived
   through the map BoxCustody.css states: (x, y) -> (y, 464 - x). The wallet
   centre (54.5, 107.5) becomes (107.5, 409.5), the start angle loses a quarter
   turn (232 - 90 = 142), and each of the packet path's four points is mapped,
   so the two `d` strings are the same curve.

   The corridor does not survive the map: the phone re-lays the two pills
   around the ring, stacked across the packet's line of travel. The packet
   crosses over them instead, painted on top (the overlay is inserted before
   the wallet disc, which follows both pills in the markup). */
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

/* The market beat: one answers, then a pause, then the rest closer together.
   The gap after the first is nearly twice the step between the other three, so
   the four don't read as a single stagger. */
const T_LEAD = 0.72;
const T_GAP = 0.34;
const T_STEP = 0.18;

/** The travel, and the two beats pinned to its ends. */
const T_RELEASE = 0;      // the node on the orbit lets go; nothing else moves
const T_WIRE_IN = 0.5;
const T_TRAVEL = 0.6;
const TRAVEL_DUR = 2.8;
const T_LAND = T_TRAVEL + TRAVEL_DUR; // 3.4

export function funds(card: HTMLElement): () => void {
  if (REDUCED) return () => {};

  /* Every colour this loop writes, read once at build time (LIGHTMODE.md 4.3).
     Never at module scope: the theme is not known there and the value could
     never be re-read. On a theme change Bento.tsx tears the card modules down
     and rebuilds them (its effect depends on the theme epoch). The fallbacks
     are the dark values, used if a property goes missing. */
  const C = {
    ring: tok('--bento-fd-ring', '#ff632a'),
    wire: tok('--bento-fd-wire', '#f26246'),
    head: tok('--bento-fd-head', '#ff8a5c'),
    tileLit: tok('--bento-fd-tile-lit', 'brightness(1.7)'),
    chipLit: tok('--bento-fd-chip-lit', 'rgba(255, 138, 92, 0.75)'),
  };

  const art = q1(card, '.custody__art');
  const disc = q1(card, '.custody__wallet-disc');
  /* One wallet glyph (`fi_6839980`), shared by both frames. */
  const walletIcon = q1(card, '.custody__wallet-icon');
  const walletLabel = q1(card, '.custody__label--wallet');
  const tiles = qa(card, '.custody__tile');
  const labels = qa(card, '.custody__label:not(.custody__label--wallet)');
  const chips = qa(card, '.custody__pill');
  const nodes = qa(card, '.custody__node');
  if (!art || !disc || !walletIcon || !walletLabel || tiles.length < 4 || chips.length < 2 || nodes.length < 2) {
    return () => {};
  }
  const wallet = [disc, walletIcon];

  /* Which way up is the card? Measured from the artwork box rather than a
     media query, so it always agrees with the geometry: taller than wide is
     the phone. An unlaid-out box reads 0 x 0 and falls to landscape. */
  const box = art.getBoundingClientRect();
  const portrait = box.height > box.width;
  const G = portrait ? PORTRAIT : LANDSCAPE;

  /* One overlay for the added layers (ring, wire, packet head). They are not
     part of the resting design, so they are built here rather than shipped in
     the markup, sized in the card's `--u`. */
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

  /* A flat filled disc. No blur or drop-shadow by design: it reads because it
     moves, not because it glows. */
  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('r', '4.2');
  head.setAttribute('fill', C.head);

  svg.append(ring, wire, head);
  art.insertBefore(svg, disc);

  const CIRC = 2 * Math.PI * WALLET_R;
  const WIRE_LEN = wire.getTotalLength();
  const TRAIL = 46;

  const u = unitOf(art, G.w);

  /* The two directions every beat uses, in whichever axis points that way at
     this orientation. `toward`: a market tile's step toward the wallet (left on
     desktop, down on the phone). `aside`: a contract chip's answer,
     perpendicular to the packet (up on desktop, left on the phone). 9 design px
     for a tile and 10 for a chip, as a percentage of the element's own box. */
  const toward = (el: HTMLElement) => (portrait
    ? { yPercent: pct(el, 9, u) }
    : { xPercent: pct(el, -9, u, 'x') });
  const TOWARD_BACK = portrait ? { yPercent: 0 } : { xPercent: 0 };
  const aside = (el: HTMLElement) => (portrait
    ? { xPercent: pct(el, -10, u, 'x') }
    : { yPercent: pct(el, -10, u) });
  const ASIDE_BACK = portrait ? { xPercent: 0 } : { yPercent: 0 };

  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state */
    gsap.set([...wallet, ...nodes], { transformOrigin: '50% 50%' });
    gsap.set(tiles, { filter: 'brightness(1)', transformOrigin: '50% 50%' });
    gsap.set(ring, { strokeDasharray: CIRC, strokeDashoffset: CIRC, opacity: 0 });
    gsap.set(wire, { strokeDasharray: `${TRAIL} ${WIRE_LEN}`, strokeDashoffset: TRAIL, opacity: 0 });
    gsap.set(head, { opacity: 0 });
    if (staged) {
      gsap.set([...wallet, walletLabel, ...chips, ...tiles, ...labels], { opacity: 0 });
      gsap.set(wallet, { scale: 0.9 });
      gsap.set([walletLabel, ...chips, ...tiles, ...labels], { y: 9 });
      gsap.set(nodes, { opacity: 0, scale: 0.55 });
    }

    /* ---------------------------------------------------------------- loop
       Every `fromTo` here states `immediateRender: false`. A `fromTo` writes its
       from value on creation, even inside a paused timeline, which would
       overwrite the start state parked above before the load-in runs. */
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4.75 });

    // 1. The node on the orbit flares and lets go, with nothing else on the
    //    card moving until the wire appears.
    pulse(loop, nodes[1], T_RELEASE, { scale: 2 }, { scale: 1 }, 0.34, 0.76, 'transform');

    // 2. 226 design pixels of travel, from that node into the wallet
    const packet = { p: 0 };
    const ridePacket = () => {
      const pt = wire.getPointAtLength(packet.p * WIRE_LEN);
      head.setAttribute('cx', String(pt.x));
      head.setAttribute('cy', String(pt.y));
    };
    ridePacket();
    loop
      .to([wire, head], { opacity: 1, duration: 0.36, ease: 'sine.out' }, T_WIRE_IN)
      .fromTo(packet, { p: 0 },
        { p: 1, duration: TRAVEL_DUR, ease: 'power1.inOut', onUpdate: ridePacket, immediateRender: false }, T_TRAVEL)
      .fromTo(wire, { strokeDashoffset: TRAIL },
        { strokeDashoffset: -WIRE_LEN, duration: TRAVEL_DUR, ease: 'power1.inOut', immediateRender: false }, T_TRAVEL)
      .to([wire, head], { opacity: 0, duration: 0.5, ease: 'sine.inOut' }, T_LAND + 0.15);

    // 3. The four markets hand over behind the packet, the first alone and the
    //    other three closer together. No scale, so they don't take the focus
    //    off the packet.
    tiles.forEach((tile, i) => {
      const at = i === 0 ? T_LEAD : T_LEAD + T_GAP + (i - 1) * T_STEP;
      pulse(loop, tile, at,
        // One filter function on each side, so GSAP interpolates rather than
        // swaps. In light `--bento-fd-tile-lit` darkens (see Bento.css).
        { ...toward(tile), filter: C.tileLit },
        { ...TOWARD_BACK, filter: 'brightness(1)' }, 0.4, 0.78, 'transform');
      const label = labels[i];
      if (label) pulse(loop, label, at, toward(label), TOWARD_BACK, 0.4, 0.78, 'transform');
    });

    // 4. The contract chip answers as the packet reaches it
    pulse(loop, chips[0], 1.7,
      { ...aside(chips[0]), borderColor: C.chipLit },
      { ...ASIDE_BACK, borderColor: getComputedStyle(chips[0]).borderTopColor }, 0.46, 0.86, 'transform,borderColor');

    // 5. The withdrawal chip, as it passes
    pulse(loop, chips[1], 2.62,
      { ...aside(chips[1]), borderColor: C.chipLit },
      { ...ASIDE_BACK, borderColor: getComputedStyle(chips[1]).borderTopColor }, 0.46, 0.86, 'transform,borderColor');

    // 6. It lands: the node on the wallet ring flares, the ring closes from
    //    under that node, and the disc pulses once.
    pulse(loop, nodes[0], T_LAND, { scale: 2 }, { scale: 1 }, 0.34, 0.76, 'transform');
    loop
      .to(ring, { opacity: 1, duration: 0.3, ease: 'sine.out' }, T_LAND + 0.1)
      .fromTo(ring, { strokeDashoffset: CIRC },
        { strokeDashoffset: 0, duration: 1.8, ease: 'power2.out', immediateRender: false }, T_LAND + 0.2)
      .to(ring, { opacity: 0, duration: 0.8, ease: 'sine.inOut' }, T_LAND + 2.05);
    pulse(loop, disc, T_LAND + 1.15, { scale: 1.14 }, { scale: 1 }, 0.46, 0.94, 'transform');

    /* ------------------------------------------------------------- load-in
       Tile and label travel together, so the pairs are interleaved and the
       stagger is halved to keep the gap between assets at 0.08s. */
    const assets: HTMLElement[] = [];
    tiles.forEach((tile, i) => { assets.push(tile); if (labels[i]) assets.push(labels[i]); });

    /* Every tween clears `transform,opacity` when it lands. The wallet glyph and
       "Wallet" label have no loop beat, so anything left inline would stay for
       good, and an inline identity transform changes text antialiasing (see
       `pulse` in shared.ts). */
    const CLEAR = 'transform,opacity';
    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to(wallet, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out', clearProps: CLEAR }, 0)
      .to(walletLabel, { opacity: 1, y: 0, duration: 0.58, ease: 'expo.out', clearProps: CLEAR }, 0.34)
      .to(chips, { opacity: 1, y: 0, duration: 0.58, ease: 'expo.out', stagger: 0.1, clearProps: CLEAR }, 0.56)
      .to(assets, { opacity: 1, y: 0, duration: 0.54, ease: 'expo.out', stagger: 0.04, clearProps: CLEAR }, 0.74)
      .to(nodes, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out', stagger: 0.09, clearProps: CLEAR }, 1.06);

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
