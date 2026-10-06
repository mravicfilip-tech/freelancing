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
