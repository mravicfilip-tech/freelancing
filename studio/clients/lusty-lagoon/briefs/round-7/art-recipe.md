# Art recipe, round 7, plan line G

Filip approved lines G, H, J and I with "do these suggestions". This recipe is how a character or prop
goes into a scene, so variants 1, 2 and 5 composite the same way. Every builder follows it. The taste
entry of 2026-10-19 22:25 on pasted cut out art is the rule it serves.

## What was wrong

A transparent cut out (`landing/girl-*.webp`, `lobby/hero-girl.webp`, `lobby/giveaway-chest.webp`)
sat on a gradient or the spiral pattern. Her light, colour and edges came from a different picture
than the ground behind her, nothing touched her, and nothing stood in front of her. That is what
reads as taped on.

## The layers, back to front

1. **Scene.** One illustrated Lusty Lagoon scene from `public/art`, as an `<img>` with `object-fit:
   cover`, cropped so its horizon or floor meets where her feet or hips land. Graded into the panel,
   a purple colour layer in `mix-blend-mode: color` or `multiply` at 35 to 60 percent, brightness down
   so text over it keeps AA, and `filter: blur(1.5px to 3px)` so it sits behind her in depth.
   - Variant 5 balance card, `lobby/hero-sunset.webp` (1740 by 907).
   - Variant 1 hero, `landing/casino-courtyard.webp` (1400 by 1400), night, palms, lit terrace.
   - Variant 2 hero, `landing/hero-beach.webp` (1920 by 1259), the lagoon cove.
2. **Atmosphere behind her.** A soft light where the scene's light comes from (the sun, the lamps),
   orange or purple only, never yellow, and a haze band low in the frame.
3. **Contact shadow.** A dark radial ellipse under her feet or where she meets the floor, blurred,
   20 to 45 percent black, a little wider than her stance. If she is cropped above the feet, the haze
   band crosses her at the crop instead, so no hard bottom edge shows.
4. **Character.** The cut out, sharp, no larger than its source pixels (taste 16:43). Graded toward the
   scene, `filter` with brightness, contrast and saturation nudged so her shadows go purple and her
   highlights warm.
5. **Light wrap.** A second layer the exact size of the character, masked by her own alpha
   (`mask-image: url(<same webp>)`, `mask-size` and `mask-position` matched), filled with a gradient
   from the scene's light side (warm orange) to the shadow side (purple), in `mix-blend-mode:
   soft-light` or `overlay` at 40 to 70 percent. This is what makes her lit by the scene. Add a rim, a
   `drop-shadow` of 1 to 2px in the light colour on the light side only.
6. **Foreground.** At least one thing in front of her that overlaps her edge. A flower pillar
   (`landing/pillar-flowers-left`, `-right`, `pillar-gems-a`, `-b`), the chest, a darkened crop of a
   palm from the scene, or the haze. It is darker and slightly blurred, so it reads nearer.
7. **Vignette.** A radial or edge gradient from the panel colour, so the scene melts into the card or
   hero edge and the text side stays calm.
8. **Life, optional.** A few slow drifting sparks or fireflies in front, under `?still` and reduced
   motion they stop.

## Rules

- No text glow, no yellow, no gold text. Lights are orange or purple.
- Text over or beside the scene keeps AA. Measure it.
- The scene fills its frame at 1440, 1920 and 2560. No empty third.
- The spiral pattern (`kit/spiral-white.svg` and the variant's pattern classes) may leave a spot but
  never leaves the page. In variant 5 it moves to the giveaway band.
- Shoot at 1440, 1920 and 2560 and look at her edges at 100 percent. A halo, a hard edge or a light
  that disagrees with the scene is a fail.
