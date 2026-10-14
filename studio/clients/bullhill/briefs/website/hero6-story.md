# Hero 6 motion, story

Filip, 14 October 2026, "can you also do an animated version ... with v6 included ... for the hero I
mean". The `/story` skill runs first. Captures from 14 October 2026 are in the scratchpad
`motion/`, frames at 0.6, 1.5, 3, 6 and 10 seconds, the pointer left and right, and three scroll
positions.

Status. Filip said yes to the beats on 14 October 2026, "yes to beats, build beat 4 first, no
deadline". Beat 4 is being built, the others wait for his yes on it.

## Decode, worldquantfoundry.com hero

| Property | Load | Headline | Form | Idle | Scroll |
|---|---|---|---|---|---|
| Camera | Fixed | Fixed | Fixed, dots fly in toward the centre | Fixed, the dot vortex turns slowly | Fixed, the page scrolls past |
| Ground | #111, a field of drifting dots | Same | Same | Same | The light panel rises over the black |
| Type scale | None | 60px uppercase 500, mono 12px | Same | Same | Mono 12px intro row with a bracket button |
| Chrome | Two line logo and nav | Same | Same | Same | Nav shrinks into a dark centred pill with the mark |
| Rendering | Points | Live type, each line unmasked upward | Points | Points | Live type and panels |
| Story device | Stars | Lines rise out of a mask one by one | Scattered dots assemble into the vortex | Slow turn | The next panel slides over the hero |

The one property that makes it work, scattered dots assemble into the form while the headline
rises out of its mask line by line.

## Decode, other-matter-ten.vercel.app

| Property | Intro | Grid | Scroll |
|---|---|---|---|
| Camera | None | Fixed per specimen, a long lens | Fixed, cards scroll past |
| Ground | White | Light grey cards, soft floor shadow | Same |
| Type scale | 48px light sentence case | 12px mono card labels, 14px captions | Same |
| Chrome | None | Index, view, hand and sound toggles | Same |
| Rendering | Type | Live WebGL materials | Same |
| Story device | A title card that gives way to the grid | Each specimen is alive, the material turns and shifts slowly | Specimens keep moving as they pass |

The one property that makes it work, the camera holds still and the material itself is alive.

## Beats, draft

| Beat | Camera move | What the scene shows | Words on screen | The one thing a stranger understands |
|---|---|---|---|---|
| 1 Load, 0 to 1.2s | Fixed | Black with the red glow, the header in | The headline rises out of its mask line by line, then the lede and buttons | A crew that digs the routes fibre runs through |
| 2 Assemble, 0.6 to 2.8s | Fixed | The seam drops from the top. Left of it the schematic draws itself, edges trace in and the dots of the soil fly in and settle. Right of it the render wipes out from the seam. The labels' lines draw from each label to its layer | Labels, specimen card BH 001 | What is under the street, layer by layer |
| 3 Idle, loop | A slow drift of 2 to 3 degrees, and on desktop a small tilt toward the pointer | Light runs across the fibre ends every few seconds, the red glow breathes | Same | The ducts are real, the fibre goes in later |
| 4 Scroll out, first screen of scroll | A short dolly toward the duct ends | The seam slides left so the real render takes over the schematic, plan into ground. The headline moves up, the work photos rise | The work section kicker | From plan to finished route |

Hardest beat, 4, because the scroll drives the seam, the camera and the label positions together
in two scissored renders, and it has to hold 60 frames a second on an ordinary laptop.

Phones keep the still image. Beat 1 and a seam wipe on the still run there in CSS, no WebGL.

## Beat 4 build

- The hero pins. The section is 100svh plus 70svh of scroll, the stage is sticky for that stretch,
  progress p runs 0 to 1 across it, then the work section scrolls in as now.
- Seam. Its x goes from the middle of the specimen to about 15 percent from its left end as p goes
  0 to 1, eased, so the real render takes over the schematic. The seam line and its two tags ride
  with it. Labels whose part has turned real fade their leader and keep their tag.
- Camera. A short dolly toward the duct ends, about 12 percent closer and a few degrees round, the
  same long lens, eased with the seam. No other camera move.
- Headline, lede and buttons move up and fade out in the last third of p, the specimen card stays.
- `frameloop="demand"`, invalidate on scroll inside requestAnimationFrame, one render per frame at
  most. Label positions re-projected each frame from the same 3D anchors.
- `prefers-reduced-motion`, no pin, no seam move, the still poster as now.
- Phones. Two stills from the same camera, all schematic and all render, stacked, and the render
  still's clip-path inset follows p, so the seam slides in CSS. The pin is 50svh there.
- Shots. One frame per scroll position, p 0, 0.25, 0.5, 0.75 and 1, at 1440 and 390, on one contact
  sheet, English. Software WebGL needs about 12 seconds a frame.
