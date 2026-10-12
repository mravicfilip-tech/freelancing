# Round 3, builder L, version 2 Linija

Files changed, all in ekotehnika-hero/src/story2/scenes/linija. New are stage.ts, schematic.tsx, rental.tsx and automation.tsx. Edited are index.tsx, dark.tsx, outdoor.tsx and topdown.tsx.

Sheets in this folder. r3-l-before.webp and r3-l-after-1920.webp show H, C1, R, P at k 0.25 and 0.5, S, N, T and AT at 1920 by 1080. r3-l-after-1440.webp is the same set at 1440 by 900. r3-l-after-transitions.webp shows the new hard edged scene changes.

## What changed per beat

- AT. The rejected robots on dotted diagonals are gone. A plan drawing of a warehouse aisle sits in columns 7 to 12. Four rack rows with 1.2 by 0.8 pallets flank one aisle, a cross lane runs below with a hatched docking station at the left end and a pallet pick at the right end. The C-Matic 10 and HP are 1.2 m, drawn against the pallets with no enlargement. Routes are 1px dashed lines in LMH blue with square stop markers and a ring at each start, no arrowheads. Robots are white line art, no red.
- T. The floor rises and the same plan is drawn on by wipes, floor lines from the top, racks up from the cross lane, stations in from their walls, routes along their length.
- C1. The truck now rests in columns 7 to 12, so the lede and title sit on plain ground. The building is rebuilt under 140 high in white and light grey with window bands and edge lines, the sign is the one dark element, shrubs are planted lobes on stems, lamps and cypresses are shortened where the text column sits.
- R. The yard fills the right of the path and the lower left. Two hall roofs with standing seams and skylight strips, paved aprons with kerbs, rows of parked forklifts in bays, pallet stacks, outdoor racks, a van at the gate. Nothing is drawn left of world x -110, so the text lands on empty ground and no wash is used.
- P. The scene is empty under the text at the hold, the 3D cut out carries it. The iso warehouse now reveals from the right edge, so it reaches columns 1 to 6 only after the text has left.
- S. The hand drawn truck is replaced by an orthographic X50 side elevation built from millimetre numbers, straight lines, true circles and chamfers. Two weights (2px and 1px), dashed hidden and centre lines, a 24px grid at 8 percent, turquoise dimension lines with plain end bars and the figures L1 4373, L2 3173, Y 2120, H1 2523, H6 2495, c 600 and Q 4990. Mast and forks are drawn. Wheels turn with the clock. Speed lines run only inside columns 5 to 12 between the two grid rules, in two fixed weights.
- N. The depot is framed into columns 7 to 12 below the spec row, three rows of five in marked floor bays, each truck wiped up from its bay. Columns 1 to 6 below y 520 stay plain for the photo collage.

## The no fade rule

Logged 2026-10-12 17:55. Removed from the folder. The speed line mask, the fork blade gradients, the line brightness ramp on the speed lines, every opacity crossfade between scenes (side view to top view, roof out, iso in and out, side room, aisle, black push, dark ground), the bay and truck fades in N, the floor fades in T. They are now shutter closes, hard edged wipes and cuts. grep for gradient, mask and feather in the folder finds nothing.

## Checks

tsc clean, vite build clean, 0 console errors on every hold beat at 1920 and 1440. Timeline untouched. Shots were taken against a snapshot of the committed shell, so the shell edits other builders are making were not in them. Re-shoot N once the photo collage lands, since the depot top is set at screen y 520.

## Not done

- P has no wireframe overlay truck (the T02 move in plan part C). It is a 3D idea and the Linija warehouse is already line art.
- A and B were not redrawn, rack labels and pallet wrap from plan part C are open there.
- Stage geometry reads the real stage size, so columns hold at any viewport, but only 1440 by 900 and 1920 by 1080 were shot.
