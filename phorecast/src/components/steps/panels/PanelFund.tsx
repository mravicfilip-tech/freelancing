import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import s2Lines from '../../../assets/steps/s2-lines.svg';
import s2Node from '../../../assets/steps/s2-node.svg';
import s2Lock from '../../../assets/steps/s2-lock.svg';
import s2Progress from '../../../assets/steps/s2-progress.svg';
import s2Tile1 from '../../../assets/steps/s2-tile1.svg';
import s2Tile2 from '../../../assets/steps/s2-tile2.svg';
import s2Tile3 from '../../../assets/steps/s2-tile3.svg';
import s2Tile4 from '../../../assets/steps/s2-tile4.svg';
import s2Tile5 from '../../../assets/steps/s2-tile5.svg';
import { REDUCED, all, count, one } from '../../../lib/motion';
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

const TILES = [s2Tile1, s2Tile2, s2Tile3, s2Tile4, s2Tile5];
const TILE_ICON = [
  { w: 34, h: 34 }, { w: 34, h: 23.3755 }, { w: 34, h: 34 }, { w: 34, h: 34 }, { w: 23.75, h: 25.9281 },
];

/* The loop ------------------------------------------------------------------
 *
 * One beat, and it is the step's own sentence acted out: money arrives down
 * every rail at once, lands on a node that is locked, and the balance is
 * credited.
 *
 *   0.00  the five tiles fire in turn, 0.13 apart -- each brightens its border
 *         and its glyph and leans 10 design px toward the node
 *   0.12  each tile's comet leaves its resting place and rides its own rail all
 *         the way to the junction, following the curve the artwork draws and
 *         turning with its tangent. The longest run is the straight rail from
 *         the phone tile, 300 design px; the shortest is comet 4, already most
 *         of the way in at rest, at 93. Each fades out over its last 0.30s.
 *   1.62  the disc under the padlock takes the arrivals -- one swell to 1.45
 *   1.66  the beam behind it, which is a real part of the design and rests at
 *         full, drives out from the node into the card
 *   1.80  the figure drops out downward, is reset to the pre-deposit $12,400
 *         behind its own fade, and rolls back in; the progress indicator
 *         drains right to left at the same moment
 *   2.08  $12,400 counts to $18,800 over 1.45s while the indicator refills
 *   2.30  the padlock lifts 6 design px and slams shut: the balance is yours
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

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || REDUCED) return;

    const tiles = all(root, '.s2__tile');
    const glyphs = all(root, '.s2__tile-icon');
    const comets = all(root, '.s2__comet');
    const paths = all<SVGPathElement>(root, '.s2__geom path');
    const disc = one(root, '.s2__disc');
    const lock = one(root, '.s2__lock');
    const beam = one(root, '.s2__beam');
    const amount = one(root, '.s2__balance-amt');
    const progress = one(root, '.s2__progress');
    if (tiles.length !== 5 || comets.length !== 5 || paths.length !== 5) return;
    if (!disc || !lock || !beam || !amount || !progress) return;

    // The design pixel, read off the rendered box rather than out of `--p`:
    // the unit is written in container-query units and computes to an
    // unresolved token, so it can only be measured.
    const box = root.getBoundingClientRect();
    const p = box.width / 886;
    if (p <= 0) return;
    const restAmount = amount.textContent ?? money(END_AMOUNT);
    const restBorder = tiles.map((t) => getComputedStyle(t).borderTopColor);

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
      const rot = new DOMMatrixReadOnly(getComputedStyle(el).transform);
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

    const everything = [...tiles, ...glyphs, ...comets, disc, lock, beam, amount, progress];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: REST, paused: true });

      /* ---- the panel at the start of the story, re-applied on every repeat */
      tl.set(everything, { clearProps: 'all' }, 0)
        .set([disc, lock], { transformOrigin: '50% 50%' }, 0)
        .set(beam, { scaleX: 0.08, opacity: 0.25, transformOrigin: '0% 50%' }, 0)
        .call(() => { amount.textContent = restAmount; }, undefined, 0);

      /* ---- 1. the rails fire, and each one lets its charge go */
      rides.forEach((ride, i) => {
        const at = i * 0.13;
        tl.to(tiles[i], { x: 10 * p, borderColor: 'rgba(255, 128, 96, 0.55)', duration: 0.3, ease: 'power2.out' }, at)
          .to(tiles[i], { x: 0, borderColor: restBorder[i], duration: 0.62, ease: 'power2.inOut' }, at + 0.3)
          .to(glyphs[i], { filter: 'brightness(2.1)', duration: 0.3, ease: 'power2.out' }, at)
          .to(glyphs[i], { filter: 'brightness(1)', duration: 0.62, ease: 'power2.inOut' }, at + 0.3);

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
  }, []);

  return ref;
}

/* Panel 2 — funding rails converge on a locked balance ------------------- */
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

        <div className="s2__rails">
          {TILES.map((icon, i) => (
            <span key={icon} className={`s2__tile s2__tile--${i + 1}`}>
              <span className="s2__tile-icon">
                <img src={icon} alt="" width={TILE_ICON[i].w} height={TILE_ICON[i].h} />
              </span>
            </span>
          ))}
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
                <img src={s2Progress} alt="" width={70.2991} height={7.53191} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
