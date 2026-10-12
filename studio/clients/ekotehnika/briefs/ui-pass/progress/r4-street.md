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
- The texture is `public/brand/ekotehnika.svg` drawn into a canvas exactly as supplied, red mark included, per the parent's ruling that the logo's red is the brand's own mark. At box size the red is a small square beside the tagline and does not read loud, see `r4-street-box-logo-crop.webp` at H and C1.

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

Measured with the parent's fixed `scripts/loadbudget.mjs` (pulled from `claude/awesome-faraday-lkhnn2` and committed here), which times the hero road first drawing on screen. The before build is 23fee3b and the after build is this branch. They were served side by side on this container and run back to back in pairs, three pairs.

| Pair | Before first frame | After first frame |
|---|---|---|
| 1 | 13,008ms | 12,259ms |
| 2 | 18,841ms | 17,959ms |
| 3 | 13,837ms | 13,925ms |
| Median | 13,837ms | 13,925ms |

- Bytes on load went from 10.93MB to 10.96MB, and after a full scroll from 11.69MB to 11.72MB. That is 0.03MB against a 1.0MB slice. The footer still is not counted, since it loads only when the footer is wired in.
- The after median is 88ms later than the before median, and two of the three pairs came out faster. The script watches a patch of road at x 200 to 400, the far left of the frame, and my road now draws on from the left. It reaches that patch about 0.1s into the build in. So the 88ms is the draw on reaching the patch, not slower loading. Read strictly against "no later than your own before number", it is 88ms over, and that call is the parent's. The fix is to sample the patch nearer the forklift, or to let the road start drawing already past x 400.
- The earlier numbers from the old script are void, since it timed the canvas appearing.

## Scrollpass

- `scripts/scrollpass.mjs` on the after build, page px 0 to 6,500, H through into P, in 120px wheel steps. It printed "clean, no leak and no tone mismatch". Layer changes landed at C1 1620, R 3672 and P 5400.
- A full run to the page end timed out at 28 minutes in software GL. It had saved a frame at each layer change down to N 9720 by then, but it never printed its summary, so only the H to P stretch is a verified result.

## Footer still (Q11)

- `ekotehnika-hero/public/footer/site.webp`, 3648 by 600 px, so 1824 by 300 css px at 2x, 57KB.
- **Ground line.** The near kerb's foot sits 25 px from the bottom of the image, 12.3 css px. Stand the image so that line lands on the footer's bottom rule, so the image bottom goes 12.3 css px below the rule, or crop that strip off.
- It is on the footer ground `--grey-pale` `#e9e9e9`, opaque. The ground plane only takes shadows, so the set stands on the footer colour itself. Fog is the same grey, so the far trees settle into it.
- In frame, the company building with its name, the hall, the gate house with a barrier, trees in their pits, hedges and planters, the kerb and paving, two lamp posts and one X50 parked by the door, forks to the left, no load. It is seen low and side on like the hero. There is no road band, no row of trucks, no line art and no van.
- Render with `npm run dev`, then `node render-footer-scene.mjs <ekotehnika-hero path>` from a scratch folder that has playwright-core. The scene is `scripts/footer-scene/`, a dev only page that is not in the site build. It reuses the street set, for which `Building`, `FrontGarden`, `Greenery`, `Pavement`, `GateHouse` and `Barrier` are now exported from `outdoor.tsx` and `yard.tsx`. Nothing else changed in them.
- `sections.tsx` and `sections.css` are untouched.

## Shots

- Before and after at H 0.5, D1 0.7, C1 0.5, D2 0.8, F 0.3 and R 0.5, plus after at D2 0.4.
- `r4-street-scroll-sheet.webp` is a real wheel scroll from the top through H, D1, C1, D2, F, R, Z and P. Nothing of the street shows in Z or P.
- R looks the same before and after at 1920, as expected, since the fix belongs to `overlay.tsx`.
- Software GL, so motion smoothness needs Filip's eye on the preview.

## Open questions for Filip

- None from this slice. The logo question is settled, printed with its red.
