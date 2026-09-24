# Motion direction

The standard every entrance and loop on the site is built to. It was written
after a first pass was rejected as "too fast, too jumpy, not smooth and not
premium", and later tightened so that motion never holds content back. The
implementation lives in `src/lib/motion.ts` and each band's `.motion.ts` and
`.loop.ts`; how they are wired is in `docs/ARCHITECTURE.md`.

## The one law

**One object arrives. It is allowed to land. Then the rest follow.**

Pick the single element the section is about, give it the stage alone for a
beat, and let everything else arrive in its wake, quieter and smaller. A
uniform fade-up on every element with a tiny stagger reads as a spreadsheet.

## Pacing

Entrances start as a section enters the viewport (the gate is a -5% bottom
margin, `GATE` in `src/lib/motion.ts`) and are short enough that the first
beat has landed by the time the reader looks at it.

| | Guide | Notes |
|---|---|---|
| Lead element | 0.8 to 1.2s | The one thing the section is about |
| Followers | 0.5 to 0.9s | Shorter than the lead, never snappier |
| Stagger between siblings | mostly 0.12 to 0.16s | Countable, not a blur of starts |
| Latest cue in a band | about 1.2s | The bento band ends at about 1.24s; the About page's longest cue is 1.15s |
| Phones | same sequence, tighter | About scales cue starts by 0.42 and staggers by 0.7 (`About.motion.ts`) |
| Hover response | 0.4 to 0.5s | Interface controls only (the label roll is 460ms) |
| Ambient loop cycle | 6 to 14s | One full story beat, then rest |

Durations under 0.5s are for accents only: a dot lighting, a digit rolling.

## Easing

- **`expo.out`** is the house entrance ease (`EASE`); **`power2.out` /
  `power3.out`** for most other arrivals.
- **`sine.inOut`** for ambient loops.
- **`back.out`** only on small accents (`pop()` in `lib/motion.ts`), never on a
  card, heading or panel.
- Linear only for constant rotation or a travelling dash offset.

## Distance

Small travel over a comfortable duration: `rise()` moves 10px and entrances
stay between 8 and 30px, with scales near 1. Opacity finishes before position so
nothing is still fading while it moves. Type often resolves out of a light blur
(hero, About), which reads the same on either theme.

## Ambient loops

Illustrations on the landing page (hero slides, bento cards, Familiar, Fan,
Steps panels, Built cards) keep telling their one story after the entrance.
The About page, Pillars, FAQ and footer have no loops.

- Seamless, with no visible restart or pop.
- Low amplitude: **any single frame should still read as the approved static
  design.**
- Each element in a group has its own phase and period.
- Paused off screen (IntersectionObserver) and killed on unmount.
- Colours a loop reads from CSS are read when it is built, and every section
  rebuilds on a theme change (`useThemeEpoch`), so loops never keep the old
  theme's colours.

## Pointer and hover

Illustrations, glows and decorative artwork animate on two triggers only:
**entrance and loop.** No hover states, cursor-following light, magnetic pull
or parallax on artwork.

Exceptions:
- **Interface controls** keep hover and focus feedback: buttons, links, nav,
  social icons, FAQ rows, the Steps tabs, the carousel controls. The treatment
  is a rolling label (`<Roll>` and `.roll` in `src/styles/global.css`) plus a
  colour change, so a control still reads as hovered with motion off.
- **The 3D logo tilts toward the pointer** (`src/components/HeroLogo/`). This
  was kept at the client's request. It is off on touch devices.

## Scroll

Scroll starts entrances; it does not scrub artwork. ScrollTrigger is used in
exactly two places:
- The 3D logo in the hero turns, rises and fades as the hero scrolls away.
- The About "Cast your conviction" statement pins and fills word by word as
  the reader scrolls (`src/components/about/About.conv.motion.ts`).

## Hierarchy

In any group decide what is **accent** (one per section, the full treatment),
**support** (arrives, then holds) and **context** (grids, rules, glows: barely
moves). If everything moves equally, nothing is accented.

## Still binding

- **The settled design is sacred.** Position, size, colour and type at rest are
  the approved design. Prove a change is invisible at rest with
  `scripts/pixel-diff.mjs` (it captures with reduced motion).
- **Hidden until released, never stranded.** Animated parts start hidden by
  CSS (`[data-js] .band[data-motion='pending'] ...`, `visibility: hidden`),
  which applies only when the app's script is running. `useSectionMotion`
  removes the attribute in the same frame the timeline starts, and at once
  under reduced motion or if a build throws. Tweens that need a start state use
  `from` or an explicit `fromTo`, and clear only the properties they set, by
  name (never `clearProps: 'all'`).
- **Reduced motion** reveals everything settled and starts no loops.
- **Performance**: animate transform and opacity (plus filter blur and
  clip-path where a module says why); loops stop off screen; the WebGL mark
  caps device pixel ratio at 2 and falls back to a static image when frames run
  over budget; three.js is lazy-loaded behind a WebGL probe.
- **Dependencies**: GSAP 3.15 with the ScrollTrigger plugin, and three.js
  0.185. No other animation library.

## Verifying

- `node scripts/screenshot.mjs <url> out.png --el=<selector>` for a still;
  omit `--still` and time the capture to see a frame mid-entrance.
- `node scripts/pixel-diff.mjs` to prove the settled state did not change.
- Look at the motion in a browser at 1440 and 390, in both themes, and with
  reduced motion on.
