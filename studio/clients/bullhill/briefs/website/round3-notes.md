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

## Open questions

- Where the trench drawing sits in Foundry. Foundry's process section already tells the same
  layers in big type. Proposed default, the drawing goes in the process section above the layer
  list, and the list stays as its legend. Waits on Filip.
- Whether the step rows replace Foundry's current four step columns in the process section or come
  in as their own section. Proposed default, they replace the four columns. Waits on Filip.
