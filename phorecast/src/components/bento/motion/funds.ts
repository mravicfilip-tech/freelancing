/**
 * Card B — "Your funds leave whenever you want".
 *
 * The diagram reads left to right as a custody chain: four market tiles hung on
 * the orange ring, a smart-contract chip, two orange nodes sitting on the
 * strokes, a withdraw chip, and the wallet ring with your wallet inside it. The
 * motion simply walks that chain in the direction the copy promises — out of the
 * markets, through the contracts, into your wallet — and then stops.
 *
 * LOAD-IN (2.3s, after the band's entrance has landed the card)
 *   The three circles and the glow arrive with the card; they are the diagram's
 *   frame. The wallet is the lead and holds the stage alone for half a second,
 *   because it is the thing the sentence is about. Then the two contract chips,
 *   then the four assets each with its label, 0.11s apart, then the two nodes.
 *   Everything rises eight pixels or less on `expo.out`; nothing overshoots.
 *
 * LOOP (6.1s of story, then 6.0s of nothing — 12.1s end to end)
 *   Stocks, crypto, commodities and forex light in turn; the smart-contract chip
 *   answers; the node on the orbit flares; "Withdraw anytime" lights; the node on
 *   the wallet ring flares; an orange arc closes right round the wallet ring
 *   starting from that node, and the wallet disc takes one pulse as it arrives.
 *   Then the card sits still for six seconds. Every element ends on the value the
 *   design ships, so a resting frame is the approved static design.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { bandStaged, onSectionReady, pulse, q1, qa, whileVisible } from './shared';

const NS = 'http://www.w3.org/2000/svg';

/* Ellipse 56 of ring-wallet.svg: r 46 about (46.5, 46.5) in a 93 box that
   BoxCustody.css parks at (8, 61) of the 464 x 215 diagram. Node A's 8px dot
   centre sits at (26, 71), which is 232 degrees round that circle measured the
   way an SVG circle is drawn — from three o'clock, clockwise — so the arc can
   start exactly under the node and close back onto it. */
const WALLET_R = 46;
const WALLET_C = 46.5;
const NODE_A_DEG = 232;

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

  /* The wallet ring's fill line. Built here rather than shipped in the markup
     because it does not exist in the resting design — it is the beat itself. It
     is sized in the card's own `--u`, which resolves normally on a descendant;
     only the card, which is the query container, cannot read that unit. */
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 93 93');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.style.cssText = 'left:calc(8 * var(--u));top:calc(61 * var(--u));'
    + 'width:calc(93 * var(--u));height:calc(93 * var(--u));overflow:visible;pointer-events:none';
  const fill = document.createElementNS(NS, 'circle');
  fill.setAttribute('cx', String(WALLET_C));
  fill.setAttribute('cy', String(WALLET_C));
  fill.setAttribute('r', String(WALLET_R));
  fill.setAttribute('stroke', '#ff632a');
  fill.setAttribute('stroke-width', '1.6');
  fill.setAttribute('stroke-linecap', 'round');
  fill.setAttribute('transform', `rotate(${NODE_A_DEG} ${WALLET_C} ${WALLET_C})`);
  svg.appendChild(fill);
  // Behind the wallet disc, so the arc reads as the ring filling rather than as
  // a line drawn over the top of the artwork.
  art.insertBefore(svg, disc);

  const CIRC = 2 * Math.PI * WALLET_R;
  fill.style.strokeDasharray = String(CIRC);
  fill.style.strokeDashoffset = String(CIRC);
  fill.style.opacity = '0';

  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state */
    gsap.set([disc, icon, ...nodes], { transformOrigin: '50% 50%' });
    // GSAP cannot interpolate out of the keyword `none`, so the tiles rest on an
    // explicit identity filter that the loop's highlight can move off.
    gsap.set(tiles, { filter: 'brightness(1)' });
    if (staged) {
      gsap.set([disc, icon, walletLabel, ...chips, ...tiles, ...labels], { opacity: 0 });
      gsap.set([disc, icon], { scale: 0.9 });
      gsap.set([walletLabel, ...chips, ...tiles, ...labels], { y: 8 });
      gsap.set(nodes, { opacity: 0, scale: 0.6 });
    }

    /* ---------------------------------------------------------------- loop */
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 6 });

    // 1 — the markets answer, one after another
    tiles.forEach((tile, i) => {
      pulse(loop, tile, i * 0.18,
        { filter: 'brightness(1.6)' }, { filter: 'brightness(1)' }, 0.34, 0.7);
    });
    // 2 — the contract chip, 3 — the node on the orbit
    pulse(loop, chips[0], 1.1,
      { scale: 1.025, borderColor: 'rgba(255, 99, 42, 0.62)' },
      { scale: 1, borderColor: getComputedStyle(chips[0]).borderTopColor }, 0.4, 0.75);
    pulse(loop, nodes[1], 1.85, { scale: 1.35 }, { scale: 1 }, 0.34, 0.7);
    // 4 — the withdrawal, 5 — the node on the wallet ring
    pulse(loop, chips[1], 2.55,
      { scale: 1.025, borderColor: 'rgba(255, 99, 42, 0.62)' },
      { scale: 1, borderColor: getComputedStyle(chips[1]).borderTopColor }, 0.4, 0.75);
    pulse(loop, nodes[0], 3.3, { scale: 1.35 }, { scale: 1 }, 0.34, 0.7);
    // 6 — the ring closes and the wallet takes the funds
    loop
      .to(fill, { opacity: 1, duration: 0.35, ease: 'sine.out' }, 3.5)
      .fromTo(fill, { strokeDashoffset: CIRC }, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut' }, 3.55)
      .to(fill, { opacity: 0, duration: 0.75, ease: 'sine.inOut' }, 5.35);
    pulse(loop, disc, 4.4, { scale: 1.07 }, { scale: 1 }, 0.4, 0.85);
    pulse(loop, walletLabel, 4.45,
      { textShadow: '0 0 10px rgba(255, 251, 248, 0.8)' },
      { textShadow: '0 0 0px rgba(255, 251, 248, 0)' }, 0.4, 0.85);

    /* ------------------------------------------------------------- load-in
       The tile and its label travel together, so the pairs are interleaved and
       the stagger is halved to keep the gap between assets at 0.11s. */
    const assets: HTMLElement[] = [];
    tiles.forEach((tile, i) => { assets.push(tile); if (labels[i]) assets.push(labels[i]); });

    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to([disc, icon], { opacity: 1, scale: 1, duration: 1, ease: 'expo.out' }, 0)
      .to(walletLabel, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.14)
      .to(chips, { opacity: 1, y: 0, duration: 0.75, ease: 'expo.out', stagger: 0.16 }, 0.55)
      .to(assets, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.055 }, 0.85)
      .to(nodes, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', stagger: 0.14 }, 1.6);

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
