# Round 4, street branch

Branch `claude/awesome-faraday-lkhnn2-street`, built from 23fee3b. Files touched are `props.tsx`, `outdoor.tsx`, `yard.tsx` and `index.tsx` in `src/story2/scenes/sistem/`, plus the shots in this folder. Nothing else moved.

## What changed

### Item 7, modules
- **Wheels.** Every van wheel is now a turned tyre with rounded shoulders, a graphite sidewall with a raised band, 60 black tread blocks across the crown, and a rim with a lip, a dished face, six holes, a centre boss, five nuts and a hub cap. The old dark wheel well disc sat in front of the old rim, which is why the wheels read as black toy discs. It now sits behind the rim face. See `r4-street-wheel-detail.webp`.
- **Vans.** Panel lines on the cargo box, a sliding door with its shut lines, rail and handle, cab door lines and handle, glass in black seals with a lighter band, wipers, a slatted grille with a plain badge, framed head and tail lamps, plates without text front and rear, mirrors on arms, rear door hinges and handle, wheel arch lips, sill skirts, and a soft contact shadow. The livery and wordmark stay.
- **Company building.** Downpipes with brackets at each end, a contact shadow along the foot of the facade and the hall, a plain address plate and a canopy lamp by the door. On the hall, roller door guide rails and head box, two bollards and a side door with frame and handle. The plain wing stays bare, since the C1 title sits on it. I tried cladding seams there first and they ran through the headline, so they are out.
- **Booth.** The gate house is rebuilt with a plinth, corner trims, window bands in black seals with mullions and sills on three faces, a door with frame, vision panel, handle and step, a fascia roof with a coping line, a plant unit with grille slats, a plain plate and contact shadows on every side. The barriers get a base, a service door, a cap, a pivot and white arms with graphite bands, no red.
- **Lamp posts.** Bolted base plate, plinth with an access hatch, collars at the joints, a finned luminaire with a framed lens and a contact shadow.
- **Kerbs.** A chamfered profile, a gutter strip on the road and a joint line at the foot.

### Item 3, trees
- The tree count is the same. Every trunk has a root flare and stands in a kerbed pit with soil and a cast grille. The yard verge trees keep their verge instead of a pit. Each tree has a soft contact shadow the width of its crown.
- The crowns take two tones from the key light. Faces turned to the light are white or pale and faces turned away go one LMH grey down. Emissive lift is down from 0.3 to 0.16 so the light shows. See `r4-street-after-H-0.5.webp` against the before.

### Item 4, box wordmark
- The pallet box itself is `Pallet` in `src/r3f/Forklift.tsx`, which is outside my files. I did not touch it. The wordmark is printed from `index.tsx` instead, as two planes on the carton's long faces, riding with the fork lift, so no outside change is needed.
- The texture is `public/brand/ekotehnika.svg` drawn into a canvas, not redrawn. The file has one small red square. I set that square to the wordmark's own graphite `#4d4d4d`, since red sits only on truck shells. That is the one open question below.

### Item 2, the build in on load
- It is timed from the scene's first frame, not from the scroll. The road, its edge lines, centre dashes, kerbs and pavement draw along from the left over 1.3s. Trees, hedges, planters, lamp posts, vans, the building and the hall rise out of the ground left to right, each over 0.75s. The forklift drives 16m into its hero place along the road once its model is ready, easing to rest by about 2.2s. Nothing fades.
- It is skipped when the URL has `at=` or the browser asks for reduced motion, so every frozen shot shows the final pose. Otherwise every pose stays a function of the story clock. The timeline is untouched.
- `r4-street-buildin-sheet.webp` shows frames at 0, 0.15, 0.3, 0.5, 0.7, 0.9, 1.1, 1.4, 1.8, 2.2 and 3.0s, taken on a fake clock, since software GL runs too slowly to catch it live.

### Item 9, R edge
- The cut does not come from the yard or the camera. It is the plain cell in `overlay.tsx`, `CELLS` x `[0, 972]`, a fixed pixel width. It meets the centre grid line only at 1920. Filip's window is about 2560 wide, where the centre line is at 1292 and the cell still stops at 972, which is 486 of 1280 in the video. `r4-street-r-cut-2560.webp` reproduces it.
- `overlay.tsx` belongs to the parent branch, so I made no change. The exact change is in the next section.

## Change needed outside my files

In `src/story2/scenes/sistem/overlay.tsx`, end the R cell on the centre grid line at any width.
- Add `import { gridXs } from '../../shell/Grid';`
- In the `CELLS.forEach` loop, replace `const x1 = x0 + ((c.x[1] - c.x[0]) / half) * o;` with `const right = gridXs(size.width)[2]; const x1 = x0 + ((right - c.x[0]) / half) * o;`, and leave `x: [0, 972]` only as the left edge, or change it to `x: [0, 0]` with a comment that the right edge is the centre grid line.

## Load budget

Measured with `scripts/loadbudget.mjs`, `?v=5` at 1920, production build, this container.

| | Load | Full scroll | First canvas frame |
|---|---|---|---|
| Before, 23fee3b | 10.93MB | 11.69MB | 2564, 1036, 1431ms |
| After | 10.94MB | 11.72MB | 1017, 1048, 1092, 1270, 1126ms |

- Bytes rose 0.01MB on load, against a 1.0MB slice. Everything is procedural and the wordmark is the 17KB SVG already in `public/brand`.
- First frame time is noisy here. The baseline itself ranged 1036 to 2564ms, over the 1,000ms line, so the parent's 977ms reading was a quieter container. The after median is 1092ms against a before median of 1431ms. I read it as no change from my slice. It needs one run on the parent's container to compare with 977ms.

## Shots

- Before and after at H 0.5, D1 0.7, C1 0.5, D2 0.8, F 0.3 and R 0.5, plus after at D2 0.4.
- `r4-street-scroll-sheet.webp` is a real wheel scroll from the top through H, D1, C1, D2, F, R, Z and P. Nothing of the street shows in Z or P.
- R looks the same before and after at 1920, as expected, since the fix belongs to `overlay.tsx`.
- Software GL, so motion smoothness needs Filip's eye on the preview.

## Open questions for Filip

- The red square in the Ekotehnika logo file prints in graphite on the box, so the box carries no red. Keep it graphite, or print the logo with its red square?
