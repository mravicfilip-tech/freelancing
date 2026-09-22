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
import type { Timeline } from '../../../lib/motion';
import { REDUCED, all, count, one } from '../../../lib/motion';
import { tok, useThemeEpoch } from '../../../lib/theme';
import { Icon } from '../../Icon';
import { Mark, Glow } from './shared';
import './PanelFund.css';

/* The rails, in the lines asset's own 342.702 x 305.147 user space ----------
 *
 * s2-lines.svg is one path made of seven subpaths: five real rails and two
 * stubs either side of the junction. These are the five, each written so its
 * FIRST point is the tile end and its last is the junction under the node --
 * the direction a charge travels. The straight one is already drawn that way;
 * the four curves are drawn junction-first in the asset and are reversed when
 * they are sampled. (Re-checked against the 2026 export: still four of five.)
 *
 * THESE ARE A TRANSCRIPTION AND THEY GO STALE SILENTLY. The 2026 re-export of
 * node 365:1345 dropped the asset's Gaussian blur, which shrank its viewBox
 * from 347.723 x 315.7 to 342.702 x 305.147 and moved every coordinate in it
 * by (-5.02127, -5.2766). The path SHAPE did not move at all -- the asset's
 * origin moved by exactly the same amount the other way, so the junction still
 * lands on (428.98, 307.92) in the panel's own field, within 0.005 of where it
 * was. If the asset is re-exported again, re-derive both these strings and the
 * two offsets below or the charge flies down geometry that is no longer under
 * it, and nothing throws.
 *
 * They are shipped as invisible geometry in the markup (`.s2__geom`) rather
 * than built at runtime, because a sampler that captures the element list once
 * cannot see anything the loop creates mid-flight. */
const RAILS: { d: string; reverse: boolean }[] = [
  { d: 'M0 151.546H300.021', reverse: false },
  { d: 'M305.043 151.546C305.043 151.546 249.809 160.935 156.915 249.345C102.85 300.801 14.4362 304.148 14.4362 304.148', reverse: true },
  { d: 'M305.043 151.546C305.043 151.546 231.677 127.659 145.617 49.0521C72.8085 -17.4512 13.3611 4.45548 13.3611 4.45548', reverse: true },
  { d: 'M300.021 151.546C300.021 151.546 211.521 122.597 163.191 102.255C114.386 81.7126 12.2498 74.8711 12.2498 74.8711', reverse: true },
  { d: 'M300.021 151.546C300.021 151.546 218.426 171.106 163.191 199.272C115.465 223.61 16.4544 224.309 16.4544 224.309', reverse: true },
];

/** The lines asset's own size, and where it sits in the panel's 886 x 610
 *  design pixels. All four are Figma's: the asset is hung off the 25.10638
 *  square "Profile Picture Container" at (446.549, 261.56), and node 365:1398
 *  reports its geometry box at (128.954, 157.372) sized 321.362 x 303.148,
 *  which places the asset's own origin at the two numbers below. Kept in step
 *  with the same numbers in the CSS. */
const LINES_W = 342.702;
const LINES_H = 305.147;
const LINES_X = 128.9542;
const LINES_Y = 156.372;

const TILES = [s2Tile1, s2Tile2, s2Tile3, s2Tile4, s2Tile5];
const TILE_ICON = [
  { w: 34, h: 34 }, { w: 34, h: 23.3755 }, { w: 34, h: 34 }, { w: 34, h: 34 }, { w: 23.75, h: 25.9281 },
];

/* The loop ------------------------------------------------------------------
 *
 * One beat, and it is the step's own sentence acted out: money arrives, lands
 * on a node that is locked, and the balance is credited.
 *
 * There are TWO casts, because the phone has two thirds fewer parts on stage --
 * see THE PHONE COMPOSITION in PanelFund.css for what is dropped and why. Which
 * one is playing is asked of the STYLESHEET, not of the viewport: the media
 * query that hides the tiles is the single source of truth, so a beat can never
 * fire at something that is `display: none`.
 *
 * THE DESKTOP BEAT SHEET -- five rails, five comets, the node and the card
 *
 *   0.00  the five tiles fire in turn, 0.13 apart -- each brightens its border
 *         and its glyph and leans 10 design px toward the node
 *   0.12  each tile's comet leaves its resting place and rides its own rail all
 *         the way to the junction, following the curve the artwork draws and
 *         turning with its tangent. The runs, measured off the shipped
 *         geometry rather than guessed: comet 5 covers 237 design px of rail,
 *         comet 3 207, comet 1 169, comet 2 153, and comet 4 only 78 -- it
 *         rests most of the way in. Each fades out over its last 0.30s.
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
 * THE PHONE BEAT SHEET -- the locked node and the card, and nothing else
 *
 * The cast is five elements, so the law is easy to keep: the disc has the
 * stage on its own for half a second, and everything else arrives in its wake.
 *
 *   0.00  the disc under the padlock takes the arrival -- one swell to 1.45
 *         over 0.24s, settling back over 0.50s. Nothing else is moving.
 *   0.55  the beam behind it, which is a real part of the design and rests at
 *         full, drives out from the node into the card
 *   0.80  the figure drops out downward, is reset to the pre-deposit $12,400
 *         behind its own fade, and rolls back in; the progress indicator
 *         drains right to left at the same moment
 *   1.08  $12,400 counts to $18,800 over 1.60s -- slower than the desktop's
 *         1.45, because on the phone it is the only thing left to watch --
 *         while the indicator refills behind it
 *   1.50  the padlock lifts 6 design px and slams shut: the balance is yours
 *   2.70  every inline style the loop wrote is handed back to CSS, the figure
 *         is restored to the design's $18,800, and the panel sits perfectly
 *         still for 3.10s before going again.
 *         Period 5.80s in GSAP time, inside the stepper's 6s dwell.
 *
 * Mechanics worth keeping:
 * - There is not one delayed `fromTo` here, which is the only construct that
 *   writes its start value at build time and strands elements in it. Start
 *   states are `tl.set(..., 0)`: a timeline `set` at position 0 renders when
 *   the timeline is built AND every time the playhead returns to 0, so each
 *   repeat re-arms without a second code path, and the mid-timeline `set`s
 *   (the figure's roll) render only when the playhead reaches them. Where a
 *   `to` needs an explicit landing value it is stated, never inferred.
 * - Rest is the design: one `clearProps: 'all'` at the end of the story removes
 *   everything the loop wrote, including the comets' flight transforms, so the
 *   resting frame is the stylesheet's and nothing is left inline. It is handed
 *   the cast that is actually on stage, so the phone never writes to a hidden
 *   element even to clear it. The counted text is put back by hand, on the last
 *   frame of the story and again on teardown, because text content is not a
 *   style.
 * - Distances that have to look the same at every width are read off the
 *   rendered box as design pixels (`p`), not hardcoded in CSS pixels. It is
 *   measured off the balance card, whose 346 design px is the widest thing in
 *   the panel and so the least sensitive to rounding -- and, unlike the panel's
 *   own width, it is the same question on both casts, because the two have
 *   different bases (886 and 442).
 * - No hover, no pointer, no idle drift. Reduced motion never builds anything.
 */
const STORY = 4.1;
const REST = 1.8;
const STORY_PHONE = 2.7;
const REST_PHONE = 3.1;
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
  /* Three colour values and each tile's resting border are read once, at build
     time, so the build has to be redone when the theme changes -- otherwise the
     tiles would go on firing to the palette that was live when the panel
     mounted, and cooling back to a border that is no longer theirs. */
  const epoch = useThemeEpoch();

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
    const card = one(root, '.s2__balance');
    if (tiles.length !== 5 || comets.length !== 5 || paths.length !== 5) return;
    if (!disc || !lock || !beam || !amount || !progress || !card) return;

    // The design pixel, read off the rendered box rather than out of `--p`:
    // the unit is written in container-query units and computes to an
    // unresolved token, so it can only be measured. The card is what it is
    // measured on: it is 346 design px on both casts, where the panel's own
    // width means 886 on the desktop and 442 on the phone.
    const box = root.getBoundingClientRect();
    const p = card.getBoundingClientRect().width / 346;
    if (p <= 0) return;

    /* WHICH CAST IS ON STAGE. The phone drops the tiles, the rails, the lines
       and the comets in CSS -- see THE PHONE COMPOSITION in PanelFund.css --
       so this asks the stylesheet rather than the viewport: one source of
       truth, and nothing here can then fire at a hidden element.

       It asks the RENDER and not the element's own `display`, which is the
       trap this walked into once already. The rule hides the rails CONTAINER,
       and an element inside a `display: none` ancestor still reports its own
       computed display -- `block` for an absolutely positioned span -- so the
       obvious test came back false on a phone and the desktop cast went on
       animating five tiles and five comets that were not on the screen.
       `getClientRects()` is empty for anything that is not laid out at all,
       whichever ancestor took it off stage. */
    const phone = tiles[0].getClientRects().length === 0;

    const restAmount = amount.textContent ?? money(END_AMOUNT);
    /* The cast on stage. `clearProps` is only ever handed this, so the phone
       never writes to an element the stylesheet has taken out. */
    const cast = phone
      ? [disc, lock, beam, amount, progress]
      : [...tiles, ...glyphs, ...comets, disc, lock, beam, amount, progress];

    type Ride = { el: HTMLElement; pts: Pt[]; u0: number; rest: Pt; rot0: number; tan0: number };
    const rides: Ride[] = [];
    let restBorder: string[] = [];
    let tileLit = '';
    let glyphRest = '';
    let glyphLit = '';

    if (!phone) {
      restBorder = tiles.map((t) => getComputedStyle(t).borderTopColor);
      /* A tile firing, as a pair per property. The glyph's lift is a `filter`,
         and GSAP interpolates filters STRUCTURALLY, so the two values have to
         list the same functions in the same order -- which is why the rest
         value is named here rather than written as the identity
         `brightness(1)` at the call site. Today's values are the fallbacks. */
      tileLit = tok('--steps-p2-tile-lit', 'rgba(255, 128, 96, 0.55)');
      glyphRest = tok('--steps-p2-glyph-rest', 'brightness(1)');
      glyphLit = tok('--steps-p2-glyph-lit', 'brightness(2.1)');

      /* Which rail is each comet resting on, and how far along it?
         Asked of the geometry rather than assumed, so the answer stays right if
         an asset is ever re-exported with the curves in another order -- which
         is exactly what the 2026 re-export of 365:1345 did to the box these
         curves live in. */
      const rails = paths.map((path, i) => sampleRail(path, RAILS[i].reverse));
      comets.forEach((el) => {
        const r = el.getBoundingClientRect();
        // Rotation is about the centre, so the centre of the axis-aligned box
        // the browser reports is still the element's own centre.
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
        rides.push({
          el,
          pts: best.pts,
          u0: best.u,
          rest,
          rot0: (Math.atan2(rot.b, rot.a) * 180) / Math.PI,
          tan0: headingAt(best.pts, best.u),
        });
      });
    }

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

    /* The beats BOTH casts play: the node takes the arrival, drives it into
       the card, the figure is credited and the lock closes. Only the times and
       the length of the count differ between desktop and phone, so they are
       arguments rather than a second copy that can drift out of step. */
    const credit = (
      tl: Timeline,
      at: { disc: number; beam: number; figure: number; lock: number },
      countFor: number,
    ) => {
      /* the node takes the arrival, and pushes it into the card */
      tl.to(disc, { scale: 1.45, duration: 0.24, ease: 'back.out(2.4)' }, at.disc)
        .to(disc, { scale: 1, duration: 0.5, ease: 'power2.out' }, at.disc + 0.24)
        .to(beam, { scaleX: 1, opacity: 1, duration: 0.55, ease: 'power3.out' }, at.beam);

      /* the deposit is credited. The figure leaves before it is reset, so the
         drop from $18,800 back to the pre-deposit $12,400 happens behind its
         own fade and is never a visible step backwards. */
      tl.to(amount, { yPercent: -32, opacity: 0, duration: 0.22, ease: 'power2.in' }, at.figure)
        .set(amount, { yPercent: 32 }, at.figure + 0.24)
        .call(() => { amount.textContent = money(START_AMOUNT); }, undefined, at.figure + 0.24)
        .to(amount, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, at.figure + 0.24)
        .to(progress, { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.2, ease: 'power2.in' }, at.figure)
        .to(progress, { clipPath: 'inset(0% 0% 0% 0%)', duration: countFor, ease: 'power2.out' }, at.figure + 0.25);
      count(tl, amount, START_AMOUNT, END_AMOUNT, at.figure + 0.28, countFor, money);

      /* and it is locked */
      tl.to(lock, { y: -6 * p, scale: 1.3, duration: 0.2, ease: 'power2.out' }, at.lock)
        .to(lock, { y: 0, scale: 1, duration: 0.42, ease: 'back.out(3)' }, at.lock + 0.2);
    };

    const ctx = gsap.context(() => {
      const story = phone ? STORY_PHONE : STORY;
      const tl = gsap.timeline({ repeat: -1, repeatDelay: phone ? REST_PHONE : REST, paused: true });

      /* ---- the panel at the start of the story, re-applied on every repeat */
      tl.set(cast, { clearProps: 'all' }, 0)
        .set([disc, lock], { transformOrigin: '50% 50%' }, 0)
        .set(beam, { scaleX: 0.08, opacity: 0.25, transformOrigin: '0% 50%' }, 0)
        .call(() => { amount.textContent = restAmount; }, undefined, 0);

      if (phone) {
        /* Five elements on stage, so the law is easy to keep: the disc has the
           first half second on its own and everything else arrives in its
           wake. Nothing here touches a tile, a rail or a comet. */
        credit(tl, { disc: 0, beam: 0.55, figure: 0.8, lock: 1.5 }, 1.6);
      } else {
        /* ---- the rails fire, and each one lets its charge go */
        rides.forEach((ride, i) => {
          const at = i * 0.13;
          tl.to(tiles[i], { x: 10 * p, borderColor: tileLit, duration: 0.3, ease: 'power2.out' }, at)
            .to(tiles[i], { x: 0, borderColor: restBorder[i], duration: 0.62, ease: 'power2.inOut' }, at + 0.3)
            .to(glyphs[i], { filter: glyphLit, duration: 0.3, ease: 'power2.out' }, at)
            .to(glyphs[i], { filter: glyphRest, duration: 0.62, ease: 'power2.inOut' }, at + 0.3);

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

        credit(tl, { disc: 1.62, beam: 1.66, figure: 1.8, lock: 2.3 }, 1.45);
      }

      /* ---- hand it all back to CSS and hold still */
      tl.set(cast, { clearProps: 'all' }, story)
        .call(() => { amount.textContent = restAmount; }, undefined, story);

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

/* Panel 2 — funding rails converge on a locked balance ------------------- */
export function PanelFund() {
  const ref = useFundLoop();

  return (
    <div className="panel panel--2">
      <Mark className="steps__mark--right" />
      <Glow className="steps__glow--right" />
      <div className="s2" ref={ref} aria-hidden="true">
        <img src={s2Lines} alt="" className="s2__lines" width={LINES_W} height={LINES_H} />
        <svg className="s2__geom" viewBox={`0 0 ${LINES_W} ${LINES_H}`} fill="none" aria-hidden="true" focusable="false">
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
