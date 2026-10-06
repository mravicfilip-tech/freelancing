# Blueprint reel, 9 by 16, plan

Status. Draft for Filip's yes. Nothing is built yet.

## What clip 2 does (mikedesignofficial, about 20.6 seconds)

- Black ground, thin white construction lines, dashed guides, small crosshair points and dimension labels in a mono face (173.6°, 8.0, 28.8, 90.0°).
- The whole scene sits on one flat plane tilted away from the camera, roughly 40 to 50 degrees, rotated about 30 degrees on screen, so lines run diagonally and recede.
- Tilt-shift focus. The middle band is sharp, the top and bottom fall off into blur, which is what sells the depth.
- The camera never cuts hard. It glides along the plane and pushes in, then lifts to a flat top view for the UI shot, then back.
- Every element is built, never just shown. A guide extends, a crosshair flashes with a small star flare where two lines meet, a dot grows into a circle, the circle squares off into an app icon, the glyph lands, a wordmark types in with a caret.
- Rhythm is about one beat per 1.5 to 2 seconds, eased in and out, no bounce.
- One accent colour only (blue there). Everything else is white at 30 to 90 percent.
- Story arc is detail to product. Construction of the mark, the icon, the type, then a real UI sidebar under the grid, then the logo reveal with a glow, then the opening lines again so it loops.

## What clip 1 adds (astapable, first 17.8 of 33 seconds seen)

- It is a person showing a 15 second brand reel that a model coded for him from his own website and one prompt, so the idea is a reel made from the site itself, not a screen recording.
- Its result shows real product UI (a git history app, branch list, a timeline line, a floating "Last commit 2m 14s" chip) on panels tilted in 3D, light ground, small type, drifting slowly.
- It cuts to a full-bleed brand orange slide ("MOTION REEL 2026") with dots falling, and the generated video opens on a typed code line, "/* Hello World", with a blinking caret.
- Takeaway for Filip. Clip 1 gives the content (his own work, his brand, floating real screens, a typed opener), clip 2 gives the camera and the construction look. The plan below combines both.

## Clip 1, second part (the generated reel itself, about 11 seconds)

- White ground, black type, one green accent dot that travels through the whole piece.
- "/* Hello World */" types in, collapses to the dot, the dot becomes the full stop of "I'm Ev." with a small role label under it.
- "I make things that help others do their search / staking / chatting / research / cleanup / jumping / thing." The last word swaps every half second and a matching product tile (phone, dial, chat, dashboard) sits beside it.
- "Even when it's complex," over an explosion of shapes, then the shapes snap into a calm grid for "I make it clear."
- Three numbers scramble in (27%, 90%, 1.5M+), then everything falls back to the single dot.
- Flat, no perspective. The writing does the work, short lines, one idea a beat.

## Filip's script, clip 1's story told in clip 2's camera

Same beats as clip 1, shot on clip 2's tilted blueprint plane, in the site's black, white and orange. The site's dot field plays clip 1's shapes, chaos for complex, the grid for clear.

1. "/* legacy platforms → products */" types in on the tilted plane, collapses to the orange dot.
2. The dot lands as the full stop of the M. while guides construct the mark, then "I'm Filip." with "UX & Product Designer" measured under it.
3. "I turn legacy platforms into" then the last word swaps with a real project screen beside it, dealer portals (BRP), agent tools (Allstate), fintech (Varntix), trading (HFDX), security (Lyrie).
4. "Even when it's complex," the dots scatter across the plane.
5. "I make it clear." the dots snap into the site's grid and the halftone face assembles from them.
6. Three facts that are true. Filip supplies them, nothing is invented (for example years, products shipped, sectors).
7. End card, the M. with its glow and the site address, then back to the opening guides so it loops.

## The same idea for Filip, in his site's own language

Accent is the site orange (var(--accent), #FF4213), ground is the site black, labels in the site mono, display type in Anton. About 20 seconds, so it loops on Reels.

1. 0.0 to 2.5 s. Guides draw across the tilted plane, the site's dot grid fades in under them, a crosshair flares where they cross.
2. 2.5 to 6.0 s. The M. is constructed. Corner arcs with degree callouts, the stroke drawn along the real logo path, the orange full stop drops in last.
3. 6.0 to 9.0 s. The camera glides along the plane. "Filip Mravić" types in beside the mark with a caret, a dimension line measures it.
4. 9.0 to 12.5 s. The halftone face from the intro assembles dot by dot on the grid, the red rim lights up on its right, callouts read the grid size.
5. 12.5 to 16.0 s. Camera lifts toward flat. The hero headline is built, I TURN LEGACY, then PLATFORMS drawn as the hollow outline with its fade, then INTO PRODUCTS, construction lines over it.
6. 16.0 to 19.0 s. Two or three real project screens float in on tilted panels, the way clip 1 shows its UI, each drawn in dots and printed by the sweep like the site, with measurements on the frames.
7. 19.0 to 20.6 s. Back on the tilted plane, the M. with a soft orange glow, the site address under it, then the guides from shot 1 so the loop is seamless.

## How it gets made

- One scene page in the portfolio repo, folder video/, using the real logo path, fonts, scan data and project covers, so it matches the site exactly.
- Everything runs on one timeline that can be set to any exact moment, so each frame is rendered on purpose and nothing stutters.
- A script steps the timeline frame by frame at 1080 by 1920 in the cloud browser, saves each frame, and ffmpeg encodes an H.264 MP4 at 30 fps, Reels ready.
- Tilt-shift is a sharp layer plus a blurred copy masked top and bottom. Flares are small additive stars. No GPU is needed, rendering just takes a few minutes.

## Steps and what Filip sees

1. Three still frames (shots 2, 4 and 5) for the look. Filip approves or corrects.
2. A 5 second test render of shots 1 and 2 for the motion.
3. The full 20 second render, then one round of fixes.

## Open questions, with defaults

1. Length. Default 20 seconds, looping.
2. Frame rate. Default 30 fps. 60 is possible and doubles render time.
3. End card text. Default the site address and nothing else. Which address, the vercel one or a custom domain.
4. Sound. Default none, Filip adds the music in Instagram.
5. Opening line. Default a typed comment like clip 1, "/* legacy platforms → products", before the guides draw.

## Timing sheet (built, 2026-10-07)

Rule. One beat every 1.5 to 2 seconds, eased in and out. Every line holds at least 0.5 seconds after it finishes typing, so it can be read. Camera moves overlap the end of one beat and the start of the next, never a hard cut.

| Time (s) | Beat | What moves | Camera |
|---|---|---|---|
| 0.0 to 2.3 | Opener | Guides draw on, flare at the cross, the comment types in 0.2 to 1.5, holds to 2.0, folds away 2.0 to 2.3 | Tilted plane, slow drift |
| 2.1 to 2.8 | Hand-off | The orange dot flies to where the M. ends | Glides to the mark |
| 2.3 to 4.6 | The M. | Box guides, crosshairs, sizes and the corner radius, the outline draws 2.5 to 4.2, fills 4.0 to 4.6 | Holds |
| 4.3 to 6.0 | Name | I'M FILIP types 4.3 to 5.0, the stop lands, role and measure 5.0 to 5.7, holds to 6.0 | Holds |
| 5.6 to 6.6 | Move | The mark leaves 6.0 to 6.8 | Glides to the turn line |
| 5.7 to 10.6 | Turn | I TURN LEGACY, the outline PLATFORMS INTO, then five projects at 0.6 s each from 6.6 (the last holds to 10.1), leaves 10.1 to 10.6 | Holds on the panel |
| 10.2 to 12.3 | Complex | Dots arrive scattered, the line types 10.5 to 11.3, holds to 12.0 | Glides into the dots |
| 12.0 to 14.3 | Clear | Dots snap into the face 12.0 to 13.3, I MAKE IT CLEAR types 13.0 to 13.7, measured to 14.3 | Lifts to near flat |
| 14.2 to 16.2 | Stats | Three placeholders scramble in 14.2 to 15.4, hold to 16.2 | Pans down onto them |
| 16.2 to 17.8 | Move | Face and stats leave, the mark comes back | Long glide back to the mark |
| 17.4 to 19.4 | End card | Orange glow, the address types 17.8 to 18.8, holds | Slow drift |
| 19.4 to 20.0 | Loop | Fades to the empty plane the reel opens on | |

What the audit changed against the first build. The opener held only 0.25 s after typing (now 0.5). The last project word showed for 0.3 s before leaving (now 1.1, swaps 0.75 to 0.6 s). The stats held 0.5 s (now 0.8 after the last settles). The glide back to the end card took 1.2 s across the whole plane (now 1.6).
