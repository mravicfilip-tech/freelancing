# BullHill website, round 4 plan, Foundry

Filip, 14 October 2026, "all sites edges sharp, yes to photo, go". That approves the five notes in
`round4-notes.md`, note 2 at its wider reading, every corner in Foundry, and note 3's photo. The dot
art in hero 1, the process title and the audience section was not answered, so it stays. Baseline
shots of this round are in the scratchpad `r4-before/`, taken at commit f97c336.

## Slices

| Slice | Who | Owns | Does |
|---|---|---|---|
| A slab | builder | `Bracket.tsx`, `variants/buttons/*` | Note 1, five slab and arrow versions, a board and hover clips, square corners in its own files |
| B sweep | main thread | `foundry.css`, `r3-process.css`, `r3-crew.css`, `variants/hero/hero.css`, `Closing.tsx`, `art.tsx` | Notes 2 to 5 |

## Slice A, five versions of the slab and arrow

`?v=1&btn=3&slab=N`, N 1 to 5, restyles every slab button on the page, and `?v=1&lab=slab` shows
the five side by side with every state forced, on dark, light and the red closing panel. All keep a
solid slab, the mono uppercase label and an arrow, square corners. Genuinely different.

1. Arrow swap, the style 3 as built, kept as the reference.
2. Offset plate. A hard 4px offset block in bull-red-dark sits behind the slab, on hover the slab
   moves onto it and the arrow pushes 4px right, press flattens it fully.
3. Arrow cell. The arrow sits in its own square cell at the right end behind a 1px hairline. On
   hover the cell widens and the arrow runs to the far edge while the label holds still.
4. Cut line. A 2px rule under the label draws across from the left on hover like a cut being made,
   and the arrow rides along at its end.
5. Split flap. On hover the label's letters flip one by one, top to bottom, in a quick stagger,
   like a split flap board, and the arrow steps right.

## Slice B, notes 2 to 5

- Note 2, every `border-radius` in the files above goes to 0, each line read before it changes, the
  circles that draw ducts and dots stay round. The duct end pills in the red panel become square
  ended bars.
- Note 3, the closing's left half becomes `restored-lane` in the notched frame with crosshairs,
  number `07` and the caption from `c.work.items`, the dot terrain and the glowing hill removed.
- Note 4, `.display` letter spacing minus 0.05em, the layer list override removed.
- Note 5, the header logo 48px desktop and 38px phone.
