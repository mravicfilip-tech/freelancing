# Motion direction

The first pass was rejected as "too fast, too jumpy, not smooth and not premium".
This is the standard every section is built to. Where a section brief and this
document disagree, this document wins.

## The one law

**One object arrives. It is allowed to land. Then the rest follow.**

Not "everything moves at once with a 0.06s stagger" — that reads as a spreadsheet
and is what made the first pass feel cheap. Pick the single element the copy is
actually about, give it the stage alone for a beat, and let everything else
arrive in its wake, quieter and smaller.

A section's entrance should take **2.5–4 seconds end to end** and never feel
rushed at any point in it.

## Pacing

| | Duration | Notes |
|---|---|---|
| Lead element | 1.1–1.6s | The one thing the section is about |
| Followers | 0.9–1.3s | Always shorter than the lead, never snappier |
| Stagger between siblings | 0.14–0.24s | Not 0.06. You should be able to count them |
| Pause after the lead | 0.25–0.4s | The beat that makes it feel directed |
| Hover response | 0.4–0.7s | Slower than instinct says |
| Ambient loop cycle | 6–14s | One full cycle. Long and lazy |

Durations under 0.5s are for accents only — a dot lighting, a caret blinking.
Nothing structural moves that fast.

## Easing

- **`power2.out` / `power3.out`** for almost everything arriving. Long
  deceleration is what reads as expensive.
- **`expo.out`** when something travels a long distance.
- **`sine.inOut`** for every ambient loop, always. Nothing else loops smoothly.
- **`back.out` / `elastic.out`** only on accents under 12px of travel. On a card,
  a heading or a panel they read as cheap. The first pass used them structurally;
  do not.
- Never `none`/linear except for a constant rotation or a travelling dash offset.

## Distance

Small. `y: 16–28px`, `scale: 0.96–1`, never `y: 80` or `scale: 0.8`. Premium
motion is short travel over a long duration, not long travel over a short one.
Opacity should finish earlier than position so nothing is still fading while it
is still moving.

## Ambient loops

Every illustration keeps moving after its load-in, forever, with no interaction.

- One cycle is 6–14s, `sine.inOut`, seamless — no visible restart or pop.
- Amplitude low enough that **any single frame still reads as the approved
  static design**. If a still looks wrong, the amplitude is too high.
- Give each element in a group its own phase offset and its own period, or the
  group pulses in lockstep and looks mechanical.
- Pause with IntersectionObserver when off-screen. Kill on unmount.
- `prefers-reduced-motion: reduce` — every loop off, settled on the static state.

## Hierarchy

In any group, decide what is **accent**, **support** and **context**, and move
them by different amounts:

- **Accent** (one per section): the full treatment. This is what a person
  screenshots.
- **Support**: arrives, then holds. Minimal ambient motion.
- **Context** (grids, background rules, glows): barely moves. A slow drift or a
  breath, nothing more.

If everything in your section is animated equally, nothing is accented and the
result reads as noise.

## What made the first pass fail — do not repeat

- A uniform fade-up applied to every element in every section.
- Everything starting within 200ms of everything else.
- Overshoot easing on structural elements.
- Entrances that finish in under a second.
- Motion that stops entirely once the entrance is done.
- Hover states that scale the whole container as one block.

## Still binding

- The settled design is sacred: position, size, colour, type unchanged. Prove it
  pixel-identical against a pre-animation capture. Ambient motion is exempt from
  that diff but must satisfy the single-frame rule above.
- Animate *from* a visible baseline with `gsap.from`. Never a CSS `opacity: 0`
  starting state — if the script fails the page must still read correctly.
- 60fps: transform and opacity only, rAF-throttled scroll handlers, loops killed
  off-screen, WebGL DPR capped at 2.
- Scroll progress is computed by hand from `getBoundingClientRect()`; there is no
  ScrollTrigger. GSAP core only, no plugins.
- `three` 0.185 and `gsap` 3.15 are dependencies. Lazy-import `three`, probe for
  a context, fall back to the CSS treatment when it is unavailable.

## Verifying

- `node scripts/drive-entrance.mjs <selector> <tag>` — shoots the entrance and
  diffs the settled state against a baseline.
- `node scripts/ambient.mjs <selector> <tag> [gapSeconds]` — proves the loop by
  comparing two untouched captures seconds apart. "DEAD" means no loop.

Run both. Look at the images.
