# BullHill website, round 3 notes, Foundry only

Status. Collecting. Filip picked pathway 1 Foundry on 14 October 2026 and is sending patch notes
one after another. Each note lands here as he sends it. No code changes until he pauses or says go,
then the notes are planned in one pass.

Scope. Foundry at `/?v=1` only, files in `bullhill-site/src/p1/`. Daylight and Underground are
frozen at commit b0bf997 and change only where Filip names them.

## Notes

1. Work section cards. Use Underground's work card design in Foundry's work section, the notched
   photo frame with the 1px hairline and 8px inset, crosshair marks at the corners, the skewed bar
   in the notch, and the number with the caption under the photo. All card text in one colour, the
   numbers not bull-red. Filip's words, "Cards design like this but with all same color fonts not
   red here." Source `.p3-work__card`, `.p3-notch` and `.p3-work__cap` in
   `bullhill-site/src/p3/underground.css`. Record the card in the kit with `kit.mjs add` once Filip
   has seen it built.

2. Trench drawing with labels. Bring Underground's trench line drawing into Foundry, with the
   glowing red hill behind it and the labelled tags pinned to its parts, but better made, "Like
   this but better executed on lines and for it to make sense actually." Filip boxed the two
   faults on the Underground version, the leader lines start below and beside their tags instead
   of at the tag, and they end on the wrong parts or nowhere in particular, so Oberfläche points at
   the middle of the slab and the drawing does not read as a trench. Rebuild it so it reads as a
   real trench cut open, surface slab, base course, warning tape, backfill, ducts on a sand bed,
   each layer distinct, and every leader line starts on the edge of its tag and ends on the exact
   part it names, one stroke weight, one end dot, straight or one clean bend. Source
   `bullhill-site/src/p3/art.tsx` and the process section in `SectionsA.tsx`, the hill in
   `underground.css`.
3. Step rows with photos. Bring Underground's steps panel into Foundry, the notched photo frame
   with crosshairs on one side, the number, title, body and the small Know more button on the
   other, but "to be kept 'in grid' and not full width". On Underground the text sits at the far
   left edge, bottom aligned, and the photo at the far right edge, with a dead gap between them at
   1440. In Foundry, photo and text sit side by side on the page grid, text block next to the
   photo and aligned to it, no empty middle. Source `.p3-steps` in `SectionsB.tsx` and
   `underground.css`.
4. Crew and machines matrix. Bring Underground's crew and machines section into Foundry, "this
   section too". The grey ground, the title, body and black button with the red dot on the left,
   and on the right the hairline grid with crosshair marks where the lines meet, the four stats in
   the top row and the four machines with a line icon, type, size and count below, the regions as a
   mono line under the grid. Source the matrix in `SectionsB.tsx` and `.p3-matrix` in
   `underground.css`. In Foundry it takes over the stats and the fleet rows that sit in the crew
   section today.
5. FAQ. Bring Underground's FAQ into Foundry, "this too". The light panel inset from the screen
   edge with the crosshair frame inside it, the title and black button with the red dot on the
   left, the Radix accordion on the right with the red down right arrow before each question,
   hairlines between, the small square chevron toggle that turns red when open, and the soft red
   glow along the bottom. Source the FAQ in `SectionsC.tsx` and `.p3-faq` in `underground.css`.
   Foundry has no FAQ today.
6. One grid for all content, APP-WIDE, logged in taste.md. "The whole website can have full width
   backgrounds whatnot etc but the content needs to be within one same grid." Foundry's grid is
   12 columns, 24px gutter, max width 1600 centred, side padding `--pad`. Places in
   `bullhill-site/src/p1/foundry.css` that leave it today, none changed yet.
   - line 336 `.wk__row`, the work photo row starts at the screen edge plus `--pad`, off the grid
     above 1664 wide.
   - line 452 `.proc__head`, the process title sits in its own 960 wide centred column.
   - line 496 `.layer`, the layer list is a centred three column row, not on the grid columns.
   - line 506 `.proj__head` and line 510 the project row, centred title and a row padded to centre
     its first card, `calc(50% - var(--cw) / 2)`.
   - line 602 to 605 `.crew__main`, centred intro, title and portrait strip.
   - line 699 `.con`, the contact panel has no max width, so it runs edge to edge above 1664.
   - line 770 to 828 `.end`, the closing splits the screen in two halves and insets the red panel
     24px from the screen edge, not on the grid.
   - The four Underground pieces in notes 1 to 5 come in on this grid, not on their own widths.
7. Hero 6, cable through ground, after Other Matter. Filip, "could we insipire ourselves to do
   something similar that would represent a cable going through a ground fibric? where 50% is a
   shematic and the other 50% is a real cable render based on this? as one variant for the hero".
   Reference https://other-matter-ten.vercel.app/?view=grid&specimen=aerogel-skin, captured
   14 October 2026, six live WebGL material specimens, one object each on a plain ground with a
   mono specimen card, name, material, one line. Filip said yes with every default on
   14 October 2026, "yes to hero 6, go with your defaults".
   - One block of ground cut open, the duct bundle running through it, seen at a three quarter
     angle like a specimen. A vertical seam down the middle. Left of it the same geometry as a
     schematic, white hairlines and dot fill, layer labels with leaders as in note 2. Right of it
     the real render, granular soil as fine particles like Other Matter's Dust Silk, the ducts as
     glossy plastic tubes, the fibres inside them catching light at the cut end.
   - Foundry's black ground and red glow, the headline and buttons on the grid above or beside
     it, a mono specimen card in Foundry type, BullHill's own wording, never Other Matter's.
   - Built in three.js with react three fiber, as on Ekotehnika, static camera now, motion later.

## Open questions

- Where the trench drawing sits in Foundry. Foundry's process section already tells the same
  layers in big type. Proposed default, the drawing goes in the process section above the layer
  list, and the list stays as its legend. Waits on Filip.
- Whether the step rows replace Foundry's current four step columns in the process section or come
  in as their own section. Proposed default, they replace the four columns. Waits on Filip.
- The matrix colours. Underground's grey ground is `--bh-grey-300`. Foundry's light panels are
  `--bh-grey-200`. Proposed default, the matrix takes Foundry's light panel grey so it sits in the
  same family. Waits on Filip.
- Where the FAQ sits in Foundry. Proposed default, after the audience cards and before the
  contact form, as on Underground. Waits on Filip.
- Hero 6 duct colours. The real ducts in BullHill's photos are green and orange, so a true render
  brings two hues the brand palette does not have. Proposed default, keep them true to the photos,
  since it is a render of their real material. Taken, Filip said yes.
- Hero 6 delivery. Proposed default, the live WebGL scene on desktop, a still rendered from the same
  scene for phones and as the poster while it loads. Taken, Filip said yes.
- Scroll rows and the grid. Proposed default, the work and project rows start on the grid's left
  edge and may run off the right edge of the screen, so the next card peeks. Waits on Filip.
