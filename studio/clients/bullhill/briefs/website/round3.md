# BullHill website, round 3 plan, Foundry

Filip, 14 October 2026, "Execute full plan after you're done mapping things." That approves the six
notes in `round3-notes.md` with every proposed default, and the button and hero variants he asked
for the same hour. Foundry only, `bullhill-site/src/p1/`. Daylight and Underground stay frozen at
b0bf997. Baseline commit for the regression shots is bb8c0fe.

Read first, every builder. `build-rules.md`, `pathway-1-foundry.md`, `round3-notes.md`,
`studio/clients/bullhill/taste.md` (every entry not marked SUPERSEDED is a rule), the README and
`studio/foundation/writing.md`.

## Decisions taken with "execute full plan"

1. Imported Underground pieces are restyled in Foundry's type. Uppercase Archivo wide for titles,
   Azeret Mono for labels, numbers and small text, bracket buttons or the chosen button variant,
   never Instrument Sans or Chivo Mono. Underground gives the structure, Foundry the look.
2. The trench drawing goes in the process section above the layer list, and the list stays as its
   legend.
3. The step rows replace Foundry's four step columns in the process section.
4. The crew matrix takes Foundry's light panel grey `--bh-grey-200` (`--paper`).
5. The FAQ sits after the audience cards and before the contact form.
6. Scroll rows start on the grid's left edge, `padding-inline-start: var(--gx)`, and may run off
   the right screen edge so the next card peeks.
7. Audience cards stay. Page length is reported after the build, cutting them is Filip's call.

## The grid

Already in `foundry.css` under "the one content grid". `.g` is the content container, max width
1600, side padding `--pad`. `.gc` is the column grid, 4 columns phone, 8 tablet, 12 desktop, gap
16 phone and 24 above. `--gx` is the grid's left content edge for full width scroll rows. Use them.
At 1440 every piece of content starts at x 32 and ends at x 1408. Check it in the shots.

## Slices, one builder each, no file shared

| Slice | Owns | Does |
|---|---|---|
| A buttons | `Bracket.tsx`, `variants/buttons/*` | Five button styles, the lab page |
| B hero | `variants/hero/*` | Hero designs 2 to 5 |
| C1 work | `Work.tsx`, `Projects.tsx`, new `r3-work.css` | Note 1 cards, grid for work and projects rows and heads |
| C2 process | `Process.tsx`, `art.tsx`, new `r3-process.css` | Note 2 trench drawing, note 3 step rows, grid for process |
| C3 crew | `Crew.tsx`, `Contact.tsx`, `Closing.tsx`, `Foundry.tsx`, new `Faq.tsx`, new `r3-crew.css` | Note 4 matrix, note 5 FAQ, grid for crew, contact and closing |

Each new CSS file is imported from the slice's own component file and scoped under `.p1`. In
`foundry.css` a slice may only edit the lines of its own sections, nothing else. Copy for new
strings goes in content the slice owns. C3 owns `copy.ts` additions under a `faq` or `crew` key;
other slices add their strings to a new `copy-<slice>.ts` in `variants/` or next to their component.
`content.ts` already has every FAQ question and answer.

## Button variants, slice A

`?v=1&btn=N` restyles every Bracket button on the page, so Filip sees each in context.
`?v=1&lab=buttons&btn=N` is ignored, the lab shows all five. The lab page, on a dark panel and a
light panel, shows each of the five in a row with its number, primary and secondary use, and the
default, hover, pressed, focus and disabled states side by side, forced through state classes so a
screenshot shows them. All hover and press motion between 150 and 280ms, eased, and none under
`prefers-reduced-motion`. Genuinely different, not five tints of one.

1. Bracket, as built. Corners spread 2px on hover, faint fill.
2. Bracket sweep. Corners stay put, a bull-red fill rises from the bottom edge on hover like soil
   lifting, label turns white, press pulls the corners in 2px.
3. Slab and arrow. A solid slab, light grey on dark grounds and #111 on light ones, mono label and
   an arrow. On hover the arrow leaves to the right and a new one slides in from the left, the slab
   turns bull-red. Press drops it 1px.
4. Text roll. No box, mono label with a 1px rule under it and a small bull-red square before it.
   On hover the label rolls up and its copy rolls in from below, the rule draws across in bull-red.
5. Split cell. A label cell and a square icon cell with an arrow, after Underground's Know more
   button in Foundry type. On hover the icon cell turns bull-red and the arrow turns 45 degrees to
   point up and right, the label shifts 4px. Press scales the cell to 0.96.

Also record each hover as a short clip if the tools allow, a gif or mp4 per variant from frames
captured during the transition, saved in the shots folder.

## Hero variants, slice B

`?v=1&hero=N`. Each variant root carries `data-hero="N"`. Design only, no motion yet. All on the
grid, phone and desktop both finished, Foundry's look, the full logo, `c.hero` copy only, the red
glow from taste.md where it helps. 1 is the round 2 hero, untouched.

2. Photo. `route-trench-village` full bleed, darkened toward the bottom, the uppercase headline
   bottom left over columns 1 to 8, lede and two buttons in columns 9 to 12, a mono meta line on
   top, and the red dots only along the trench line in the photo.
3. Split. Columns 1 to 6 hold the headline, lede, buttons and the four stats in mono under a
   hairline. Columns 7 to 12 hold one tall photo in the notched frame with crosshairs from note 1,
   with its caption, the red glow behind it.
4. Giant type. The headline across all 12 columns at 120 to 160px on desktop, the dotted hill low
   behind the last line with the red glow, and a bottom row of three small notched thumbnails with
   numbers, the lede and the buttons.
5. Cross section. A ground line across the grid a little below the middle. Above it the headline
   and buttons. Below it the trench cut in the dot matrix style of the hero art, the layers as dot
   rows, the ducts as dotted circles with one in bull-red, mono labels with leader lines that start
   on the label edge and end on the part they name, as note 2 asks.

## Checks, every slice

Build recipe step 4 and 5. Before shots at bb8c0fe exist in
`/tmp/claude-0/-home-user-freelancing/47010749-f8fd-541e-a7be-8b4f6076588b/scratchpad/r3-before/`.
Anything outside your slice that moved is a regression to undo. Typecheck, build, baselint, shots at
390 and 1440 in English and German, `--interact` for anything with hover or a menu. Commit on your
branch, a Round 3 section in `pathway-1-report.md` is not needed, report in your reply.

## After the builders

Merge, full shots of `/?v=1` at 390 and 1440, the hero board and the button lab with
`variants.mjs` and as page shots, then send Filip the boards with numbers to answer.
