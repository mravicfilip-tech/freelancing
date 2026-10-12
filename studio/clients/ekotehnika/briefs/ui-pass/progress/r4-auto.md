# Round 4, automation branch, item 20

Branch `claude/awesome-faraday-lkhnn2-auto`, from 23fee3b. Files changed are `aisle.tsx` and one word in `warehouse.tsx`
(the export on labelTexture). `atplan.ts` and `grid.tsx` are unchanged. The timeline and the robot routes are unchanged.

## The arm

- **Cause.** The picker's own pose, not a shelf and not the near clip plane. The old right arm aimed at the box with
  lookAt from one shoulder. When the box moved to the cart at k 0.95 to 1, the cart stood on the far side of the body from
  the camera, so the arm swung across and through the torso and stayed inside it. That is the frame at 8m27 in the video,
  box on the cart and no arm.
- **Fix.** Both arms are now an upper arm, a forearm and a hand, posed every frame by a two bone reach in the person's own
  frame, a pure function of k. Both hands take the box by its sides, pull it to the chest, the person turns round to the
  cart through the camera side, sets the box down and lets the arms hang. The arms stay in front of the body the whole
  time. The cart moved behind the person (plan a 25.0, b -0.62), the person moved 0.2m along the aisle so the reach clears
  the unit's corner upright, and the pick station floor outline grew 0.3m to hold the cart.
- **Timing inside AT.** Reach 0.89 to 0.92, pull 0.92 to 0.945, turn 0.945 to 0.975, set 0.975 to 0.988, let go 0.988 to 1.
- **Proof.** `r4-auto-arm-strip-before.webp` (k 0.55, 0.65, 0.75, 0.85, 0.92, 1) and `r4-auto-arm-strip-after.webp`
  (k 0.85, 0.9, 0.93, 0.95, 0.96, 0.97, 0.98, 1). Full frames at k 0.55, 0.65, 0.75, 0.85, 0.95 and 1 are
  `r4-auto-after-AT-*.webp`. At k 0.55 to 0.75 the person is out of frame, the camera follows the robot.

## The shelves

- **Shelf units.** Punched uprights (a slot every 5cm, a canvas texture, no download), a base plate under each leg, a beam
  clip at every shelf on every upright, beams on all four sides with a darker lip, a bin label on the beam under each cell
  and a shipping label on the two outer faces of every carton. The labels are labelTexture from the A racks.
- **Fixed pallet racks.** Racking from `yard.tsx` is no longer used here. A new PalletRack in `aisle.tsx` follows the A
  rack Row, punched uprights on base plates, ladder bracing, beams with a web, a flange and an end clip, pallets, wrapped
  loads with two bands, and a label on each beam and each load on the aisle face. Same footprint and height as before.
- **The picked box** carries a label on two faces.
- Colours are the LMH greys and white only. No red anywhere new. The info blue path line and target outline are untouched.

## Budget

Measured with the parent branch's fixed `loadbudget.mjs`, which times the first drawn hero road, production builds of
23fee3b and of this branch served side by side, `?v=5` at 1920, three runs each, before and after alternating.

| | Load | Full scroll | First frame, three runs | Median |
|---|---|---|---|---|
| Before, 23fee3b | 10.93MB | 11.69MB | 15468, 14123, 21567ms | 15468ms |
| After | 10.93MB | 11.69MB | 19627, 14578, 14360ms | 14578ms |

- The slice adds no downloaded file and stays within 0.01MB, inside the 0.5MB slice budget. The labels and the punched
  uprights are drawn on canvases at load.
- The first frame median is under the before median, so it meets the rule. Software GL in this container spreads single
  runs by 7 seconds, so the medians are the numbers to read.

## Scroll pass

- Wheel step shots, `r4-auto-before-scroll-*.webp` and `r4-auto-after-scroll-*.webp`, from the top through T and AT.
- The parent's `scrollpass.mjs` on the after build. The full page run passed 30 minutes in software GL and was stopped,
  so it ran again from page 9,500 to 13,200, N through T and AT into Proizvodi. Its log is `r4-auto-scrollpass.txt`.
- **Result.** Every problem it prints is a shell defect from the base, the Prodaja cut out outside P (item 14) at every
  step, and the top row tone at the dark exit near 9,500 to 9,700 (item 17). None comes from the aisle.
- `r4-auto-scrollpass-after-y12199.webp` is the first Proizvodi step. The aisle stays inside the story stage as it
  scrolls up, and the picker stands with the box on the cart and the near arm in view.

## Outside my files

- Nothing needed. `yard.tsx` keeps Racking for its own use.

## Open for Filip

- The path line and the target outline are still the info blue `#468cc4`, set by the 18:15 AT direction. The 22:12 entry
  calls that blue "not a README token" while ruling on the A wireframe. Should the AT path line move to ink as well?
