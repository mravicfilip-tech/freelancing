# BullHill website, round 4 notes, Foundry only

Status. Collecting. Filip is sending notes one after another on 14 October 2026. No code changes
until he pauses or says go, then they are planned in one pass. Foundry at `/?v=1`, files in
`bullhill-site/src/p1/`. Baseline for the regression shots is the head of the session branch when
the round starts.

## Notes

1. Button style 3, more ideas. Filip circled style 3, the slab and arrow, on the hover sheet,
   "lets ideate more on this button". Logged in taste.md 15:18. Micro detail, so three to five
   numbered variants of the slab and arrow on one board with `variants.mjs` and a hover clip each,
   genuinely different, all keeping the solid slab, the mono uppercase label and an arrow.
2. Sharp edges. "make all edges sharp", on a screenshot of a project card. The card's 24px radius
   (`.pc` in `foundry.css`, and `--ph-radius` 12px), the photo's 12px radius (`.pc__photo`) and
   the 4px radius on the prev and next buttons (`.sq`, shared by the work and project rows) go to
   0. Narrow reading, that card and its controls. The wider reading, every rounded corner on the
   site, waits on Filip.
3. Closing art. "graphic feels AI slop- lets do something else", on the dotted hill and the glowing
   red hill left of the red closing panel. Logged REJECTED in taste.md 15:20. A replacement is
   proposed in words and built only after Filip's yes.
4. Headline tracking, APP-WIDE, logged in taste.md 15:22. "lets reduce font tracking by 5%" and
   "apply the font trackng reduce to all headlines to follow similar percentage for look and feel".
   Letter spacing minus 0.05em, the way a design tool writes minus 5 percent, on every display
   headline. Every headline in Foundry uses the shared `.display` class, so the places are
   - `bullhill-site/src/p1/foundry.css` line 47, `.display` `letter-spacing: 0`, the one rule all
     headlines read, hero 1 to 6, section, card, step, stat, FAQ, contact and closing titles.
   - `bullhill-site/src/p1/r3-process.css` line 85, the layer list resets it to 0.
   Check the small titles, 20 to 28px, in the shots. If letters touch at minus 0.05em there, they
   take minus 0.04em, the closest step that keeps the look. Recorded in `base-override.json`.

## Open questions

- Note 2, sharp edges on the project card only, or on every rounded corner of the site.
- Note 3, the replacement for the closing art. Proposed, a tall photo of finished work,
  `restored-lane`, the crossing closed and resurfaced, in the notched frame with crosshairs from
  note 1 of round 3, with its number and caption, so the page ends on the result of the work.
  The glowing hill goes.
- The same dot terrain style is in hero 1, behind the process title, in the audience section and
  in its wave. Whether Filip reads those as the same problem.
