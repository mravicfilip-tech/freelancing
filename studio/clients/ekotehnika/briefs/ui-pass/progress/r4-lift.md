# Round 4, lift branch, item 16 the fork move

Branch `claude/awesome-faraday-lkhnn2-lift` from 23fee3b. One file touched, the fork tine code in
`ekotehnika-hero/src/story2/scenes/sistem/overlay.tsx`. The band colour lines (`DARK_TOP_FROM` and the band colour
line) are untouched, so the parent's item 17 hunks merge clean.

## The move, Q4 default

- The timeline is unchanged. Every pose is a pure function of the story clock, so `?at=L&k=` draws the same picture each time.
- k 0 to 0.5, the tine rises from under the frame through the whole frame, the light section hanging under its blade.
- k 0.5, the section's top edge lands on the top rule of the grid and stays there. That is the "into place".
- k 0.5 to 0.8, the tine lets go and drops out under the frame, slow at first and faster as it falls. Before, it stopped just past the top and vanished at k 0.97.
- k 0.8 to 1, the light ground holds alone with no steel on it, so the move has a clear end before N.
- The section gives way to N at u 12, as before. Hiding it at u 11.9 showed the N bays still folded into a thin strip, so I kept 12.
- The hook plate's back edge rides on the outer grid line at 48px, corrected for perspective, so the tine sits on the grid at any width.
- Nothing fades. The steel and the section are opaque, every step is a move.

## The tine, to the render bar of the taste entry at 22.13

- A hook mount fork as Linde forks are built. Forged blade thinning to a bevelled tip, a wide heel radius, the shank.
- The top hook plate, wider than the shank, with its lip and the notch for the carriage bar.
- The locking pin housing on top of the hook plate and its pull ring.
- The bottom hook with its claw turned up.
- A riveted steel tag on the shank, stamped ISO 3A, 2500 kg, 600 mm. That is one fork's share of the X50 the schematic shows, Q 4990 kg at c 600, and class 3 covers 2,501 to 4,999 kg trucks.
- Every edge has a 45 degree chamfer of 0.012 half heights, about 6px at 1080. Top chamfers catch a bright line, bottom chamfers fall dark.
- Brushed finish from a canvas texture drawn in code, the grain running along the blade and up the shank. No new file loads.
- Shading is baked per face from one key light up and to the left, greys only. No colour, no wireframe.

## Budget, Q6

Same container, `?v=5` at 1920, production build, three runs each.

| | Load | Full scroll | First canvas frame |
|---|---|---|---|
| Before, 23fee3b | 10.93MB | 11.69MB | 959, 988, 1061ms |
| After | 10.93MB | 11.69MB | 752, 724, 947, and 715 and 1113 on two earlier runs |

The download does not move at two decimals, the textures are drawn at runtime. First frame times swing by about 300ms
run to run on software GL. One of three before runs and one of five after runs went over 1,000ms, and the after median of 752ms sits under the before median of 988ms. Slice used is under 0.01MB of 0.2MB.

## Shots

- `r4-lift-before-L-*.webp` and `r4-lift-before-N-0.webp`, the baseline.
- `r4-lift-after-L-*.webp`, the rise, the dock, the drop and the empty hold.
- `r4-lift-after-tine-detail.webp`, the hook plate, pin, ring, tag and chamfers at full size.
- `r4-lift-scroll-9000-10620.webp`, a real wheel pass through S end, L and N. No steel reaches N.

## Seen in the scroll pass, not mine

- The P cut out, the red N20, sits over S, L and N in the real scroll. That is item 14 in the shell.
- At L k 0.85 the band is light but the top row is still dark, the white wordmark gone on white. That is item 17, the band switch at 11.8 against the shell's 9525.
- Black boxes over the N text in one frame at story 9750, likely the N text reveal in the shell.

## Changes needed outside my file

- None to land this. The move ends on the plain light section and cuts to N at u 12, as today.
- If Filip wants the section to be N itself, with the bay lines and the floor rising on the blade, `grid.tsx` would need the bays spread before u 11.9 (today `range(u, 11.9, 12.1)`) and `camera.tsx` would need the N camera from about u 11.5. That is the automation branch's file and the parent's file, so I did not touch them.

## Open questions for Filip

- During the dock, about 60px of scroll, the blade crosses the top row under the nav and phone buttons. Keep it, or dock the section one cell lower so the blade never reaches the top row?
- The tag stamp reads ISO 3A, 2500 kg, 600 mm. Fine as a part marking, or drop the numbers and keep a blank riveted tag?
