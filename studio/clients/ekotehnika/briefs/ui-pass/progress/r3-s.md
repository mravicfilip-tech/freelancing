# Round 3, builder S, version 5 Sistem, report 1

Files changed, all in `ekotehnika-hero/src/story2/scenes/sistem/`. They are overlay.tsx, camera.tsx, warehouse.tsx, roof.tsx, outdoor.tsx, grid.tsx, aisle.tsx, atplan.ts, index.tsx. Nothing committed. tsc and vite build are clean. Shots are 1920 by 1080 only.

Sheets are `r3-s-at.webp` (AT at k 0.15, 0.45, 0.8) and `r3-s-beats.webp` (H, C1, R, P at 0.98, N, A at 0.3, S at 1.0, L at 0.5).

## 1. Fades
- The top band and the R cell sat at the wrong place. They were drawn at 0.52 m in front of the camera instead of 1 m, which scaled them by 1.15 and left the band ending at y 58 to 92 instead of the rule at y 136. They are now at exact depth, drawn after everything, so the band ends on the rule and the R cell lands on the grid lines (x 972, y 136).
- The band over the top row goes dark with the shell's light ink (scroll 7790, u 9.475) and back at u 11.8, a hard step each way. In B it was white under white ink before.
- Removed the horizon haze plane and pushed the fog start 24 m back, so no tree row, rack or bay line is washed to the ground colour.
- The roof no longer fades and lifts. Its two pitches slide ten metres down their slopes and out of the frame. The warehouse floor is now one plane that runs past any frame, and the two soft light pools are gone.
- The L curtain is flat white (it was a vignette and faded out at k 0.93), the wire truck in A draws and erases with its clip plane in the info blue and no white halo.
- C1 reads as one world at 1920, the building and the forklift fill the frame and the title and lede sit on the bare facade wing.

## 2. P overlap
- Outdoor is dropped after u 7.05 and the Z camera ends 20 m over the floor, so at 1920 the frame holds only the hall's floor for the whole hold. The interior (walls, racks, trucks, lane lines) turns on after u 8.001, A begins with it. Hairlines of the walls showed at k 0.98 before.
- Shell side, not mine. The P text layer fades out near k 0.95 to 1. If P's text must stay solid to the end of the hold, that is in the shell.

## 3. Dimensions
- The dimension labels, leaders and arrowheads draw before the curtain (render order 3 and 4 against 20 and 21), so they go under the light ground and the tine in the same frames as the schematic. L at k 0.5 shows none over the tine or the ground. The curtain is opaque so nothing draws over it.

## 4. N
- N is one hall. The floor has nine bay rows and 27 bays across, out past both frame edges. The hall's end wall (16 m, plain, with a base band) stands behind the last row and its foot lands on the grid rule under the spec row (y 543). The title, lede and spec row sit on that wall. Camera d 52, lens shift 0.305.

## 5. AT
- One order, one camera move. Camera d 11.8, pitch -16, eye 4.05 m, yaw 80 to 74, lens shift 0.22. The active robot stays at column 9, about 170 to 220 px wide. The lanes run away to the right, so the fleet, the station and the person stay right of column 6 and the left half is floor and end wall under the text.
- k 0 to 0.3 the C-Matic leaves its charger, 0.3 to 0.6 it goes under the first front row bay (no unit in front of it now), lifts the unit and carries it out, 0.6 to 1 it brings it to the pick station where the person takes a box.
- The system graphic is a 1px info blue line 5 m ahead of the robot and a quiet outline and tint on the target slot. Fleet robots keep working deeper in the aisle.

## Open
- T, A and B are only checked in passing. Report 2 follows.
- At 1920 the top row nav and the phone buttons on the dark beats come from the shell, the S frame shows the logos shifted left of the grid. Not touched.
