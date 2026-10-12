# Round 3, builder G, version 4 Grad

Files changed, all in ekotehnika-hero/src/story2/scenes/grad. Edited are choreo.ts, index.tsx, warehouse.tsx, site.tsx, yard.tsx and bots.tsx. The story timeline is untouched.

Sheets in this folder. r3-g-before-1920.webp is the state at aea9099. r3-g-after-1920-a.webp holds H, C1, R at k 0.5 and 0.9, P at 0.25, 0.6 and 0.95, S and N. r3-g-after-1920-b.webp holds T and AT at k 0.15, 0.45 and 0.8. r3-g-after-1440.webp holds N at 0.5 and 0.95 and AT at 0.15, 0.45 and 0.8 at 1440 by 900.

## What changed per beat

- C1. The glazed wing no longer casts its soft shadow onto the plain wall, and both walls carry more light of their own. The grey section counter sat on that shadow at 3.95 to 1. It is now 4.56 to 1 at 1920 and 4.55 to 1 at 1440.
- R. From k 0.7 the hall and its shadow reached columns 1 to 4 under the text. R now has a hard edged text cell over columns 1 to 4, ending on the column 5 line, in the yard's exact rendered ground (#f1f1f1). It opens at k 0.5 on bare ground, so it cannot be seen until the hall meets it. The hall then stops square on the column 5 line. The cell closes over the first 90px of Z.
- R and P. The verge, hedge and tree row of the R yard ran from x 100 to 205 straight through the warehouse footprint, so tree crowns stood inside the hall in P and A. They now end 3 m short of the west wall.
- P. Nothing of the hall enters columns 1 to 6 during the whole hold. The text cell holds to the end of P and closes over the first 90px of A, where it used to close at k 0.86. Behind the shell's cut out the opened hall is now a calm floor with its lane lines, held to k 0.85. The old mid zoom with giant racks behind the cut out is gone. As the text leaves, the camera rises straight up over the flat floor, then swings to the high corner, and the walls, racks and trucks rise after that.
- S. No change. The speed lines stay inside columns 5 to 12 between the two rules.
- N. No change needed. The depot runs edge to edge in one piece. With the spec row's bottom rule at y 528, the nearest truck top is at about y 576 at 1440 and y 644 at 1920.
- T. No change. The hall pushes the depot off the top on one hard edge, and every k has drawn content.
- AT. The view is closer and the order is tighter, so the active C-Matic 10 is about 200px across at 1920 by 1080, where it was about 135px. The charger moved 0.85 m east, the two slots and the pick bay 0.3 m closer. Everything stays right of the column 7 line, with the charger's left edge at about x 1000 of 1920 and x 745 of 1440. One order runs across the hold, the robot leaving its charger (k 0 to 0.3), lifting and carrying the shelf unit (0.3 to 0.6) and bringing it to the pick station, where the person takes the box (0.6 to 1.0). Two more C-Matics carry shelf units deeper in the aisle in step. The only system graphics are the 1px path ahead of the robot and the calm slot highlight.

## No fades

grep for gradient, fade, feather and mask in the folder finds only the striped seam of T, a hard repeating stripe. Every opacity in the folder is a fixed line weight, none changes with the clock. Scene changes are cuts, hard edged wipes and growth from the floor.

## Contrast on real pixels

Measured by sampling the scene under each text element's box with the UI hidden. Worst case per beat.

| Beat | Body at 1920 | Title at 1920 | Body at 1440 |
|---|---|---|---|
| C1 | 4.56 | 17.95 | 4.55 |
| R | 4.72 | 18.59 | 4.72 |
| P | 4.75 | 21.00 | 4.75 |
| S | 15.91 | 15.91 | 15.91 |
| N | 4.64 | 18.28 | 4.64 |
| AT | 15.12 | 15.17 | 15.12 |

The lowest body figure on each light beat is the 14px grey section counter. Lower figures inside the reveal (the scroll fill letters still grey) are the shell's motion, not the scene.

## Checks

tsc clean, vite build clean. Every hold beat shot at 1920 by 1080, N and AT also at 1440 by 900.

## Not done, and why

- B is still solid black from k 0.475 to the start of S. That is item 5, the second commit.
- Frozen shots in a busy software renderer sometimes come out blank, because a still draws only on a few timed frames. Every blank was re-shot and drew correctly. The live page renders every frame.
