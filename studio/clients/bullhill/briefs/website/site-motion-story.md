# Whole site motion, story

Filip, 14 October 2026, "continue with animating the whole website". The hero has its own story in
`hero6-story.md`, accepted, beat 4 in build. This file covers every section after the hero, in
page order, at `/?v=1`. The `/story` skill runs first. The decode and the beats go to Filip in one
message, since the Foundry decode of the hero was already confirmed and this extends it.

Captures from 14 October 2026 are in the scratchpad `secmo/`. Each reference was scrolled in 600px
steps at 1440 by 900 and shot 150, 500 and 1400ms after each step, so a timed reveal shows
half way and settled, and a scroll linked move shows the same in all three.

Status. Accepted, Filip said "go" at 16:13 on 14 October 2026. Process went into build first. At 16:5x
Filip asked "where my animations", so the rest started at once in two slices, without waiting on his
yes for Process. The timing lives in the `--m-*` tokens of `src/p1/motion/motion.css`, so a timing
correction after he sees Process is one edit there.

## Decode, worldquantfoundry.com below the hero

| Property | Ethos | Cards | Focus list | Portfolio | Team | Investors and founders |
|---|---|---|---|---|---|---|
| Camera | Fixed, the page scrolls | Same | Same | Same | Same | Same |
| Ground | A light grey panel with a rounded top rises over the black hero | Four solid cards, black, teal, orange, light | Light grey with a pale dot field | Light grey | Black | Black with a dot field |
| Type scale | 20px uppercase, mono 10px | Mono 10px, 16px card titles | 40px uppercase list | 18px uppercase, mono 10px | 24px uppercase | 24px uppercase, cards 14px |
| Chrome | Nav shrinks to a dark centred bar with the mark only | Same | Same | Same | Same | Same |
| Rendering | Live type | Cards with dot art | Live type over points | Logo cards | Type and portrait strips | Type and cards |
| Story device | The panel rides up over the hero | The four cards sit in an overlapping row | The line at mid screen goes dark, the lines above and below stay pale, so the list reads one line at a time | A carousel | A strip of portraits splits the headline in two | The headline pins on one side while the cards stack over each other on the other |

All three frames of each step match, so nothing on this page plays on a timer below the hero. It
all follows the scroll position.

The one property that makes it work, the page pins and stacks as you scroll, it never fades things
in on a timer.

## Decode, vaulk.com

| Property | Shelter | Material | Modules | Logistics | Matrix | Contact |
|---|---|---|---|---|---|---|
| Camera | Fixed | Fixed | Fixed | Fixed | Fixed | Fixed |
| Ground | Black with a rust glow | Same | Same | Light panel over black, notched frames | Mid grey | White |
| Rendering | Wireframe drawing | Type and a list | Wireframe | Photos in notched frames | Icons and type | Form |
| Story device | The wireframe traces itself in about half a second, one module lit in orange | Text arrives orange and settles to white | The modules move apart as you scroll | Text and frames fade in | Cells reveal one by one, titles orange first | The heading arrives as scattered letters and settles |

The one property that makes it work, technical drawings trace themselves, and text arrives in the
accent colour and settles to neutral.

## Decode, trymeridian.com

A logo marquee, a photo carousel, and a pile of photos that spreads into a scatter as you scroll.
Meridian fed Daylight, which is frozen, so nothing here is carried.

## Beats, draft

Foundry follows worldquantfoundry, motion tied to the scroll, pins and stacks. One device comes from
Vaulk because BullHill has the same kind of content, the trench drawing traces itself.

| Section | Move | What moves | Runs | The one thing a stranger understands |
|---|---|---|---|---|
| Every headline | Lines rise out of a mask one by one, 600ms, 80ms apart, the same move as hero beat 1 | Section headlines, h1 and h2, with `Rise` from `src/p1/motion/`. Card titles move with their card | Once, as it enters | One voice from top to bottom |
| Header | Still | Nothing | | The full logo stays, mark over wordmark |
| Hero 6 | Beats 1 to 4 of `hero6-story.md` | | Load, idle, scroll | Plan into ground |
| Work | The hairline and crosshairs of each notched frame draw, then the photo unmasks upward, 700ms, 80ms per card | Frames and photos | Once | Real trenches they dug |
| Services | The light panel rides up over the black work section, then the four cards start stacked on the first and slide out to the row as it scrolls up | Panel, cards | Scroll | Four things they do |
| Process | The trench drawing traces itself from the surface down, ducts last, then each label's leader line draws. The layer list then reads one row at a time, the row at mid screen in full ink, the rest pale | Drawing, labels, list | Once, then scroll | What sits under the street, in order |
| Steps | Each photo unmasks upward, number and title rise | Step rows | Once | Four steps from survey to handover |
| Projects | Cards slide in 48px from the right, 60ms apart, photos unmask | Card row | Once | Routes they built, with the numbers |
| Crew | The portrait strip between the two title lines drifts 48px sideways against the scroll. Matrix cells reveal one by one, 40ms apart | Strip, matrix | Scroll, then once | A real crew with their own machines |
| Audiences | The text pins while the cards stack, each card pins under the last and the next slides over it | Cards | Scroll | Who they work for |
| FAQ | The panel rises 48px into place | Panel | Scroll | |
| Contact | Field hairlines draw left to right, 60ms apart | Fields | Once | |
| Closing | Nav links rise out of masks, the photo unmasks | Links, photo | Once | It ends on finished work |

Refused, and why.
- Worldquantfoundry's nav that shrinks to the mark alone. The taste log rules the full logo always.
- Vaulk's letters that arrive orange and settle. A second type move, and it reads generated.
- Meridian's photo pile. Daylight's reference, frozen.
- Any dot field that moves or flies in. The closing dots were called AI slop, and the dot art in hero
  1, the process title and the audiences is still an open question.

Every case.
- Reduced motion, nothing moves and nothing pins that does not pin now.
- Phones at 390 get the same beats in CSS. The services cards start stacked and slide down into
  their column there.
- Transform, opacity and clip-path only. One IntersectionObserver for the once beats, one
  requestAnimationFrame loop writing CSS variables for the scroll beats, no new library. Both live in
  `src/p1/motion/motion.ts`.
- Motion is off for reduced motion, `?motion=off` and automated shots (navigator.webdriver), so
  regression shots and `/uireview` see the settled page. `?motion=on` forces it for motion shots.
  Hidden starting states sit under `.p1[data-motion='on']` only.
- The type moves share one timing, 600ms on `cubic-bezier(0.2, 0.7, 0.1, 1)`, 80ms between lines.

Hardest beat, Process, because the drawing, its HTML labels and leader lines and the scrolling list
have to stay in step on two panels, and it is the longest section on the page. It is built first.

## Build order after the yes

1. The headline rise and the Process beat, in one version, shot at 390 and 1440 on one sheet.
   Filip accepts it before the rest.
2. The rest in three slices that touch no shared file, sections above Process, sections below it,
   and hero beats 1 to 3.
