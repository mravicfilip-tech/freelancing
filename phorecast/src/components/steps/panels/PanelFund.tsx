import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import s2Lines from '../../../assets/steps/s2-lines.svg';
import s2Node from '../../../assets/steps/s2-node.svg';
import s2Lock from '../../../assets/steps/s2-lock.svg';
import s2Progress from '../../../assets/steps/s2-progress.svg';
import { REDUCED, all, count, one } from '../../../lib/motion';
import { tok, useThemeEpoch } from '../../../lib/theme';
import { Icon } from '../../Icon';
import { Mark, Glow } from './shared';
import './PanelFund.css';

/* The rails, in the lines asset's own 347.723 x 315.7 user space ------------
 *
 * s2-lines.svg is one path made of seven subpaths: five real rails and two
 * stubs a couple of pixels long either side of the junction. These are the
 * five, each written so its FIRST point is the tile end and its last is the
 * junction under the node -- the direction a charge travels. The straight one
 * is already drawn that way; the four curves are drawn junction-first in the
 * asset and are reversed when they are sampled.
 *
 * They are shipped as invisible geometry in the markup (`.s2__geom`) rather
 * than built at runtime, because a sampler that captures the element list once
 * cannot see anything the loop creates mid-flight. */
const RAILS: { d: string; reverse: boolean }[] = [
  { d: 'M5.02127 156.822H305.043', reverse: false },
  { d: 'M310.064 156.822C310.064 156.822 254.83 166.211 161.936 254.622C107.871 306.078 19.4574 309.424 19.4574 309.424', reverse: true },
  { d: 'M310.064 156.822C310.064 156.822 236.698 132.936 150.638 54.3287C77.8298 -12.1746 18.3824 9.73208 18.3824 9.73208', reverse: true },
  { d: 'M305.043 156.822C305.043 156.822 216.543 127.874 168.213 107.532C119.408 86.9892 17.2711 80.1477 17.2711 80.1477', reverse: true },
  { d: 'M305.043 156.822C305.043 156.822 223.447 176.382 168.213 204.549C120.486 228.887 21.4756 229.585 21.4756 229.585', reverse: true },
];

/** Where `.s2__lines` (and so the rail geometry above) sits in the panel's own
 *  886 x 610 design pixels. Kept in step with the same numbers in the CSS. */
const LINES_X = 123.937;
const LINES_Y = 151.094;

/* The deposit card's code block --------------------------------------------
 *
 * Nine rows of nine, three of them the finder rings a scanner looks for. It is
 * DRAWN rather than fetched, for the same reason the glow is: there is no
 * asset for it, and a diagram of an address does not need one. There is no
 * payload in it and it is not meant to be scanned -- it is the same kind of
 * stand-in as the $18,800 beside it and the you@phorcast.io on panel 1.
 *
 * Nine cells each way rather than a real QR's 21 because the block is 106
 * design pixels wide: at 21 a cell is 5 design px, which is under two CSS
 * pixels at the width this panel is drawn on a phone, and a grid that fine
 * renders as grey mush. */
const QR = [
  'XXX.X.XXX',
  'X.X...X.X',
  'XXX.XXXXX',
  '...X.X...',
  'X.XXX..X.',
  '..X...XX.',
  'XXX.X.X.X',
  'X.X.XXX..',
  'XXX.X..XX',
].join('').split('');

/* The loop ------------------------------------------------------------------
 *
 * One beat, and it is the step's own sentence acted out: a deposit leaves the
 * address, travels, and the balance is credited when it confirms.
 *
 *   0.00  the deposit card wakes -- its edge comes up to the lit value and the
 *         code block goes with it, the one beat the five payment tiles used to
 *         play in turn
 *   0.12  a charge leaves each rail's resting place and rides that rail all
 *         the way to the junction, following the curve the artwork draws and
 *         turning with its tangent, 0.13 apart. The longest run is the
 *         straight rail, 300 design px; the shortest is comet 4, already most
 *         of the way in at rest, at 93. Each fades out over its last 0.30s.
 *   1.62  the disc under the padlock takes the arrivals -- one swell to 1.45
 *   1.66  the beam behind it, which is a real part of the design and rests at
 *         full, drives out from the node into the card
 *   1.80  the figure drops out downward, is reset to the pre-deposit $12,400
 *         behind its own fade, and rolls back in; the progress indicator
 *         drains right to left at the same moment
 *   2.08  $12,400 counts to $18,800 over 1.45s while the indicator refills
 *   2.30  the padlock lifts 6 design px and slams shut over the credited figure
 *   3.35  the comets return to their design positions behind an opacity fade,
 *         0.06 apart, and are back at full by 4.10
 *   4.10  every inline style the loop wrote is handed back to CSS
 *         (`clearProps`), the figure is restored to the design's $18,800, and
 *         the panel sits perfectly still for 1.80s before going again.
 *         Period 5.90s in GSAP time, inside the stepper's 6s dwell.
 *
 * Mechanics worth keeping:
 * - There is not one delayed `fromTo` here, which is the only construct that
 *   writes its start value at build time and strands elements in it. Start
 *   states are `tl.set(..., 0)`: a timeline `set` at position 0 renders when
 *   the timeline is built AND every time the playhead returns to 0, so each
 *   repeat re-arms without a second code path, and the mid-timeline `set`s
 *   (the figure's roll) render only when the playhead reaches them. Where a
 *   `to` needs an explicit landing value it is stated, never inferred.
 * - Rest is the design: one `clearProps: 'all'` at STORY removes everything
 *   the loop wrote, including the comets' flight transforms, so the resting
 *   frame is the stylesheet's and nothing is left inline. The counted text is
 *   put back by hand, on the last frame of the story and again on teardown,
 *   because text content is not a style.
 * - Distances that have to look the same at every width are read off the
 *   rendered box as design pixels (`p`), not hardcoded in CSS pixels.
 * - No hover, no pointer, no idle drift. Reduced motion never builds anything.
 */
const STORY = 4.1;
const REST = 1.8;
const START_AMOUNT = 12400;
const END_AMOUNT = 18800;
const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

type Pt = { x: number; y: number };

/** Walk a path into `n + 1` evenly spaced points, tile end first. */
function sampleRail(path: SVGPathElement, reverse: boolean, n = 220): Pt[] {
  const len = path.getTotalLength();
  const out: Pt[] = [];
  for (let i = 0; i <= n; i += 1) {
    const at = (reverse ? n - i : i) / n;
    const pt = path.getPointAtLength(at * len);
    out.push({ x: pt.x, y: pt.y });
  }
  return out;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function pointAt(pts: Pt[], u: number): Pt {
  const f = Math.min(Math.max(u, 0), 1) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return { x: lerp(pts[i].x, pts[i + 1].x, t), y: lerp(pts[i].y, pts[i + 1].y, t) };
}

/** The rail's heading at `u`, in degrees, measured over a short chord so a
 *  single sample's quantisation cannot make it jitter. */
function headingAt(pts: Pt[], u: number): number {
  const span = 6 / (pts.length - 1);
  const a = pointAt(pts, u - span);
  const b = pointAt(pts, u + span);
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function useFundLoop() {
  const ref = useRef<HTMLDivElement>(null);
  /* Three colour values and the card's resting border are read once, at build
     time, so the build has to be redone when the theme changes -- otherwise the
     card would go on firing to the palette that was live when the panel
     mounted, and cooling back to a border that is no longer its own. */
  const epoch = useThemeEpoch();

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || REDUCED) return;

    const card = one(root, '.s2__addr');
    const qr = one(root, '.s2__qr');
    const comets = all(root, '.s2__comet');
    const paths = all<SVGPathElement>(root, '.s2__geom path');
    const disc = one(root, '.s2__disc');
    const lock = one(root, '.s2__lock');
    const beam = one(root, '.s2__beam');
    const amount = one(root, '.s2__balance-amt');
    const progress = one(root, '.s2__progress');
    if (comets.length !== 5 || paths.length !== 5) return;
    if (!card || !qr || !disc || !lock || !beam || !amount || !progress) return;

    // The design pixel, read off the rendered box rather than out of `--p`:
    // the unit is written in container-query units and computes to an
    // unresolved token, so it can only be measured.
    const box = root.getBoundingClientRect();
    const p = box.width / 886;
    if (p <= 0) return;
    const restAmount = amount.textContent ?? money(END_AMOUNT);
    const restBorder = getComputedStyle(card).borderTopColor;
    /* The card firing, as a pair per property. The code block's lift is a
       `filter`, and GSAP interpolates filters STRUCTURALLY, so the two values
       have to list the same functions in the same order -- which is why the
       rest value is named here rather than written as the identity
       `brightness(1)` at the call site. Today's values are the fallbacks. */
    const cardLit = tok('--steps-p2-addr-lit', 'rgba(255, 128, 96, 0.55)');
    const glyphRest = tok('--steps-p2-glyph-rest', 'brightness(1)');
    const glyphLit = tok('--steps-p2-glyph-lit', 'brightness(2.1)');

    /* Which rail is each comet resting on, and how far along it?
       Asked of the geometry rather than assumed, so the answer stays right if
       an asset is ever re-exported with the curves in another order. */
    const rails = paths.map((path, i) => sampleRail(path, RAILS[i].reverse));
    const rides = comets.map((el) => {
      const r = el.getBoundingClientRect();
      // Rotation is about the centre, so the centre of the axis-aligned box the
      // browser reports is still the element's own centre.
      const rest: Pt = {
        x: (r.left + r.width / 2 - box.left) / p - LINES_X,
        y: (r.top + r.height / 2 - box.top) / p - LINES_Y,
      };
      let best = { pts: rails[0], u: 0, d: Infinity };
      rails.forEach((pts) => {
        pts.forEach((pt, i) => {
          const d = (pt.x - rest.x) ** 2 + (pt.y - rest.y) ** 2;
          if (d < best.d) best = { pts, u: i / (pts.length - 1), d };
        });
      });
      // `DOMMatrix` is fed the computed transform, which is the string
      // `none` for the one comet the design does not rotate; not every
      // engine parses that, so identity is the fallback.
      const css = getComputedStyle(el).transform;
      let rot = new DOMMatrixReadOnly();
      if (css && css !== 'none') { try { rot = new DOMMatrixReadOnly(css); } catch { /* identity */ } }
      return {
        el,
        pts: best.pts,
        u0: best.u,
        rest,
        rot0: (Math.atan2(rot.b, rot.a) * 180) / Math.PI,
        tan0: headingAt(best.pts, best.u),
      };
    });

    type Ride = (typeof rides)[number];
    const place = (ride: Ride, u: number) => {
      const pt = pointAt(ride.pts, u);
      const run = Math.max(1e-3, 1 - ride.u0);
      const t = Math.min(Math.max((u - ride.u0) / run, 0), 1);
      gsap.set(ride.el, {
        x: (pt.x - ride.rest.x) * p,
        y: (pt.y - ride.rest.y) * p,
        // The design's own rotation, carried along the curve: the comet keeps
        // the angle it was drawn at relative to the rail beneath it, so there
        // is no snap on the frame the ride starts.
        rotation: ride.rot0 + (headingAt(ride.pts, u) - ride.tan0),
        scaleX: 1 + 0.25 * Math.sin(Math.PI * t),
      });
    };

    const everything = [card, qr, ...comets, disc, lock, beam, amount, progress];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: REST, paused: true });

      /* ---- the panel at the start of the story, re-applied on every repeat */
      tl.set(everything, { clearProps: 'all' }, 0)
        .set([disc, lock], { transformOrigin: '50% 50%' }, 0)
        .set(beam, { scaleX: 0.08, opacity: 0.25, transformOrigin: '0% 50%' }, 0)
        .call(() => { amount.textContent = restAmount; }, undefined, 0);

      /* ---- 1. the address wakes, and the rails let their charges go */
      tl.to(card, { borderColor: cardLit, duration: 0.3, ease: 'power2.out' }, 0)
        .to(card, { borderColor: restBorder, duration: 0.62, ease: 'power2.inOut' }, 0.3)
        .to(qr, { filter: glyphLit, duration: 0.3, ease: 'power2.out' }, 0)
        .to(qr, { filter: glyphRest, duration: 0.62, ease: 'power2.inOut' }, 0.3);

      rides.forEach((ride, i) => {
        const at = i * 0.13;
        const flight = { u: ride.u0 };
        tl.set(flight, { u: ride.u0 }, at + 0.12)
          .to(flight, {
            u: 1,
            duration: 1.3,
            ease: 'power2.in',
            onUpdate: () => place(ride, flight.u),
          }, at + 0.12)
          .to(ride.el, { opacity: 0, duration: 0.3, ease: 'power1.in' }, at + 1.12)
          // Back to the design's spot while it is invisible, so the return is
          // a fade and never a slide backwards along the rail.
          .set(ride.el, { clearProps: 'transform' }, at + 1.42)
          .to(ride.el, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 3.35 + i * 0.06);
      });

      /* ---- 2. the node takes the arrivals, and pushes them into the card */
      tl.to(disc, { scale: 1.45, duration: 0.24, ease: 'back.out(2.4)' }, 1.62)
        .to(disc, { scale: 1, duration: 0.5, ease: 'power2.out' }, 1.86)
        .to(beam, { scaleX: 1, opacity: 1, duration: 0.55, ease: 'power3.out' }, 1.66);

      /* ---- 3. the deposit is credited
         The figure leaves before it is reset, so the drop from $18,800 back to
         the pre-deposit $12,400 happens behind its own fade and is never a
         visible step backwards. */
      tl.to(amount, { yPercent: -32, opacity: 0, duration: 0.22, ease: 'power2.in' }, 1.8)
        .set(amount, { yPercent: 32 }, 2.04)
        .call(() => { amount.textContent = money(START_AMOUNT); }, undefined, 2.04)
        .to(amount, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, 2.04)
        .to(progress, { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.2, ease: 'power2.in' }, 1.8)
        .to(progress, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.45, ease: 'power2.out' }, 2.05);
      count(tl, amount, START_AMOUNT, END_AMOUNT, 2.08, 1.45, money);

      /* ---- 4. and it is locked */
      tl.to(lock, { y: -6 * p, scale: 1.3, duration: 0.2, ease: 'power2.out' }, 2.3)
        .to(lock, { y: 0, scale: 1, duration: 0.42, ease: 'back.out(3)' }, 2.5);

      /* ---- 5. hand it all back to CSS and hold still */
      tl.set(everything, { clearProps: 'all' }, STORY)
        .call(() => { amount.textContent = restAmount; }, undefined, STORY);

      tl.play(0);
    }, root);

    return () => {
      ctx.revert();
      // `revert` restores inline styles; the counted text is ours to undo.
      amount.textContent = restAmount;
    };
  }, [epoch]);

  return ref;
}

/* Panel 2 — a deposit address, and the balance it credits ----------------- */
export function PanelFund() {
  const ref = useFundLoop();

  return (
    <div className="panel panel--2">
      <Mark className="steps__mark--right" />
      <Glow className="steps__glow--right" />
      <div className="s2" ref={ref} aria-hidden="true">
        <img src={s2Lines} alt="" className="s2__lines" width={347.723} height={315.7} />
        <svg className="s2__geom" viewBox="0 0 347.723 315.7" fill="none" aria-hidden="true" focusable="false">
          {RAILS.map((rail) => <path key={rail.d} d={rail.d} />)}
        </svg>

        {/* Where the five payment tiles were. Funding is one thing now -- crypto
            sent to your own deposit address -- so what stands at the head of
            the rails is that address: the network it is on, the key, and the
            minimum. It keeps the tiles' box exactly (65,129 to 205,482), which
            is what holds the phone layout's `--cx`/`--cy` centring true and
            keeps every rail end tucked behind something. */}
        <div className="s2__addr">
          <span className="s2__qr">
            {QR.map((cell, i) => <i key={i} className={cell === 'X' ? 'is-on' : undefined} />)}
          </span>
          <span className="s2__addr-id">
            <p className="s2__addr-net">USDC · ARBITRUM</p>
            <p className="s2__addr-key">0x7F3A…4C2B</p>
          </span>
          <span className="s2__addr-rule" />
          <p className="s2__addr-min">MIN $10</p>
        </div>

        {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`s2__comet s2__comet--${i}`} />)}

        <span className="s2__node">
          <span className="s2__beam"><i /></span>
          <img src={s2Node} alt="" className="s2__disc" width={38.5532} height={38.5532} />
          <img src={s2Lock} alt="" className="s2__lock" width={16} height={16} />
        </span>

        <div className="s2__balance">
          <div className="s2__balance-inner">
            <div className="s2__balance-content">
              <div className="s2__balance-text">
                <p className="s2__balance-label">BALANCE</p>
                <p className="s2__balance-amt">$18,800</p>
              </div>
              <span className="s2__progress">
                {/* Four #e5331e bars on transparent: one flat brand colour, so
                    a mask, and --accent carries it to #a21605 on paper rather
                    than leaving one stray dark-theme red inside a light card.
                    Sized by PanelFund.css in design pixels, like every other
                    glyph here. */}
                <Icon src={s2Progress} w={70.2991} h={7.53191} style={{ width: undefined, height: undefined }} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
