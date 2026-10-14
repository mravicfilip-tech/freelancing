# Hero 7, the excavator, plan and storyboard

Filip, 14 October 2026, 21:2x, "create a new variant of the animation with a excavator ... the on scroll
animation needs to have a proper workflow storyboard to tell like its a part of this brand. Create a
plan, use grill-me to answer your own questions and go from there."

No grill-me skill is installed in this kit, so the grilling below is done in this file, each question
with the answer I took. Filip reads the answers and corrects any line. Hero 6 stays the default at
`/?v=1`. Hero 7 is `/?v=1&hero=7` until Filip picks.

## The idea in one line

The machine turns the plan into ground. Ahead of the excavator the route is still the drawing, the
schematic of hero 6. Behind it the route is real, dug, laid and restored. The seam between plan and
render is the excavator itself, and it moves along the route as you scroll. The BullHill mark is an
excavator, so the hero is the logo at work.

## Storyboard

One tracking shot along one route, a verge beside a village road that ends at a house. Five named
steps, the label on screen the way hero 6 does it, "01 / 05 Mark the route".

| Step | p | Camera | What the scene shows | Words on screen | The one thing a stranger understands |
|---|---|---|---|---|---|
| 1 Mark the route | 0 to 0.15 | Three quarter view from the road side, low, still | The whole route as the schematic, a dashed route line and marker pins draw along it, existing lines under the road show as dashed hairlines. The excavator waits at the start, rendered | Mark the route | They plan the route before a machine moves |
| 2 Dig | 0.15 to 0.45 | Tracks along beside the machine, a slow push in | The arm runs bucket cycles tied to the scroll, cut, lift, swing, dump. The trench opens and the spoil grows as a heap of points beside it. The ground behind the machine turns from drawing to render | Dig | Their own machine opens the trench |
| 3 Lay ducts | 0.45 to 0.6 | Holds, a little higher to look into the trench | A sand bed pours in, then the orange and green ducts unroll along the trench floor | Lay ducts | Empty ducts go into the ground |
| 4 Fibre blown in | 0.6 to 0.75 | Pans along the route to the house | A lit tip runs the orange duct the whole way to the house, strands come out at the chamber | Fibre blown in | The fibre reaches the house |
| 5 Backfill and restore | 0.75 to 1 | Pulls back to show the whole route | The excavator backfills with the spoil, the surface closes, a cut away at the near end keeps the layers and the red warning tape visible, the machine parks, the house lights | Backfill and restore | They leave the street as they found it |

Hardest beat, Dig, because the arm, the trench, the spoil and the moving seam all have to stay in step
with the scroll and still read at 60 frames a second. It is built first.

## Grilled, questions and the answers I took

1. New variant or a replacement for hero 6? New, `hero=7`. Hero 6 stays the default until Filip picks.
2. 3D or flat? 3D in three.js, the same pipeline, materials, ground palette and light as hero 6, so the
   style matches what Filip asked to keep.
3. Where does the excavator come from? Built from primitives in code, tracks, house, cab, boom, stick
   and bucket, each a pivot so the arm can be posed from p. No downloaded model, so there is no licence
   question and the file stays small. Its side profile follows the BullHill mark.
4. What colour is the machine? The specimen's own greys, graphite body, darker tracks, steel bucket.
   No new colour. Red stays where the brand already puts it on the specimen, the warning tape, so the
   brand palette is not improvised.
5. Why five steps and why these? They are BullHill's own process from the site, survey, dig, lay,
   backfill and restore, with Fibre blown in between, since the crew does that too (taste 19:00).
6. Does the camera move? Yes. The lesson in the story skill is that a reference works because the
   camera moves through the scene. One continuous tracking shot, no cuts.
7. How does it stay part of the brand? The plan to render split of hero 6 is kept and given a reason,
   the machine carries it. Type, step labels, ground and red glow are hero 6's.
8. What plays at load, before any scroll? The route line draws in over the schematic, then the
   machine settles with a small idle rock of the house on its tracks. Under two seconds.
9. Phones? Five stills, one per step end, the way hero 6 does it, with only the two stills either
   side of the scroll position on the GPU at a time. No live 3D on phones.
10. Frame budget? One scene render per frame. The plan and render split is done in the materials by
    world position, not by drawing the scene twice. Device pixel ratio capped at 1.5, frames drawn
    only when p changes, static shadows. The spoil and dust are one points draw call.
11. Copy? Headline and lede stay. The five labels are new, Mark the route, Dig, Lay ducts, Fibre blown
    in, Backfill and restore, and German Trasse markieren, Graben, Leerrohre verlegen, Glasfaser
    eingeblasen, Verfüllen und wiederherstellen. Glossary words.
12. What does the end hold? The restored road, the cut away with its layers, the house lit, the machine
    parked. That frame is also the reduced motion still.

## Build order

1. Dig, in one version at 1440, on the real page at `/?v=1&hero=7`. Frames at p 0.15 to 0.45 on one
   sheet. Stop for Filip.
2. After his yes, the other four steps, the phone stills, the labels in both languages, a frame
   budget check, then `/uireview`.
