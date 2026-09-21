/**
 * Card two — "Experienced Trader?" — the ambient loop.
 *
 * The illustration is a constellation: five market nodes (BTC / USD, TSLA,
 * DAX 40, EUR / USD, XAU / USD) wired to one self-custody padlock on the right.
 * The card's argument is *many markets, one settlement you hold*, so that is
 * the only thing this beat says.
 *
 * THE STORY — one delivery, every 8.5s
 * ------------------------------------
 *   0.82s  BTC leans a dozen design pixels along its own wire and, at 1.00s,
 *          lets a bead of value go. It is the farthest market out, 441 design
 *          px from the padlock, so it goes first.
 *   1.43 → EUR / USD, TSLA, XAU / USD and DAX 40 follow, each at the moment its
 *   2.12s  own distance says it must leave. Every bead travels the wire at the
 *          same speed, so the five departures are a wave whose shape is the
 *          field's real geometry — nearest market last, 1.12s behind BTC.
 *   2.75s  All five arrive at the padlock *together*. Five separate markets
 *          resolving into a single place: that convergence is the whole point,
 *          and it is solved, not staggered by eye — the departures are
 *          `arrival − distance / speed`.
 *   2.63s  The lock answers as they touch its rim: it leans into the delivery,
 *          takes it, and seats. SELF-CUSTODY goes brand red for a beat.
 *   3.45 → The circuit cools outward from the lock, nearest market first, and
 *   4.3s   every label, node and bead is back to the Figma frame.
 *   4.3 →  Nothing moves. The card is the design again for four seconds, and
 *   8.5s   for the 0.8s lead of the next cycle — 5.0s of an 8.5s period still.
 *
 * A DIFFERENT BEAT IN THE PORTRAIT FRAME
 * --------------------------------------
 * Below 700px Built.css re-lays this card into the 334 x 392 orbit Figma
 * 526:2656 draws: one ring, the five markets spaced around it, the padlock
 * alone at its centre, and SELF-CUSTODY seated on the ring's lower arc. There
 * are no wires, so there is no wave of departures solved from wire lengths --
 * the five markets are all the same distance from the hub, and a beat built on
 * "the farthest leaves first" says nothing at all on a circle.
 *
 * So the portrait beat is a CIRCUIT, and its order is the ring's own:
 *
 *   0.82s  A head appears where SELF-CUSTODY sits and starts round the ring
 *          clockwise, at a constant rate. It is the only travelling thing.
 *   1.40 → It reaches EUR / USD, BTC, TSLA, DAX 40 and XAU / USD in that order
 *   2.97s  -- which is not a schedule, it is where they are: each touch is
 *          `LEAD + (angle travelled / 360) * ORBIT`, measured off the live
 *          rects. The five gaps are 79.8, 40.2, 59.2, 63.1 and 55.2 degrees,
 *          so the wave opens wide and then tightens, exactly as the drawing
 *          spaces them.
 *   +0.18s Each market leans INWARD as it is touched and lets a bead go down
 *          its own radius to the padlock. Every radius is the same length, so
 *          the five arrivals keep the order of the five touches rather than
 *          converging: on a ring, sequence is the only thing distance can say.
 *   3.42s  The head closes the circuit back at SELF-CUSTODY and goes out.
 *   3.53s  The padlock answers the last delivery. It SEATS WITHOUT LEANING --
 *          the landscape lock leans along the mean of the wires, and the mean
 *          of five directions spread round a circle is a number with no
 *          meaning in it. The faint inner circle it sits in seats with it, so
 *          the centre answers as one object. SELF-CUSTODY goes brand red.
 *   4.35 → The pill cools and the card is the design again.
 *   5.2s
 *   5.2 →  Nothing moves.
 *   8.5s
 *
 * WHAT IS ASKED RATHER THAN ASSUMED, because this frame proves the cost of the
 * alternative -- the numbers below were all true of the landscape card only:
 *
 *   the frame          was `const DW = 640, DH = 254`. Read from `--fw`/`--fh`.
 *   the ring           centre and radius are read from `--bt2-ring-x/-y/-r`,
 *                      declared next to the mask that draws it in Built.css so
 *                      the two cannot move apart.
 *   the stations       every angle, including SELF-CUSTODY's, is measured off
 *                      the live rects. Nothing here knows the ring's order.
 *   the leans          12 and 6 design px are a PROPORTION of the card, scaled
 *                      by the frame.
 *   the bead           scaled too, with a floor: proportion alone would put it
 *                      under two device pixels tall on a phone.
 *
 * WHAT THE BEADS ARE, AND WHY
 * ---------------------------
 * The wires ship as two masked spans — `.bt2__fan` (four straight paths in the
 * landscape frame, the faint inner circle in the portrait one) and
 * `.bt2__main` (BTC's link, the large ring in portrait) — so nothing inside
 * them is addressable and
 * `stroke-dashoffset` is off the table: there is no way to put light *on* the
 * stroke the way the fan section does. Rather than fake it with something that
 * moves no pixels (a clip-path window, a mask-position or a background-position
 * all animate a zero-travel bounding box and read as static on this project's
 * own check), this module creates five beads and flies them along the real
 * lines. Each is positioned as a percentage of the card and travels in
 * `xPercent`/`yPercent` of its own box, which is sized in `var(--c)`; both are
 * pure ratios, so the whole beat survives a resize without being rebuilt.
 *
 * They are inserted *behind* the nodes, so a bead leaves from under its market's
 * disc and is taken under the padlock's — it rides the full wire, occluded at
 * both ends, instead of docking at a rim.
 *
 * THE ORBIT HEAD IS THE SAME OBJECT ON A ROTATOR. In the portrait frame the
 * path is a circle, and a capsule tweened along one in x/y would have to be
 * resolved every frame in pixels and rebuilt on every resize. Instead a zero-
 * sized span is parked at the RING's centre and the head hangs off it at the
 * ring's radius, both in `var(--c)`; GSAP turns the parent. One `rotation`
 * tween then carries the head round at a constant rate AND keeps it tangent to
 * the arc, because the head turns with its parent. Nothing about it is in
 * pixels, so it survives a resize like the beads do.
 *
 * THE NODES MOVE IN PIXELS, AND THE BEADS IN PERCENT
 * --------------------------------------------------
 * Not an oversight. `.bt2__node` is centred on its mark by a stylesheet
 * `transform: translate(-50%, -50%)`, and a tween that writes `xPercent` to
 * move it REPLACES that centring rather than adding to it: measured, a 12px
 * lean asked for in percent moved BTC 41.7px across and 32px down, which is
 * the 32px half-width of a 64px disc plus the lean. So the nodes lean in
 * `x`/`y`, scaled by the measured design unit, ON TOP of a centring this file
 * states for itself -- see CENTRED, and the width-dependent GSAP bug it exists
 * to close. The beads carry no stylesheet transform of their own and so keep
 * the resize-proof percentages.
 *
 * WHAT THIS MUST NOT DO
 * ---------------------
 * 1. No glow, bloom, halo or drop-shadow — standing rule for this site. A bead
 *    is a flat warm capsule; the answer at the lock is scale, position and
 *    colour and nothing else. `filter` is never written here.
 * 2. No `clearProps: 'all'`. Every `.bt2__node` carries BOTH of its positions in
 *    inline custom properties (`--x`/`--y`/`--s` landscape, `--mx`/`--my`/`--ms`
 *    portrait, plus the two mark sizes); emptying the style attribute drops all
 *    of them and collapses the constellation onto the card's centre. Only
 *    `transform` and `color` are ever cleared, by name.
 * 3. No pointer response of any kind, nothing that floats or breathes between
 *    beats, and no motion at all under `prefers-reduced-motion`.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { tok } from '../../../lib/theme';

/** The card's design frame, as a FALLBACK. Its `aspect-ratio` locks both axes
 *  to one scale, and below 700px that frame is 320 x 356 rather than 640 x 254
 *  -- so these two numbers are read from `--fw` / `--fh` on the card itself
 *  (Built.css) and these constants are only what a missing property yields.
 *  They are integers in both frames, so the division back into design units
 *  stays exact. */
const DW_FALLBACK = 640;
const DH_FALLBACK = 254;

/** One cycle, in GSAP time. Wall-clock is longer whenever lag smoothing bites. */
const PERIOD = 8.5;
/** Stillness at the top of a cycle, before the farthest market moves. */
const LEAD = 0.82;
/** How long the longest wire takes; every other journey is that speed. */
const RUN = 1.75;

/** The send: design px a node leans along its own wire, and the pulse's halves.
 *  A lean is a proportion of the card, not an absolute distance, so it is
 *  scaled by the frame below: 12 units of 640 and 6 units of 320 are the same
 *  1.9% of the card either way. */
const LUNGE = 12;
const UP = 0.18;
const BACK = 0.62;
/** Design px the padlock leans into the delivery as the beads reach it. Scaled
 *  the same way, and aimed by the wires rather than assumed to point left. */
const LEAN_IN = 6;

/** The bead, in design px of the 640-wide frame, and the smallest it is allowed
 *  to become in design px of whatever frame it lands in.
 *
 *  Scaling it with the frame like the leans above would give a 7 x 1.3 capsule
 *  on the phone -- proportionally identical and, at roughly one and a half
 *  device pixels tall, not a thing anyone would see travelling. A lean that
 *  small is still a lean; a mark that small is gone. So the bead scales and
 *  then stops: 14 x 2.6 at 640, 9 x 1.9 at 320. */
const BEAD_W = 14;
const BEAD_H = 2.6;
const BEAD_W_MIN = 9;
const BEAD_H_MIN = 1.9;

/* ---- the portrait circuit, and nothing here is used by the landscape one ---
   ORBIT is one lap of the ring. It sets every touch time on the card, because
   a station's cue is the fraction of the lap that reaches it -- so this is the
   only pace in the beat and the five gaps are the drawing's own.

   HEAD_W is stated as ARC, not as a bead length. The closest two stations on
   the ring are 40.2 degrees apart, which at r=89 is 62 design units of arc; a
   16-unit head is a quarter of that, so it is clear of one market before it
   reaches the next and never reads as touching two at once. Over 16 units the
   straight capsule departs from the arc by 16^2 / (8 * 89) = 0.36 units, which
   is a third of the ring's own stroke -- there is nothing to gain from bending
   it. HEAD_H matches the bead's floor so the two are one object seen twice.

   DROP is the fall from a market to the padlock. Every radius on this card is
   the same length, so one duration covers all five and the arrivals keep the
   order of the touches. */
const ORBIT = 2.6;
const HEAD_W = 16;
const HEAD_H = 1.9;
const DROP = 0.5;

/* THE THREE COLOURS THIS FILE WRITES, as dark fallbacks. Each is read from its
   role token inside the build below, where `tok()` can see the theme that is
   actually on the document; each constant here is the exact hex the token
   resolves to in dark, so a missing property yields today's value.

   Only one of the three is a direction flip, and it is worth saying which,
   because "lit" does not mean the same thing twice on this card:

   BEAD_BG is --accent-lift, the same warm the gradient's light stop uses. It
   is a chromatic object on a neutral wire, not a brightness -- 4.57:1 on the
   dark card, 4.78:1 on the light one. It needs no flip, only the token.

   SEALED is --bt-seal, and it is the one value here that a role token could
   not carry. SELF-CUSTODY rests at --ink and goes brand red for the length of
   the settlement. In dark that is #fffbf8 -> #e5331e, a step of 4.23:1. Read
   as --accent in light it would be #1a1512 -> #a21605, a step of 2.29:1 --
   both ends are dark on paper, so 46% of the beat goes missing while the loop
   still runs and every check still passes. --bt-seal is #e5331e in dark, the
   same hex --accent resolves to, and --accent-lift's #c4361c in light, which
   puts the step back at 3.36:1. Built.css carries the reasoning.

   LIT is the flip. A market's label goes from --ink-2 to --ink while its value
   is in flight, and --ink is "as far from the page as ink goes" -- #fffbf8 on
   the dark card and #1a1512 on the light one. Taking the literal #fffbf8 into
   light would have moved the label from 6.4:1 to 1.02:1: the loop would still
   run, the gate would still pass, and the label would simply vanish at the
   moment it was meant to answer. */
/* THE CENTRING, WRITTEN OUT, and it is a bug fix rather than a flourish.
   -------------------------------------------------------------------------
   `.bt2__node` is centred on its mark by a stylesheet `transform:
   translate(-50%, -50%)`, and GSAP has to recover that -50% from a COMPUTED
   matrix, which is in pixels. Its test for "this is a half-width translate"
   rounds against `offsetWidth`, which is an integer, so it only holds when the
   node's real width rounds the same way its half does. At 1600 a market node
   is exactly 50px and it holds: GSAP stores xPercent/yPercent -50 and the lean
   below is added on top of it, which is what this file has always assumed.

   At 390 the same node is 44.84px. `offsetWidth` is 45, half of that is 22.5,
   and the matrix says 22.42 -- the two round to 23 and 22, the test fails,
   GSAP takes -22.42 as a plain `x`, and the first `to({x})` tweens the node
   OFF ITS OWN CENTRE by half its width. Measured on the shipped build: the
   TSLA node travelled 18.3px across and 18.3 down on a lean asked for as 0.2
   across and 6.6 down. It is not visible as a jump because it happens on the
   same tween as the lean, so it reads as a market sliding a long way sideways
   for no reason -- which is exactly what a phone shows today.

   Stating xPercent/yPercent on every tween takes the recovery away from GSAP:
   the centring becomes a value this file owns and `x`/`y` are unambiguously on
   top of it at every width. At 1600 it writes the matrix GSAP already inferred,
   so the landscape beat is byte-identical; below that it is the difference
   between a lean and a lurch. `clearProps: 'transform'` still hands the
   element back to the stylesheet at the end of each beat, so nothing here
   outlives it. */
const CENTRED = { xPercent: -50, yPercent: -50 } as const;

const BEAD_BG = '#e9513f';
const LIT = '#fffbf8';
const SEALED = '#e5331e';

/** The moment every bead is at the padlock's centre. */
const ARRIVE = LEAD + UP + RUN;
/** The lock answers as the beads reach its rim, a frame or two earlier. */
const SEAL = ARRIVE - 0.12;
/** The cooling wave, and the end of the beat. */
const COOL = SEAL + 0.82;
const STORY = COOL + 0.85;

/** The same three, for the circuit. The last market is touched at
 *  LEAD + (297.5 / 360) * ORBIT and its bead lands DROP + UP after that, which
 *  is when the padlock answers -- so the portrait beat closes at 5.2s against
 *  the landscape one's 4.3s and both sit inside the same 8.5s period. */
const ORBIT_END = LEAD + ORBIT;

export function bt2Loop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const card = root.querySelector<HTMLElement>('.bt-card--two');
  if (!card) return () => {};

  const stage = card.querySelector<HTMLElement>('.bt2');
  const lock = card.querySelector<HTMLElement>('.bt2__node--lock');
  const lockLabel = lock?.querySelector<HTMLElement>('.bt2__label');
  const nodes = Array.from(card.querySelectorAll<HTMLElement>('.bt2__node:not(.bt2__node--lock)'));
  /* The faint circle the padlock sits inside. It is `.bt2__fan` in both frames
     -- four converging wires in the landscape one, this circle in the portrait
     one -- and only the circle has anything to answer with, so the tween that
     uses it is portrait-gated rather than this query. */
  const inner = card.querySelector<HTMLElement>('.bt2__fan');
  if (!stage || !lock || !lockLabel || nodes.length === 0) return () => {};

  /* ------------------------------------------------------------- geometry
     Measured, never assumed: the illustration is laid out in the card's own
     container unit, so live rects are the only honest source at any width.
     Everything is divided back into the 640 x 254 design frame, where the
     numbers are the ones in Figma and are the same at every breakpoint. */
  const cb = card.getBoundingClientRect();
  const cs = getComputedStyle(card);
  const DW = Number(cs.getPropertyValue('--fw')) || DW_FALLBACK;
  const DH = Number(cs.getPropertyValue('--fh')) || DH_FALLBACK;
  const u = cb.width / DW;
  if (!(u > 0)) return () => {};

  /* WHICH BEAT, asked of the frame rather than of a media query. The landscape
     card is wider than it is tall and its markets are wired to a padlock off to
     one side; the portrait card is taller than it is wide and its markets are
     spaced round a ring. `matchMedia` would be a second copy of Built.css's
     breakpoint, free to drift from it; the shape of the frame cannot drift from
     the layout it IS. */
  const portrait = DH > DW;

  /* Every distance this file states in design px is stated for the 640-wide
     frame, so anything that is a PROPORTION of the card is scaled here. The
     distances it MEASURES -- the five wire lengths, the directions they run --
     are already in the frame's own units and need nothing. */
  const S = DW / 640;
  const lunge = LUNGE * S;
  const leanIn = LEAN_IN * S;
  const beadW = Math.max(BEAD_W * S, BEAD_W_MIN);
  const beadH = Math.max(BEAD_H * S, BEAD_H_MIN);

  const centre = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - cb.left + r.width / 2) / u,
      y: (r.top - cb.top + r.height / 2) / u,
    };
  };

  const hub = centre(lock);
  const markets = nodes.map((el) => {
    const c = centre(el);
    const dx = hub.x - c.x;
    const dy = hub.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    /* The portrait card carries no market names -- the design has none, and
       Built.css takes them off. Asked of the stylesheet rather than of the
       frame, so a label that is not drawn is not lit either and this file
       never schedules a colour on something nobody can see. */
    const named = el.querySelector<HTMLElement>('.bt2__label');
    const label = named && getComputedStyle(named).display !== 'none' ? named : null;
    return {
      el,
      label,
      // Read, not assumed: a label cools back to the colour the stylesheet gives
      // it, so a token change carries through without this file being touched.
      cool: label ? getComputedStyle(label).color : '',
      c,
      dx,
      dy,
      d,
      ux: dx / d,
      uy: dy / d,
    };
  });
  const lockCool = getComputedStyle(lockLabel).color;

  /* The mean direction the delivery arrives from, as a unit vector. See the
     lock's lean below. Normalised after averaging, so a market that is nearly
     opposite another cancels rather than dominating. */
  const aim = (() => {
    const sx = markets.reduce((a, m) => a + m.ux, 0) / markets.length;
    const sy = markets.reduce((a, m) => a + m.uy, 0) / markets.length;
    const len = Math.hypot(sx, sy) || 1;
    return { x: sx / len, y: sy / len };
  })();

  /* Read beside the rest colours above, for the same reason they are read
     here: this function is the build, so it runs after the theme is on the
     document and runs again when useSectionMotion rebuilds on a theme flip. */
  const beadBg = tok('--accent-lift', BEAD_BG);
  const litInk = tok('--ink', LIT);
  const sealed = tok('--bt-seal', SEALED);

  /* One speed for every wire, set by the longest of them. The departures fall
     out of it: a market leaves early exactly in proportion to how far it is. */
  const longest = markets.reduce((m, n) => Math.max(m, n.d), 0);
  const speed = longest / RUN;

  /* ------------------------------------------------------------ the circuit
     The ring is a mask in Built.css, so there is nothing in the document to
     measure it off. It is READ instead, from three custom properties declared
     beside that mask -- centre as an offset from the card's own centre, radius
     in design units -- which is the one place both can be kept in step. The
     fallbacks are the frame's values and are what a missing property yields.

     Every ANGLE below is measured, including SELF-CUSTODY's: this file does
     not know which market is at the top of the ring or that the pill is at the
     bottom, and it must not, or the beat goes back to being a schedule that
     happens to agree with a drawing. */
  const ringX = DW / 2 + (Number(cs.getPropertyValue('--bt2-ring-x')) || 0);
  const ringY = DH / 2 + (Number(cs.getPropertyValue('--bt2-ring-y')) || 0);
  const ringR = Number(cs.getPropertyValue('--bt2-ring-r')) || Math.min(DW, DH) / 2;
  /* Degrees clockwise from twelve, which is where the head sits at rotation 0. */
  const bearing = (x: number, y: number) => ((Math.atan2(x - ringX, ringY - y) * 180) / Math.PI + 360) % 360;
  const startA = bearing(
    (lockLabel.getBoundingClientRect().left - cb.left + lockLabel.getBoundingClientRect().width / 2) / u,
    (lockLabel.getBoundingClientRect().top - cb.top + lockLabel.getBoundingClientRect().height / 2) / u,
  );
  /* The lap fraction at which the head reaches each market. */
  const turns = markets.map((m) => ((bearing(m.c.x, m.c.y) - startA + 360) % 360) / 360);
  const lastTurn = turns.reduce((a, b) => Math.max(a, b), 0);

  /* ---------------------------------------------------------------- beads
     Created here, removed in the teardown. Sized in `var(--c)` so the box
     scales with the card, and centred by negative margins rather than a
     translate, which keeps the transform GSAP writes purely the animation. */
  const beads: HTMLElement[] = [];
  const firstNode = nodes[0];
  for (const m of markets) {
    const bead = document.createElement('span');
    bead.className = 'bt2__bead';
    bead.setAttribute('aria-hidden', 'true');
    bead.style.cssText = [
      'position:absolute',
      `left:${(m.c.x / DW) * 100}%`,
      `top:${(m.c.y / DH) * 100}%`,
      `width:calc(${beadW} * var(--c))`,
      `height:calc(${beadH} * var(--c))`,
      `margin:calc(${-beadH / 2} * var(--c)) 0 0 calc(${-beadW / 2} * var(--c))`,
      `border-radius:calc(${beadH / 2} * var(--c))`,
      `background:${beadBg}`,
      'opacity:0',
      'pointer-events:none',
    ].join(';');
    stage.insertBefore(bead, firstNode);
    beads.push(bead);
  }

  /* ------------------------------------------------------------- the head
     A zero-sized rotator parked at the RING's centre -- not the card's, and
     not the padlock's; the design offsets the ring by a unit from both -- with
     the head hanging off it at the ring's radius, at twelve o'clock. GSAP
     turns the rotator and the head goes round with it, staying tangent for
     free. Both boxes are in `var(--c)`, so a resize moves the whole orbit
     without this module being rebuilt. Behind the marks, like the beads: the
     head passes UNDER each market rather than over it. */
  let orbit: HTMLElement | undefined;
  let head: HTMLElement | undefined;
  if (portrait) {
    orbit = document.createElement('span');
    orbit.className = 'bt2__orbit';
    orbit.setAttribute('aria-hidden', 'true');
    orbit.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'width:0',
      'height:0',
      `margin:calc(${ringY - DH / 2} * var(--c)) 0 0 calc(${ringX - DW / 2} * var(--c))`,
      'pointer-events:none',
    ].join(';');
    head = document.createElement('span');
    head.className = 'bt2__head';
    head.style.cssText = [
      'position:absolute',
      `left:calc(${-HEAD_W / 2} * var(--c))`,
      `top:calc(${-ringR - HEAD_H / 2} * var(--c))`,
      `width:calc(${HEAD_W} * var(--c))`,
      `height:calc(${HEAD_H} * var(--c))`,
      `border-radius:calc(${HEAD_H / 2} * var(--c))`,
      `background:${beadBg}`,
      'opacity:0',
      'pointer-events:none',
    ].join(';');
    orbit.appendChild(head);
    stage.insertBefore(orbit, firstNode);
  }

  /* The beat's own clock, which is not the same length in the two frames: the
     landscape wave is solved from wire lengths, the circuit from one lap and
     the fall that follows the last touch. Both fit inside PERIOD. */
  const lastLand = LEAD + lastTurn * ORBIT + UP + DROP;
  const sealAt = portrait ? lastLand - 0.12 : SEAL;
  const coolAt = sealAt + 0.82;
  const storyEnd = portrait ? coolAt + 0.85 : STORY;

  let offscreen = false;
  let loop: gsap.core.Timeline | undefined;
  const inBeat = (t: number) => t > LEAD - 0.1 && t < storyEnd + 0.1;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ paused: true, repeat: -1 });
    loop = tl;

    /* The resting frame, restated rather than trusted. */
    beads.forEach((b, i) => {
      gsap.set(b, {
        xPercent: 0,
        yPercent: 0,
        scaleX: 1,
        opacity: 0,
        rotation: (Math.atan2(markets[i].dy, markets[i].dx) * 180) / Math.PI,
        transformOrigin: '50% 50%',
      });
    });

    /* 0 — the head goes round, and there is only one of it. Constant rate, so
       every station's cue below is simply where that station is: a lap is
       ORBIT seconds and a market at a third of the way round is touched a
       third of the way through. Portrait only; the landscape card has a fan of
       wires and no ring to run. */
    if (portrait && orbit && head) {
      tl.set(orbit, { rotation: startA, transformOrigin: '0 0' }, 0)
        .to(orbit, { rotation: startA + 360, duration: ORBIT, ease: 'none' }, LEAD)
        .to(head, { opacity: 1, duration: 0.22, ease: 'power1.out' }, LEAD)
        .to(head, { opacity: 0, duration: 0.24, ease: 'power2.in' }, ORBIT_END - 0.24)
        .set(head, { opacity: 0 }, ORBIT_END + 0.02)
        .set(orbit, { clearProps: 'transform' }, ORBIT_END + 0.02);
    }

    markets.forEach((m, i) => {
      const bead = beads[i];
      /* WHEN a market moves, and how long its value is in flight. Landscape:
         every bead travels at one speed and they are timed BACKWARD from a
         single arrival, so five different wire lengths become five departures
         and one convergence. Portrait: every radius is the same length, so
         there is nothing to solve backward from -- the head's passage is the
         cue and the fall is one duration for all five. */
      const travel = portrait ? DROP : m.d / speed;
      const lean = portrait ? LEAD + turns[i] * ORBIT : ARRIVE - travel - UP;
      const depart = lean + UP;

      /* 1 — the market leans along its own wire and lets the value go. Both
         ends of the lean are stated, and the transform goes back to the
         stylesheet afterwards: an inline identity transform still promotes the
         node to its own layer, and these discs carry a backdrop filter. */
      tl.to(m.el, {
        ...CENTRED,
        x: lunge * m.ux * u,
        y: lunge * m.uy * u,
        scale: 1.07,
        duration: UP,
        ease: 'sine.out',
      }, lean)
        .to(m.el, {
          ...CENTRED, x: 0, y: 0, scale: 1, duration: BACK, ease: 'sine.inOut',
        }, lean + UP)
        .set(m.el, { clearProps: 'transform' }, lean + UP + BACK + 0.02);

      if (m.label) {
        tl.to(m.label, { color: litInk, duration: 0.26, ease: 'sine.out' }, lean);
      }

      /* 2 — the bead rides the wire. `fromTo` states both ends so a stranded
         value from an earlier cycle cannot poison it, and `immediateRender` is
         off because GSAP writes a fromTo's start the moment it is BUILT, not
         when the playhead arrives — without it every bead would sit parked at
         the padlock from the first frame. */
      tl.set(bead, { xPercent: 0, yPercent: 0, scaleX: 0.55, opacity: 0 }, depart)
        .fromTo(bead,
          { xPercent: 0, yPercent: 0 },
          {
            xPercent: (m.dx / beadW) * 100,
            yPercent: (m.dy / beadH) * 100,
            duration: travel,
            ease: 'none',
            immediateRender: false,
          }, depart)
        .to(bead, { opacity: 1, scaleX: 1, duration: Math.min(0.22, travel * 0.4), ease: 'power1.out' }, depart)
        // Taken under the padlock's disc: it does not stop at the rim, it goes in.
        .to(bead, { opacity: 0, duration: 0.14, ease: 'power2.in' }, depart + travel - 0.14)
        .set(bead, { xPercent: 0, yPercent: 0, scaleX: 1, opacity: 0 }, depart + travel + 0.02);
    });

    /* 3 — the lock takes the delivery: it seats, and its label goes brand red
       for the length of the settlement.

       IT LEANS ALONG THE WIRES, AND ONLY WHERE THERE ARE WIRES. `x: -LEAN_IN`
       was true of exactly one layout -- the landscape frame, where all five
       markets are away to the left and the mean of their directions is
       (0.996, 0.087). `aim` replaced that with the mean of the wires that are
       actually on the card, which reproduces the old cue to within half a
       design pixel at 1600.

       On the ring there is no such direction, and averaging is not the way to
       find one: five unit vectors spread round a circle sum to (0.02, 0.26),
       a residue of where the markets happen to bunch rather than a heading the
       delivery arrives on. The padlock in that frame is arrived at from every
       side at once, so it answers with scale alone -- and the faint circle it
       sits inside seats with it, at a third of the step, so the centre of the
       card answers as one object rather than as a disc twitching inside a
       static ring.

       IT SEATS THE MARK, NOT THE NODE, in the portrait frame. SELF-CUSTODY is
       a CHILD of `.bt2__node--lock` in the markup -- it is the padlock's own
       label -- and in the landscape frame it sits directly under the disc, so
       scaling the node carries the two together and that is right. On the ring
       the same element is a pill 90 design units away on the lower arc, a
       separate object in the drawing; scaling the node about its centre swung
       the pill 11.7 units down the card and grew it 13% every beat. So the
       portrait seat is applied to `.bt2__whole` -- the padlock image itself,
       centred on the same point -- and the pill, its sibling, does not move.
       It has no stylesheet transform of its own, so CENTRED is not its
       business either. */
    const mark = portrait ? lock.querySelector<HTMLElement>('.bt2__whole') : null;
    const seat: HTMLElement = mark ?? lock;
    const seats: gsap.TweenVars = mark
      ? { scale: 1.13 }
      : { ...CENTRED, x: -leanIn * aim.x * u, y: -leanIn * aim.y * u, scale: 1.13 };
    const rests: gsap.TweenVars = mark ? { scale: 1 } : { ...CENTRED, x: 0, y: 0, scale: 1 };
    tl.to(seat, { ...seats, duration: 0.2, ease: 'sine.out' }, sealAt)
      .to(seat, { ...rests, duration: BACK, ease: 'sine.inOut' }, sealAt + 0.2)
      .set(seat, { clearProps: 'transform' }, sealAt + 0.2 + BACK + 0.02)
      .to(lockLabel, { color: sealed, duration: 0.2, ease: 'sine.out' }, sealAt)
      .to(lockLabel, {
        color: lockCool, duration: 0.5, ease: 'sine.inOut',
        onComplete: () => gsap.set(lockLabel, { clearProps: 'color' }),
      }, coolAt + 0.2);

    if (portrait && inner) {
      tl.to(inner, { scale: 1.05, duration: 0.2, ease: 'sine.out' }, sealAt)
        .to(inner, { scale: 1, duration: BACK, ease: 'sine.inOut' }, sealAt + 0.2)
        .set(inner, { clearProps: 'transform' }, sealAt + 0.2 + BACK + 0.02);
    }

    /* 4 — the circuit cools outward from the lock, nearest market first, so the
       beat closes in the same measured order it opened in, reversed. The
       portrait card has no market names to cool: its markets have already
       returned on their own `BACK` tweens and SELF-CUSTODY is the last thing
       still lit, so the loop above is simply empty there rather than gated. */
    [...markets]
      .sort((a, b) => a.d - b.d)
      .forEach((m, i) => {
        if (!m.label) return;
        const label = m.label;
        tl.to(label, {
          color: m.cool, duration: 0.4, ease: 'sine.inOut',
          onComplete: () => gsap.set(label, { clearProps: 'color' }),
        }, coolAt + i * 0.09);
      });

    /* Off screen the loop stops here rather than wherever the scroll left it,
       so the card is never parked mid-delivery. A beat is under four seconds;
       it is allowed to finish. */
    tl.call(() => { if (offscreen) tl.pause(); }, undefined, storyEnd + 0.1);
    tl.to({}, { duration: 0.01 }, PERIOD - 0.01);
  }, card);

  /* Pause the moment the card leaves the screen, wake when it comes back. The
     margin is generous so the beat is not caught half-open on the way in. */
  const io = new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    if (!offscreen) loop?.play();
    else if (loop && !inBeat(loop.time())) loop.pause();
  }, { rootMargin: '120px' });
  io.observe(card);

  return () => {
    io.disconnect();
    // Reverts every tween this module built, which hands each element's style
    // attribute back exactly as it was found — mid-beat included.
    ctx.revert();
    for (const bead of beads) bead.remove();
    beads.length = 0;
    orbit?.remove();
  };
}
