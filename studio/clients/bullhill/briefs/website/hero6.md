# Hero 6, cable through ground, after Other Matter

Filip, 14 October 2026, "yes to hero 6, go with your defaults". Concept in `round3-notes.md` note 7,
taste entry 2026-10-14 13:36. Reference https://other-matter-ten.vercel.app/?view=grid&specimen=aerogel-skin,
captures in `refs/othermatter/sheet.jpg` next to this file. Design only, the camera stays still, motion comes
in a later round, so build the scene so it can move later.

## The picture

One specimen. A rectangular block of ground cut open, longer than it is deep, seen from a three
quarter angle slightly above, with a long lens so it reads like a product shot, not a game scene.
The duct bundle runs along the long axis and sticks out a little at both ends. At the near cut end
the fibres show inside one duct, thin strands whose tips catch the light.

A vertical seam splits the specimen at the middle of the screen. Left of it the same geometry is a
schematic, white hairlines for every edge, the soil and sand as dot fill, transparent on the black.
Right of it the real render. Same camera for both halves so every edge continues across the seam.
Render the scene twice with the scissor test, or two scenes with one camera, whichever keeps the
seam exact. A 1px seam line and two mono tags at its foot, Schematic and Render.

Layers of the cut face, top to bottom, from `c.process.layers` so English and German both work.
Surface, a dark asphalt slab with fine roughness. Base course, gravel as small instanced stones.
Warning tape, a thin strip above the ducts. Backfill, compacted soil with fine crumbs. Ducts, the
bundle, four to six tubes. Sand bed, fine light sand.

Ducts are glossy plastic with clearcoat in their real colours from BullHill's photos, measured on
`ducts-soil` and `ducts-fence`, green median about #5ea271 and orange median about #de6b4f in
daylight, so a base colour near #4f9a66 and #d65a33 before lighting. Tune by eye against the
photos. These two hues live only inside the render, per taste.md.

Lighting from procedural light formers, no HDR fetched from the web at runtime. A key light from
the upper left, a rim from behind, and a soft bull-red back glow that matches Foundry's red glow.
Background stays Foundry's #111 with the red radial glow in CSS behind a transparent canvas.

## The page

Foundry's look, on the one grid, the full logo in the header, `c.hero` copy and the call and send
buttons. Headline uppercase top left, the specimen filling the middle, lede and buttons bottom left,
a specimen card bottom right in Azeret Mono with `BH 001`, a name and a one line material note.
Never an em dash, never Other Matter's wording. Labels on the schematic half with leader lines
that start on the label edge and end on the exact part, as note 2 asks, anchored by projecting 3D
points to the screen so they stay on their parts at every size.

## Delivery

- Desktop at 768 and up, the live scene, `frameloop="demand"`, device pixel ratio capped at 1.5,
  the three.js code in its own lazy chunk so heroes 1 to 5 never load it.
- Phones, `prefers-reduced-motion`, and any browser without WebGL get a still rendered from the same
  scene, a portrait crop for 390 and a landscape one for desktop that also shows as the poster
  until the first frame. Render the stills with a script in `bullhill-site/scripts/`, headless
  Chromium with SwiftShader, at 2x, saved as WebP in `bullhill-site/public/render/`.
- Software WebGL in the container needs 9 to 13 seconds per frame before a shot, per
  `studio/foundation/env.md`.

## Files

`bullhill-site/src/p1/variants/hero/Hero6.tsx` and new files next to it, a scene file, its CSS,
`copy-hero6.ts`, plus the render script and the stills. Packages three, @react-three/fiber,
@react-three/drei and @react-three/postprocessing are installed.
