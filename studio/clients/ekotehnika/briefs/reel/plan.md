# Showcase reel, plan

Status. Draft for Filip's review. Nothing is built, rendered or tested. Building starts only when the parent session says go, after round 4 and every Ekotehnika builder chat are merged and Filip has given his ship line on the finished site.

## Read this first

- **The portfolio reel's look does not carry over.** Its black ground, orange glow, white flashes, chromatic split and glitch slices break the Ekotehnika rulings on fades, glows, colour and the light ground. Its engine, its tilted plane, its construction lines and its cut on every beat carry over.
- **Several lines on the site are still marked dummy in `copy.ts`.** The reel uses the copy that ships, read from the shipped head on go. A line still marked dummy then goes to Filip before it goes in the reel.
- **The videos are silent.** Filip, "You don't need to pull it, just find the song and sync it for the BPM sound". No audio is fetched or committed. Frame 0 is a downbeat, so Filip lays the track in his editor from any downbeat and every cut lands.
- **The music is a commercial track.** Fine for a private pitch to Ekotehnika. A public post or a client post may draw a copyright claim or a mute, so a licensed or royalty free stand in is Filip's call.
- **Dax in the reel's own type.** The site frames show Dax because they are the site. Type the reel draws itself (the typed lines, the end card) is the font set into a video, which a web licence may not cover. Default is that the reel's own lines use Dax only if Filip confirms the Linde licence covers video. Otherwise every word on screen comes from the site frames themselves.

## The portfolio reel, decoded

- One renderer, `video/reel2.js` on branch `claude/halftone-slice` of filip-portfolio. Every frame is a pure function of time. `window.seek(t)` sets any exact moment, so nothing drops however slow the machine.
- Each shot draws flat on a 2048px canvas, the plane. WebGL projects that plane through a tilted camera, draws the site's grid in the shader so the plane never ends, then one post pass adds the effects.
- `scripts/render-reel.mjs` starts Vite, opens the page in the cloud Chromium with software GL, steps the timeline frame by frame, saves PNGs and ffmpeg encodes H.264 at CRF 17. About 1.4 seconds a frame, so about 15 minutes for 20 seconds at 30 fps.
- Shots carry their hits as beats relative to their own start, so a shot moves on the grid without retiming by hand.
- Pace rules that worked. A cut or a slam on every beat, half beats in the fast runs. A line that must be read holds at least one beat. Every cut carries a construction move. Camera moves are whips or punch-ins, no glides.
- Copy only from the live site. Real screens on tilted panels, never a screen recording.

## Direction, the site on its own drawing board

The plane is the site's own 12 column grid with its plus marks, white ground, ink hairlines, laid flat and tilted away from the camera. Each beat of the site lands on that plane as a real frame from the app, locked to the grid lines, and the cut happens on the music. On each cut the grid lines draw on toward the new frame and a plus mark flares where they meet, the way the portfolio reel builds its marks. The story runs in the site's own order, so the reel reads as the scroll story told in 20 seconds. One dark moment, S, as on the site, landed on a bar line in the middle of the reel, so Filip can lay the track with a big hit there. The fork from L lifts the reel out of the dark, exactly as it lifts the page.

Why this one. The site's identity is the grid, the light ground and the real Linde models. A reel on the same grid reads as the same product, and a light reel stands apart from the dark tech reels it would sit beside.

What it refuses.
- A black or dark ground outside S.
- Orange, blue, glow, bloom, chromatic split, glitch slices and white flash hits. A flash on white does not read and the others add colours off the token list.
- Crossfades and soft dissolves. Every change is a hard cut or a whip, per the 17.55 no fade ruling.
- Red anywhere but a primary button or a truck shell, per the red ruling.
- Coloured wireframes, arrows, circled numbers, rounded corners.
- A screen recording, a scroll capture, drone video, stock footage, a voice over.
- Any number, claim, client name or testimonial the site does not carry.

Effects kept from the portfolio reel, toned for light. Motion blur along whips, a 4 to 7 percent punch in on a slam that settles in 0.15 seconds, the tilt shift band, light grain. A cut may carry an ink frame for one frame instead of the white flash.

## Shot list, the site's story beats

Every frame on a panel is rendered from the shipped app at `?v=5&at=<beat>&k=<0 to 1>`, at 1920 by 1080, the board width Filip set. A shot that moves inside its panel steps `k` through the beat, so the forklift drives and the fork rises for real. Lines in quotes are the site's own, from `src/content.ts` and `src/story2/copy.ts`, and are checked again on the shipped head.

| Shot | Site beat | What the panel shows | Line on the plane | Minimum hold |
|---|---|---|---|---|
| 1 Hook | H | The hero, the forklift side on, the box | "Linde viljuškari." then "Prodaja, najam i servis na jednom mestu." | 2 beats |
| 2 Drive | D1 | The site moves past, wheels turning, `k` stepped | "Snaga koja pokreće" | 1 beat |
| 3 Company | C1 | The building, the load raised, the fact row | "Od 1997." and "1.000+" counting up on the beat, "Zvanični Linde partner" | 2 beats |
| 4 Yard | R | Top down, the S path to the warehouse | "Servis je srce naše firme." | 1 beat |
| 5 Sales | P | The warehouse, then the four tabs | The four cut outs swap on half beats, Čeoni, Retrak, Paletari i slagači, Komisioneri, then "96 Linde modela" | 2 beats |
| 6 Service | S | The dark beat, the lit X50, the dimension lines | "300+" and "Hitan servis" with the number | 2 beats, on a bar line |
| 7 Lift | L | The fork crossing the frame, `k` stepped | None, the fork is the cut | 1 beat |
| 8 Rent | N | The grid of trucks filling row by row | "Najam" and "24 sata" | 1 beat |
| 9 Automation | AT | One C-Matic job, charger to pick station, `k` stepped | "Automatizacija skladišta" | 1 beat |
| 10 Products | Proizvodi | The seven cells, the lead cell first | "Glavni proizvodi" | 1 beat |
| 11 Close | Closing and footer | The closing grid, the photos entering from both sides | "Zatražite ponudu" on the primary, then both logos and ekotehnika.rs | 2 beats, the last held |

- If the chosen part is short, drop in this order. Drive, Yard, Automation, Products. Hook, Sales, Service and Close never drop.
- If it is long, Sales gets one beat per tab and Rent gets a row per beat.
- The end card holds both logos at the co-branding sizes, Linde as supplied, the wordmark white only on a dark ground. The guideline's video pages (G p.57 to 58) are read on go and decide the end card's ground.

## Two frames, one timeline

One timeline drives both. The shots, the beats and the lines are the same. Each format has its own camera keys and its own plane layout per shot, selected with `?f=916` or `?f=169`.

- **16 by 9, 1920 by 1080.** The site frame is landscape, so it fits whole. The plane tilts about 40 degrees away and turns about 20 degrees on screen. The panel takes about two thirds of the width, the line sits on the plane in the free third. Whips run sideways along the plane, the way the forklift drives the story left to right.
- **9 by 16, 1080 by 1920.** A whole landscape frame would sit small in the middle. So the panel stands steeper and turns so its long side runs up the frame diagonally, and the camera pushes in on the beat's subject (the forklift on H, the cut out on P, the X50 on S). The line sits on the plane above the panel, set larger. A second raised panel, a crop of the fact row or a tab, sits under it when the beat has one. Whips run up and down. Type and logos stay clear of the top 250px and bottom 400px, where the phone app draws its own controls.
- Neither is a crop of the other. Both are checked side by side at the same moment before the full render.

## The tempo

- songbpm.com lists "Church" at 80 BPM and notes it runs double time at 160, track length 4.02.
- audiokeychain.com lists the main explicit version at 160 BPM.
- They agree. 80 and 160 are the same grid, 160 counts every half beat. They disagree on the key (C sharp major against F minor), which the cut does not use.
- The reel cuts on the 80 grid, one beat every 0.75 seconds, a bar of four every 3 seconds. The fast runs use the 160 grid as half beats, every 0.375 seconds. The portfolio reel cut every 0.469 seconds, so a cut on every 160 beat would be faster than anything Filip has seen land.
- 28 beats, seven bars, 21.0 seconds, the closest bar line to the 20 second default.
- At 30 fps a beat is 22.5 frames, so a cut rounds to the nearest frame, never more than 17ms off and never adding up. At 60 fps a beat is exactly 45 frames.
- Neither site is a measurement of the master. If a cut drifts when Filip lays the track, the grid moves by one number in the renderer and nothing else changes.

## The beat table

| Beats | Time (s) | Shot | What lands on the grid |
|---|---|---|---|
| 0 to 3 | 0.00 to 2.25 | 1 Hook, H | "Linde viljuškari." on beat 0, the lede on beat 1, half beat stacking, holds a full beat |
| 3 to 5 | 2.25 to 3.75 | 2 Drive, D1 | Whip in, the site moves past, "Snaga koja pokreće" on beat 4 |
| 5 to 8 | 3.75 to 6.00 | 3 Company, C1 | "Od 1997." on 5, "1.000+" counts up across 6, "Zvanični Linde partner" on 7 |
| 8 to 9 | 6.00 to 6.75 | 4 Yard, R | The flip to top down as the cut, the line on the half beat |
| 9 to 12 | 6.75 to 9.00 | 5 Sales, P | The four cut outs on half beats from 9, "96 Linde modela" on 11, held |
| 12 to 15 | 9.00 to 11.25 | 6 Service, S | Hard cut to dark on bar 4, the X50 on 12, "300+" on 13, "Hitan servis" on 14 |
| 15 to 16 | 11.25 to 12.00 | 7 Lift, L | The fork crosses the frame across the beat and lifts the reel back to light |
| 16 to 18 | 12.00 to 13.50 | 8 Rent, N | Rows fill on half beats, "24 sata" on 17 |
| 18 to 20 | 13.50 to 15.00 | 9 Automation, AT | One C-Matic job in two beats, the line on 18 |
| 20 to 22 | 15.00 to 16.50 | 10 Products, P cells | The lead cell on 20, the six others on half beats, "Glavni proizvodi" on 21 |
| 22 to 24 | 16.50 to 18.00 | 11 Close | The photos enter from both sides on 22, "Zatražite ponudu" on 23 |
| 24 to 28 | 18.00 to 21.00 | End card | Both logos on bar 6, ekotehnika.rs on 25, held to the end, the last frame rests on the grid so it loops |

## Build steps, after go only

1. Set the hourly resume Routine per the README Sessions rule. Pull the shipped head and name its commit as the baseline here.
2. Read the shipped copy. List every line the reel uses and any still marked dummy, for Filip.
3. Recheck the tempo against one more source, and adjust the beat table if the shipped copy changed a line.
4. Port the renderer into `ekotehnika-hero/video/`, `reel.html` and `reel.js`, with the grid and plus marks in the shader in place of the dot grid, the Ekotehnika tokens, and the format switch. Port `render-reel.mjs` into `ekotehnika-hero/scripts/`, with the viewport from the format.
5. A capture script steps the app through each beat at `?v=5&at=<beat>&k=`, about 6 seconds a shot in software GL, and saves WebP frames to a git ignored folder. About 150 shots, so about 15 to 20 minutes.
6. Three still frames per format, Hook, Sales and Service, side by side on one board. Filip picks or corrects. Stop here for his answer.
7. A 5 second test of shots 1 and 2 in both formats. Filip lays the track under it to hear the grid before the full render.
8. The full render of both, about 15 minutes each. Filip gets the two silent files in the chat. The MP4s stay out of the repo.
9. One round of fixes. Micro detail choices (the cut move, the plus flare, the type entrance) go on one variant board, 3 to 5 numbered clips, Filip answers with a number.

## Open, with defaults

1. **Length.** Default 28 beats, 21.0 seconds, the same cut for both formats. 24 beats (18.0 seconds) is the shorter option, and drops Drive and Yard.
2. **Frame rate.** Default 30 fps. 60 doubles the render time.
3. **Dax in the reel's own lines.** Default only if the licence covers video, see Read this first.
4. **Music for any public use.** Default this track for the private pitch only. A licensed stand in is Filip's call.
