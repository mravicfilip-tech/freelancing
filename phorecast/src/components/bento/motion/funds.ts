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
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { bandStaged, onSectionReady, pct, pulse, q1, qa, unitOf, whileVisible } from './shared';

const NS = 'http://www.w3.org/2000/svg';

/* The 464 x 215 diagram, in its own design pixels.
   Wallet ring: Ellipse 56 of ring-wallet.svg is r 46 about (46.5, 46.5) in a 93
   box BoxCustody.css parks at (8, 61) — so (54.5, 107.5) here.
   Node A's dot centre is (26, 71), which is 232 degrees round that circle the
   way an SVG circle is drawn (from three o'clock, clockwise), so the fill can
   start under the node and close back onto it.
   Node B's dot centre is (302, 108), on the right extreme of the dotted orbit.
   The corridor between the two chips — "Smart Contracts" ends at y 67, "Withdraw
   anytime" begins at y 144 — is clear, so the packet's curve is drawn to stay
   inside y 96..120 the whole way across. */
const WALLET_R = 46;
const WALLET_CX = 54.5;
const WALLET_CY = 107.5;
const NODE_A_DEG = 232;
const PACKET_D = 'M302 108 C 248 84 132 132 78 107.5';

export function funds(card: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const art = q1(card, '.custody__art');
  const disc = q1(card, '.custody__wallet-disc');
  const icon = q1(card, '.custody__wallet-icon');
  const walletLabel = q1(card, '.custody__label--wallet');
  const tiles = qa(card, '.custody__tile');
  const labels = qa(card, '.custody__label:not(.custody__label--wallet)');
  const chips = qa(card, '.custody__pill');
  const nodes = qa(card, '.custody__node');
  if (!art || !disc || !icon || !walletLabel || tiles.length < 4 || chips.length < 2 || nodes.length < 2) {
    return () => {};
  }

  /* One overlay for both added layers. Neither exists in the resting design —
     they are the beat — so they are built here rather than shipped in the
     markup, sized in the card's own `--u`, which a descendant resolves normally
     even though the card that declares it cannot read it back. */
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 464 215');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.style.cssText = 'left:0;top:0;width:calc(464 * var(--u));height:calc(215 * var(--u));'
    + 'overflow:visible;pointer-events:none';

  const ring = document.createElementNS(NS, 'circle');
  ring.setAttribute('cx', String(WALLET_CX));
  ring.setAttribute('cy', String(WALLET_CY));
  ring.setAttribute('r', String(WALLET_R));
  ring.setAttribute('stroke', '#ff632a');
  ring.setAttribute('stroke-width', '2');
  ring.setAttribute('stroke-linecap', 'round');
  ring.setAttribute('transform', `rotate(${NODE_A_DEG} ${WALLET_CX} ${WALLET_CY})`);

  const wire = document.createElementNS(NS, 'path');
  wire.setAttribute('d', PACKET_D);
  wire.setAttribute('stroke', '#f26246');
  wire.setAttribute('stroke-width', '1.6');
  wire.setAttribute('stroke-linecap', 'round');

  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('r', '4.2');
  head.setAttribute('fill', '#ff8a5c');

  svg.append(ring, wire, head);
  art.insertBefore(svg, disc);

  const CIRC = 2 * Math.PI * WALLET_R;
  const WIRE_LEN = wire.getTotalLength();
  const TRAIL = 46;

  const u = unitOf(art, 464);
  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state */
    gsap.set([disc, icon, ...nodes], { transformOrigin: '50% 50%' });
    gsap.set(tiles, { filter: 'brightness(1)', transformOrigin: '50% 50%' });
    gsap.set(ring, { strokeDasharray: CIRC, strokeDashoffset: CIRC, opacity: 0 });
    gsap.set(wire, { strokeDasharray: `${TRAIL} ${WIRE_LEN}`, strokeDashoffset: TRAIL, opacity: 0 });
    gsap.set(head, { opacity: 0 });
    if (staged) {
      gsap.set([disc, icon, walletLabel, ...chips, ...tiles, ...labels], { opacity: 0 });
      gsap.set([disc, icon], { scale: 0.9 });
      gsap.set([walletLabel, ...chips, ...tiles, ...labels], { y: 9 });
      gsap.set(nodes, { opacity: 0, scale: 0.55 });
    }

    /* ---------------------------------------------------------------- loop */
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4.2 });

    // 1 — the four markets hand over, each sliding a step toward the wallet
    tiles.forEach((tile, i) => {
      const label = labels[i];
      const at = i * 0.16;
      pulse(loop, tile, at,
        { xPercent: pct(tile, -11, u, 'x'), scale: 1.16, filter: 'brightness(1.7)' },
        { xPercent: 0, scale: 1, filter: 'brightness(1)' }, 0.36, 0.72);
      if (label) {
        pulse(loop, label, at,
          { xPercent: pct(label, -11, u, 'x') }, { xPercent: 0 }, 0.36, 0.72);
      }
    });

    // 2 — the contract chip answers
    pulse(loop, chips[0], 0.9,
      { yPercent: pct(chips[0], -11, u), scale: 1.05, borderColor: 'rgba(255, 138, 92, 0.75)' },
      { yPercent: 0, scale: 1, borderColor: getComputedStyle(chips[0]).borderTopColor }, 0.42, 0.8);

    // 3 — the node on the orbit flares and lets the packet go
    pulse(loop, nodes[1], 1.3, { scale: 2 }, { scale: 1 }, 0.3, 0.7);

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
      .fromTo(packet, { p: 0 }, { p: 1, duration: 2, ease: 'power1.inOut', onUpdate: ridePacket }, 1.55)
      .fromTo(wire, { strokeDashoffset: TRAIL },
        { strokeDashoffset: -WIRE_LEN, duration: 2, ease: 'power1.inOut' }, 1.55)
      .to([wire, head], { opacity: 0, duration: 0.45, ease: 'sine.inOut' }, 3.4);

    // 5 — the withdrawal, under the travelling packet
    pulse(loop, chips[1], 2.35,
      { yPercent: pct(chips[1], -11, u), scale: 1.05, borderColor: 'rgba(255, 138, 92, 0.75)' },
      { yPercent: 0, scale: 1, borderColor: getComputedStyle(chips[1]).borderTopColor }, 0.42, 0.8);

    // 6 — it lands: the node on the wallet ring, the ring closing, the disc
    pulse(loop, nodes[0], 3.35, { scale: 2 }, { scale: 1 }, 0.3, 0.7);
    loop
      .to(ring, { opacity: 1, duration: 0.3, ease: 'sine.out' }, 3.5)
      .fromTo(ring, { strokeDashoffset: CIRC }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' }, 3.6)
      .to(ring, { opacity: 0, duration: 0.7, ease: 'sine.inOut' }, 5.1);
    pulse(loop, disc, 4.25, { scale: 1.18 }, { scale: 1 }, 0.42, 0.9);
    pulse(loop, walletLabel, 4.3,
      { textShadow: '0 0 12px rgba(255, 251, 248, 0.9)' },
      { textShadow: '0 0 0px rgba(255, 251, 248, 0)' }, 0.42, 0.9);

    /* ------------------------------------------------------------- load-in
       Tile and label travel together, so the pairs are interleaved and the
       stagger is halved to keep the gap between assets at 0.1s. */
    const assets: HTMLElement[] = [];
    tiles.forEach((tile, i) => { assets.push(tile); if (labels[i]) assets.push(labels[i]); });

    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to([disc, icon], { opacity: 1, scale: 1, duration: 0.95, ease: 'expo.out' }, 0)
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
