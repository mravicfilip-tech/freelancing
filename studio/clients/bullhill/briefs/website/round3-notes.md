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

## Open questions

- "I like some of the elements of v3 to be inserted into v1." The cards are the one element named
  so far. Which others, if any, waits on Filip.
