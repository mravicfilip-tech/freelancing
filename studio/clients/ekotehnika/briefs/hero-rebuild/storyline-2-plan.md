# Storyline 2, plan, hardened against the voice over

Sources. Filip's recording `Storytelling_UI_animacija_za_ekotehniku_compressed.mp4`, its Serbian voice over transcribed
in `storyline-2-voiceover-sr.txt` (machine transcript, a few words are misheard, the meaning is clear), and the Figma
file Ekotehnika Story (sTaD9o9zLXlwFoj2dMnJkh, page 1).

## What Filip asks for, from the voice over

- A storytelling website for Ekotehnika, the Linde forklift dealer. The first part follows the reel with the truck at
  sunset, except a forklift drives through the company until it stops. Then the second reel, a flip, the forklift on a
  path, side view first, then top view, driving to a warehouse.
- UI with very large type, powerful, modern, simple, a premium feel.
- The forklift sits in the hero by default. A simple but realistic forklift, its wheels turn.
- The forklift stays put on screen while the background moves past with scroll, wheels turning. The scroll stops at
  points that leave open space around it, to fill with company details.
- Then it drives along a path, the view flips smoothly to top down, and it carries its load to a warehouse, with open
  space around for company details. These first screens are about the company and show an outdoor forklift.
- At the warehouse the camera zooms in until the 3D warehouse model fills the screen, the transition to the next
  section, prodaja viljuškara. From here on the animation uses indoor forklifts and the warehouse.
- The warehouse opens, a side view of a forklift moving inside, the camera lowers and runs down the middle of the aisle
  straight at the forklift, which seems to come toward you with scroll. When it is right up close, the camera zooms
  into a black part of it, which reveals the next section.
- That section is dark and reveals a blueprint of the forklift with its wheels turning, the next activity, servis.
  The forklift stays still, only the wheels turn, and lines moving past at the side give the feeling of driving.
- A very large fork across the whole frame lifts with scroll into the next section, najam. It opens on a large number
  of forklifts ready for rent, with text.
- A transition into warehouse automation, small robots carrying boxes and products along paths.
- A simple range of their main products, then a classic footer.

## The beats

One pinned scroll for the story, then the products range and the footer as normal page sections. About 12,000px, the length Filip asked for before.

| # | Section | Scene | Motion | Copy on screen |
|---|---|---|---|---|
| 1 | Hero | Outdoor, the Ekotehnika site, the forklift side on at the right | Still, the hero layout | Kicker, headline, one call to action, from content.ts |
| 2 | Kompanija | The site passes behind the forklift | Background moves, wheels turn, forklift stays | Hero copy leaves |
| 3 | Kompanija, stop | The forklift in front of the Ekotehnika building, load raised | Scroll holds | Company details, a text block and three tiles (Figma frame 20) |
| 4 | Kompanija | The drive continues to the path | Background moves, wheels turn | None |
| 5 | Kompanija | Flip from side view to top down on the S path | Smooth camera flip | None |
| 6 | Kompanija, stop | Top down, the forklift carries its load along the path to the warehouse | Forklift follows the path with scroll | Company details in the open space at left, a block and three tiles (Figma frame 18) |
| 7 | Prodaja | Zoom into the warehouse roof (Figma frame 23) | Camera push | None |
| 8 | Prodaja, stop | The roof gives way to a clean ground, then the 3D warehouse model fills the screen, indoor forklifts at work (Figma frames 24 then 25) | Scroll holds on the text, then the warehouse reveals | Prodaja title, a block and four tiles, then a call to action |
| 9 | Prodaja | The warehouse opens, side view of a forklift inside, the camera lowers and runs down the aisle toward the forklift | Camera dolly, the forklift comes at you | None |
| 10 | Prodaja to Servis | Camera zooms into a black part of the forklift | Push to black | None |
| 11 | Servis, stop | Dark, the forklift as a blueprint, still, wheels turning, the diagonal lines moving past (Figma frame 29) | Wheels and lines only | Servis text, two tiles and a call to action |
| 12 | Servis to Najam | A very large fork across the frame lifts the next section up | Fork lifts with scroll | None |
| 13 | Najam, stop | Many forklifts ready for rent, the grid of fifteen front on, filling row by row (Figma frame 30) | Grid fills with scroll | Najam text, four tiles and a call to action |
| 14 | Najam to Automatizacija | Transition not specified by Filip. Default, the grid of forklifts drops away and the dark floor rises with the dotted paths drawing on it | Scroll | None |
| 15 | Automatizacija | Dark, small robots carry boxes out and bring them back along dotted paths | Robots drive their paths with scroll | Very large automatizacija and a line (Figma frame 31) |
| 16 | Proizvodi | The range of main products in a row | Normal section | Product names |
| 17 | Footer | Classic footer | Normal section | Contacts, address, links |

## How it lands in the three versions

- One story, the same beats in the same order, drawn in each version's style. 2 Linija in its flat vector drawings,
  4 Grad and 5 Sistem in 3D. Filip asked for a simple but realistic forklift, so 4 and 5 use the realistic 3D Linde
  forklift and 2 keeps its drawn forklift, Filip to confirm for 2.
- One shared layer for type, the nav, the text blocks, tiles, products range and footer, so the three only differ in
  their scenes. The hero keeps the bottom left headline layout.
- The Figma images (Linde renders, the building photo, stock photos) are layout references and get drawn in each
  style. Watermarked stock photos are never used.
- Copy only from content.ts, the brief and the competitive analysis, Serbian, sentence case, Geist, red only on calls
  to action and truck shells. New lines are marked dummy for Filip to correct. For the najam number, the site lists
  84 rental models, usable as a line in the najam text, not as the opening visual, which is many forklifts.
- The voice over says the company works across the Balkans. The brief says Serbia and Montenegro, so copy keeps the brief's wording.
- Each service section (prodaja, servis, najam) ends on one linde-red call to action from content.ts, since every visit should end in a quote or a call.

## Open, Filip to confirm

- Polovni is not in the voice over. Default, left out of this story.
- The Figma hero is dark, versions 2 and 4 are light. Default, each version keeps its own ground for the hero.
- Whether 2 Linija should switch to a 3D forklift too.
- Every text block and tile is filled with real claims or marked dummy until Filip gives copy.
