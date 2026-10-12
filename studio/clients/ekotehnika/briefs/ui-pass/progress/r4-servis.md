# Round 4 servis branch, item 15 per Q10

Branch `claude/awesome-faraday-lkhnn2-servis`, from a17a1c3. One file changed, `ekotehnika-hero/src/story2/scenes/sistem/schematic.tsx`. `bake.ts` needed no change.

## What changed on S

- The hidden line drawing is gone. The real X50 stands lit in the scene on the dark ground #0b0b0b, from the same GLB the hero forklift uses, so it adds no bytes.
- It keeps its own Linde parts, with real tyres with tread on grey rims and hubs. The wheels turn with the story clock by the same rule as before, so `?at=S&k=` always draws the same picture.
- The shell is #a00020. Every other part is an LMH grey (graphite #4d4d4d, light #d2d2d2, pale #e9e9e9, mid #a1a1a1) or the model's own near black. The colours sit on copies of the materials, so the hero truck is untouched. The small yellow part on the model is now mid grey.
- The light is low key and reads on dark. The studio environment runs at 80 percent, turned 1.2 rad, which gives a soft top light from the front left and a bright strip along the far edges. No lights were added, so no shader on other beats recompiles. The key light of camera.tsx casts the truck's shadow on the floor, and a black contact shadow sits under it.
- One outline on the silhouette only, 2px white at 90 percent. It comes from a white mask of the whole truck drawn each frame and one pass that lights the pixels just outside it. An inner edge can never be drawn, unlike a per mesh inverted hull, where the mast's rim would show over the body.
- The floor is a 0.5m grid at 8 percent white, the same weight as before, now even over the whole visible floor, edge to edge, with no radial falloff.
- The dashed centre lines are gone. Each one crossed two grid verticals.
- Three dimension lines with real X50 / 600 figures from data sheet DS_X35_X50_1254. Lines and arrows are #a1a1a1, figures 15px #e9e9e9 at every width.
  - Y 2120, the wheelbase, on the floor beside the near tyres, in the cell between x3 and x4.
  - H1 2523, the mast lowered, standing on the floor ahead of the forks, in the cell between x4 and x5.
  - C 600 and Q 4990 KG, beside the near fork, in that same cell.
- Projected against the page grid, each dimension stays inside one cell and inside the rows at 1440, 1536, 1680, 1920 and 2560 wide. The tightest gap is the front end of Y at 1440, 9px left of x4. Nothing reaches the stage edge.
- L1 4373, L2 3173 and H6 2495 are dropped. With the camera framing of camera.tsx, L1 and L2 have to cross x3 and x4 because the truck itself does. H6 has no free cell, and beside H1 it repeats almost the same height.
- Nothing fades. The truck is whole from u 9.95 under the black shutter of B. The dimension lines draw on from their first point over u 10.2 to 10.5, the figures appear at 60 percent of the draw, and the arrowheads appear at its end. It is all gone by u 11.9, as before.
- Load work. Nothing of S is built on page load. The stage is put together at u 8.5 in B, and its shaders are compiled while it is still hidden, so the first S frame does not stall. The old stage ran a full edge bake of the X50 at page load.

## Shots

`r4-servis-before-<width>-k<k>.webp` and `r4-servis-after-<width>-k<k>.webp`, at 1920 by 1080 and 1440 by 900, k 0.2, 0.5 and 0.8. At k 0.2 the dimension lines have only just started to draw.
`r4-servis-scroll-*.webp` are the real scroll pass on the final build, BASE preview, FROM 7400, TO 9700, step 200.

## Scroll pass

The final build flags one item, y 9551, top row dark over a light ground, on the L light ground. The before build flags the same thing at y 9523, so it is not from this branch. Nothing of S shows in L. The tine and its white ground cover the stage, then the stage is hidden.
One earlier build of mine also flagged y 8674 at the B to S edge, a one frame race between the top row tone and the canvas. After the shaders moved to compile ahead in B, the flag went away.

## Load budget

Run with `scripts/loadbudget.mjs`, the before build (a17a1c3) and the after build each served by `vite preview`, run alternately on this container.

- Bytes are unchanged. 10.93MB on load, 11.4MB after a full scroll, before and after. 0MB of the 0.4MB slice is used.
- First frame on the final build, the first three pairs alternating, before 7822, 10135, 7567, median 7822ms. After 10113, 9746, 7828, median 9746ms.
- Five more pairs on the same builds, before 9421, 9395, 9982, 9339, 11105, median 9421ms. After 8113, 9558, 8928, 9715, 8965, median 8965ms.
- All eight per side, before median 9408ms, after median 9261ms.
- Software GL on this container spreads one build's first frame from 7567 to 11105ms, so any three run median swings by more than a second. Earlier builds of mine also came out under, then over, then under. The final build does less on page load than the before build, since the edge bake is gone and S builds only in B. I read the after build as no later. The first three pair median taken alone is over, so the parent should measure again on its own container before merging.

## Outside my files

No change is needed in camera.tsx, kit.ts, route.ts, models.tsx, overlay.tsx or the shell.
- `index.tsx`, in the header comment, still describes "a precise side elevation schematic of the X50". It should now say the lit X50 with its silhouette outline and dimension lines.
- The hero truck in `models.tsx` uses the GLB's own red, about #a50216, and not #a00020. Only S sets the shell to #a00020. If the 19.45 red ruling covers the hero too, the shell red should be set in `tune()` in models.tsx.
- `kit.ts` keeps the comment "The servis schematic keeps the dark ground". That is still true and needs no change.

## Questions for Filip

- Is it right to drop L1, L2 and H6 so every dimension stays in one cell? The other way is to move the truck on screen, and that is camera.tsx, owned by the parent session.
