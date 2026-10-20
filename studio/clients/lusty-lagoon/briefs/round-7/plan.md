# Round 7 plan, lusty-lagoon

From `notes.md` in this folder, 20 notes on commit d46bb64. Variants touched are named per line.
Lines A to F are built now on Filip's "build". Lines G, H and J redraw rejected art, a rejected
section and rejected cards, so per the doctrine they are proposed in words with one reference and built only after
Filip's yes. Line I is a width question.

## Built now

A. Variant 5 chrome, notes 12 to 15, 17. Builder on the v5 folder.
   - Ground back to the round 5 dark, `--gv-ground` 7 6 11. Every panel keeps a visible purple fill.
     The purple lights behind the page stay, soft. No yellow.
   - The ember light drops 25 percent in opacity.
   - Shadows. One per panel at most, blur 32px or more at 30 percent black or less. Keys, chips and
     the giveaway band carry none at rest.
   - The giveaway glow is redrawn as one soft purple and orange light inside the band, with no spill
     under it.
   - The picked method chip shows its check inside the chip's own space (a ring plus a small check
     where the label never runs), so no label is covered at any width.
   - The balance card art is left as is until line G is answered.
B. Variant 1 type and search, notes 2 to 4. Builder on the v1 folder.
   - One heading style across hero, tiles and section titles, Bai Jamjuree 700 in sentence case.
     "Where luck meets lust." The tile titles keep their size.
   - Search for games and Sort by move down into the filter chip row, right aligned.
   - Hero headline, line and key share one left edge; tile titles and section titles share one inset.
   - The hero woman is left as is until line G is answered.
C. Hover board, notes 10, 11, 16. Main thread, shared CSS in the kit, each variant's primaries and
   icon buttons opt in. Four primary hovers, live on every variant by `?hover=1` to `?hover=4`.
   1. Sheen. A light band sweeps across the key once, the key lifts 2px.
   2. Pulse. Orange rings ripple out from the key twice, the key grows 3 percent, its icon nudges.
   3. Marquee. A light chases around the key's edge like casino bulbs, the key brightens.
   4. Coins. Sparks pop off the key's top edge and fall, the key bounces.
   Icon buttons get one set, the bell rings, the trophy lifts and glints, the plus turns 90 degrees,
   arrows nudge. Reduced motion falls back to a colour change. Default shown until Filip picks, 1.
D. Chest motion, note 18. In the variant 5 builder. Four treatments by `?chest=1` to `?chest=4`.
   1. Float, a slow bob with a breathing light under it.
   2. Rattle, a short shake every few seconds with a flash at the lid seam.
   3. Sparks, small orange and purple sparks rise from the lid.
   4. Rays, soft light rays turn slowly behind it.
E. Scrollbars, note 19. Main thread. Thin rounded purple thumb on a clear track, brighter on hover,
   for the page and every scroll panel in the three variants.
F. Every builder checks at 1440, 1920 and 2560.

## Proposed, built after Filip's yes

G, H, J and I approved 2026-10-20 09:16 with "do these suggestions". G, H and J build in parallel in three folders on one
shared recipe, `art-recipe.md`, so the variant 5 test arrives with the other two, not before them.

G. Art that sits in the scene, notes 1, 6 and 20. Variants 1, 2 and 5.
   Reference, Filip's own Figma landing hero, the woman on the lagoon beach between the flower
   pillars, which is the product's own scene (`landing/hero-beach.webp`).
   - Each woman stands inside one of the brand's illustrated scenes from `public/art`, not on a
     gradient or a pattern. Variant 5's card takes the lagoon sunset (`lobby/hero-sunset.webp`),
     variant 1's hero the night casino courtyard with palms (`landing/casino-courtyard.webp`),
     variant 2's hero the lagoon cove (`landing/hero-beach.webp`).
   - She is graded into the scene, purple shadows and the scene's warm light on her edge, a soft
     contact shadow where she stands, a palm leaf or a pillar overlapping her edge in front, the
     scene softly out of focus behind her, a vignette into the panel's purple.
   - The spiral pattern leaves the balance card and moves to the giveaway band, so it stays on the
     page.
   - Variant 5's card is built first as the test, then the same recipe goes to variants 1 and 2.
H. Variant 2 hero redrawn, notes 5 to 7 and 9.
   Reference, Snegbet's tournament hero (accepted 18:10), where prize, timer and action sit in one
   framed block.
   - The scene runs edge to edge and the art takes the right 55 percent at every width, so no empty
     third at 2560. The chest stands on the sand in front of her legs, lit by the same light.
   - Left, the eyebrow, the headline and one line. Under them one glass bar holds Prize pool, the
     live Draw in countdown and Entries, with Join the giveaway at its right end. How it works
     becomes a text link.
   - Everything below the cards stays.
J. Category cards redrawn, note 21 (widens note 8). Variant 1's four tiles and variant 2's six
   Lagoon originals.
   Reference, Betsera's Originals row (accepted 18:10), read for what ours lack. Portrait cards, the
   art fills about 70 percent of the card and is lit from below, the hue darkens toward the bottom.
   - Today's fault. A flat single hue slab with a small sticker of art and a large empty middle.
   - The face goes dark purple. The category hue comes in as light, a glow behind and under the art,
     a tint at the top, so six hues sit together without shouting.
   - The art is the card. It stands about 120 percent of the card height, breaks out of the top edge,
     sits on a lit floor with a contact shadow and a hue rim light.
   - The title in the variant's heading style, all the same size, with the live count under it as
     one line ("642 playing"), not a floating chip.
   - Hover, the art lifts 6px and grows 4 percent, the glow brightens, an arrow slides in.
   - Variant 1 keeps four cards in one row, variant 2 six, both portrait at 3 to 4.

## Question

I. Filip's browser renders the page at about 2560 wide. 2560 joins the Widths line in the client
   README, default yes. Builders already check it.
