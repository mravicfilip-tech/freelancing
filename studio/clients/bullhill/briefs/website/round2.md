# BullHill website, round 2, real photos

Filip, 14 October 2026. "Can you populate the content with these images? Make sure they're
upscaled where needed so pixels don't break. I like 1st and 3rd best, but the gradient from 2nd is
something also dope. We can maybe use it somewhere in 1st and 3rd. Also can we drive that we have
images of their work surfacable after hero in all 3 variants somehow?"

Read `build-rules.md` and your pathway brief again, and the three newest entries in
`studio/clients/bullhill/taste.md`. Those rules still hold.

## What is ready in shared

- Seven real photos in `bullhill-site/public/photos/`, oriented, metadata stripped, the small
  ones upscaled four times, cut to WebP widths with a 1280 JPEG fallback.
- `src/shared/photos.ts` lists them with alt text in English and German and a default focal
  point. `src/shared/Photo.tsx` renders one, `src/shared/Media.tsx` renders the photo when a
  `Shot` has `photo` and the placeholder when it does not.
- `content.ts` now has `photo` on the hero shot, the four service shots, the five project shots,
  the crew shot and steps 02 to 04, and a new `c.work` block with a kicker, title, lede and seven
  photos with captions in story order, open trench to restored pavement.
- Slots with no photo yet keep the placeholder, the three crew portraits, step 01 survey, client
  logo slots.

## Rules for every pathway

1. Swap every `Placeholder` whose shot now has a photo for `Media` or `Photo`. A real photo shows
   clean, no grain, no excavator mark, no shot brief. Give each the radius, notch or frame the
   pathway already gives its photo slots, styled on `.photo` inside your containers.
2. Set `sizes` per slot to the width it really renders at, for example
   `(min-width: 1200px) 33vw, 85vw`. The image above the fold gets `priority`.
3. New section right after the hero, `id="work"`, from `c.work`, in the pathway's own language,
   below. On phone at least one whole photo and the edge of the next show in the first screen
   after the hero. Captions sit under or on the photos, numbered in the pathway's style.
4. Faces and readable signs stay as they are, no blur, these are the client's own photos.
5. Check, shoot, fix exactly as in `build-rules.md`, at 390 and 1440, English and German.

## Pathway 1, Foundry

- Work section on #111 directly under the hero and before the light ethos panel, which keeps its
  24px top radius sliding over the work section. Mono kicker row with `c.work.kicker` left and
  `07` with `c.work.count` right on a hairline. Title uppercase 40px left, lede in mono right.
  Then a horizontal scroll snap row of tall photo cards with 24px radius, in the shape of the
  reference's cards, the first card about twice as wide, 480px tall on desktop and 400 on phone,
  captions under each in mono uppercase `01 / 07` and the caption. Square prev and next buttons
  as in the projects row. Phone cards about 300px wide with the next one peeking.
- Daylight's glow, per taste.md. A bull-red radial glow rising from the bottom edge of the hero
  behind the dotted hill, soft, alpha 0.25 to 0.45, fading into the work section. And in the
  closing section, a glowing bull-red hill, a half circle rising from the bottom of the black half
  under the dotted hill art, built like `.p2-footer`'s planet in `src/p2/daylight-end.css` line 66.
- Project cards show their photos. Services cards keep their dot art. Crew strip keeps its
  placeholders.

## Pathway 2, Daylight

- Changes only where named, per taste.md. Move the photo row section so it sits directly after
  the hero and before the logo strip, and make it the work section. `c.work.title` 48px left with
  `c.work.lede`, then the seven photos in the row with 12px radius, bleeding off the right edge,
  captions in mono under each. It scrolls sideways on phone.
- Project slider photos, the cluster photos (seven plus one repeat), the first process card and
  the audience card photo strips show real photos. Crew portraits keep placeholders.

## Pathway 3, Underground

- Hero shows `route-trench-village` full bleed with a dark gradient toward the bottom so the
  white headline keeps 4.5 to 1. Corner marks and chevron stay.
- Work section right after the hero, on #0e0f0f. A tag with `c.work.kicker`, the title at 32px,
  the lede, then a horizontal row of notched media frames with crosshair marks as in the steps
  panel, one per photo, a bull-red `001` and the caption under each. Phone scrolls sideways.
- The descent band follows the work section. At its bottom, as the way into the wireframe, a
  glowing bull-red hill in Daylight's footer style, half circle, soft outer glow, alpha low enough
  that the wireframe above stays the focus.
- Steps 02 to 04 show their photos in the notched frames, 01 keeps its placeholder. The full
  bleed crew photo shows `excavator-street` with three other photos as the thumbnails. The project
  tab card shows each project's photo. Service detail frames keep their wireframes.
