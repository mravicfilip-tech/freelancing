# Round 3, builder L, version 2 Linija

Files changed, all in ekotehnika-hero/src/story2/scenes/linija. New are stage.ts, schematic.tsx, rental.tsx and automation.tsx. Edited are index.tsx, dark.tsx, outdoor.tsx and topdown.tsx.

Sheets in this folder. r3-l-before.webp and r3-l-after-1920.webp show H, C1, R, P at k 0.25 and 0.5, S, N, T and AT at 1920 by 1080. r3-l-after-1440.webp is the same set at 1440 by 900. r3-l-after-transitions.webp shows the new hard edged scene changes.

## What changed per beat

- AT (superseded by the follow up below). The rejected robots on dotted diagonals are gone. A plan drawing of a warehouse aisle sits in columns 7 to 12. Four rack rows with 1.2 by 0.8 pallets flank one aisle, a cross lane runs below with a hatched docking station at the left end and a pallet pick at the right end. The C-Matic 10 and HP are 1.2 m, drawn against the pallets with no enlargement. Routes are 1px dashed lines in LMH blue with square stop markers and a ring at each start, no arrowheads. Robots are white line art, no red.
- T (superseded by the follow up below). The floor rises and the same plan is drawn on by wipes, floor lines from the top, racks up from the cross lane, stations in from their walls, routes along their length.
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

## Follow up 1, AT and T redone to the approved direction (taste 18:05 and 18:15, round 3 item 12)

The plan view with dashed routes, stop markers and rings is gone. Sheets r3-l-at-aisle.webp (AT at k 0, 0.15, 0.3, 0.45, 0.6, 0.8, 1.0 at 1920 by 1080 and k 0.5 at 1440 by 900) and r3-l-at-t.webp (T at 0.25, 0.5, 0.75).

- View. A clean axonometric of a warehouse in white line on the dark ground, never top down. Back wall and floor run edge to edge. The left half of the frame is plain floor, so the text sits on the floor. The work happens in columns 7 to 12 and bleeds off the right edge.
- One order across the hold. k 0 to 0.3 the C-Matic 10 leaves its charger and drives under the target shelf unit. k 0.3 to 0.6 it lifts the unit and carries it to the pick station. k 0.6 to 1.0 a drawn person, 1.75 m, walks in, takes the box from the highlighted slot and sets it on the pick table.
- Fleet. Two more C-Matics each move a shelf unit into an empty slot at the deep end of the aisle in the same windows, then drive away empty.
- Scale. Robot 1.2 m, shelf unit 1.0 by 0.8 by 2.1 m, all in metres.
- Only system graphic. A solid 1px path just ahead of the active robot and nothing behind it, and a calm highlight on the target slot. No dashed routes, stop markers, rings, arrowheads or plus markers.
- T. The light depot and the dark aisle move up together as one piece, the aisle's top edge pushing the depot off the top. Every k has drawn content, the light trucks above and the aisle's wall, racks and chargers below. At k 1 it is the AT frame at k 0.
- Files. src/story2/scenes/linija/automation.tsx rewritten, index.tsx for the T move.

## Follow up 2, A and B redone

Sheets r3-l-ab-before.webp and r3-l-ab-after.webp, k 0.25, 0.5 and 0.75 at 1920 by 1080.

- Racks in the side room carry bay signs A-01 to A-06 and level plates 01 to 03. Loads carry stretch film as exact diagonal lines and bands, and pallet tags with a bar code.
- Racks in the aisle carry bay label plates with a bar code on the beams, and film lines on the loads.
- Everything in the iso warehouse, the side room, the aisle and the black push stops at the grid rule under the top row. Above it the ground is plain, white, or ink once the shell turns the top row dark at 7790.
- B is the zoom into the truck and the black push, now clipped under the rule, with a hard wipe to black.
- Red stays on the truck shells only. Nothing fades.
- Not changed. The B zoom is still a scale up of the same front truck art, so its flat blocks are large at k 0.5.

## Checks for both

tsc clean, vite build clean, 0 console errors on the beats shot. No other beat was edited, H, C1, R, P, S and N were re-shot and look as before.

## Follow up 3, AT framed close, B rebuilt, N back to full width

Sheets r3-l-at2.webp (AT at k 0.3, 0.45, 0.6), r3-l-b2.webp (B at 0.25, 0.5, 0.75, 0.9) and r3-l-n2.webp (N at 0.5 and 0.95), all at 1920 by 1080. tsc and vite build clean.

- AT. The view is framed closer, the axonometric unit grew from about 49 to 64, so the C-Matic is about 150px wide at 1920. The robot now has a body, two drive wheels, two casters, a nose light bar, a lift column and a top plate. The shelf units stand 0.62 m clear and lift 0.25 m, so the robot shows under them during the carry. The aisle still runs to the right frame edge, the fleet at the far end is small and partly off frame.
- B. The 60x zoom into flat blocks is gone. Two dark drawing sheets close in from both edges with a hard 1px edge. On them the same truck is drawn as exact line art at the same place and size, so the real truck turns into a drawing as the sheets pass over it. When they meet the frame holds the 24px measuring grid, the front elevation, a centre line, a ground line with a 24px ruler across the full width and a scale ruler under the truck. S then wipes its sheet in from the left and the same edge removes the front drawing. Every k has drawn content, nothing fades. File closing.tsx, with edits in index.tsx.
- N. The photo collage is out, so the depot is one drawing across the full width under the spec row. Three rows in marked bays, the middle row set half a bay over so the rows interlock, floor lines of each row running to both frame edges. Only the title, lede and spec row areas at the top are kept clear.
