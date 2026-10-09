# Storyline 2, plan, hardened

Source. Filip's screen recording `Storytelling_UI_animacija_za_ekotehniku_compressed.mp4`, 5 minutes with a Serbian
voice over, and the Figma file Ekotehnika Story (sTaD9o9zLXlwFoj2dMnJkh, page 1).

## Gate before any build

The voice over is not transcribed. The session network blocks the speech model download (us.aws.cdn.hf.co,
cdn-lfs.hf.co and cas-bridge.xethub.hf.co are denied). Everything below is read from the video frames and the Figma
frames only, so the build waits for one of these.

- Filip allows those three hosts plus huggingface.co in the environment's network settings, then the voice over is
  transcribed and this plan is checked against it.
- Or Filip writes the voice over's main points in a few lines.
- Or Filip replies that this reading is right and to go.

## Structure, to be confirmed

The Figma page reads as a whole homepage, a hero, then sections of text and tiles with scroll animations between them,
ending in a footer. That is different from today's single pinned hero. Default reading, a long scroll page where each
animation pins only while it plays and the text sections scroll normally in between. Filip to confirm.

## The beats, top to bottom, as read from the frames

| # | Figma frame | Scene | Motion read from the clip |
|---|---|---|---|
| 1 | 101 | Dark hero in the bottom left layout, the Linde forklift lit at the right | Forklift lights up out of the dark (read) |
| 2 | 21 and image 4 | Black and white photo of the Ekotehnika building in Vrčin, the red forklift in front with the green load raised | Photo gives way to a clean white ground, the forklift stays (read) |
| 3 | 20 | White ground, forklift and load, a text line at top left, a text block and three tiles below | Text and tiles rise in (read) |
| 4 | 18 | Top down, the forklift drives along a grey S road toward a grey striped block, text and three tiles at left | Camera tips to top down, the forklift follows the road with scroll (read). The striped block may be a truck trailer roof or a dock, Filip to say |
| 5 | 23 | The striped roof fills the frame | Camera pushes into it as a cut (read) |
| 6 | 24 | White, a title, a large block and four tiles | Content section |
| 7 | 25 | Isometric warehouse with forklifts at work | Reveal (read) |
| 8 | 26 to 28 | Warehouse aisle, the forklift front on, scaled up frame by frame | Scroll zooms into the forklift until the screen is black |
| 9 | 29 | Dark, a blueprint line forklift between two diagonal lines, a text block and two tiles at left | Lines draw, blueprint fades in (read) |
| 10 | 30 | Two stacked bands, a long fork blade across the top, then a grey section with a title and four tiles, then a grid of fifteen front on forklifts | Fork blade wipes the next section in, the grid fills row by row (read) |
| 11 | 31 | Dark, very large automatizacija, Linde C-Matic AGVs on dotted diagonal paths, some carrying a green load | AGVs drive their paths with scroll |
| 12 | 32 | Footer, a lineup of a pallet truck, a reach truck, the forklift, an order picker and an AGV | Lineup slides in (read) |

Green rectangles read as the load and as placeholders for a content card or image. Grey blocks read as text and tile
placeholders.

## Motion references in the clip

The two Instagram reels shown at 21s to 1m00s, mapped where they fit.

- A truck driving at sunset into a yard on a logistics site, the feel for beat 1 and beat 2 (read).
- A line art crane lifting containers, the feel for the blueprint in beat 9 (read).
- A top down road, the feel for beat 4.
- A top down container ship, the feel for the push into the roof in beat 5 (read).

## How it lands in the three versions

- One story, drawn three times, 2 Linija in its vector style, 4 Grad in its 3D city style, 5 Sistem in its dark 3D
  studio style. Same beats in the same order.
- Beat 1 is dark in the Figma file. Default, beat 1 follows each version's own ground, light on 2 and 4, dark on 5,
  Filip to confirm.
- Images in Figma are layout references. Linde product renders and the building photo are drawn in each version's own
  style, not pasted in. Watermarked stock images (alamy, dreamstime, 123RF) are never used. Whether the building stays a
  real photo, Filip to say.
- Red only on primary actions and truck shells, Geist, sentence case, README tokens only.
- Build order default, 2 Linija first, then 4 and 5, since twelve beats in 3D is the expensive part.

## Missing, Filip to add

- Copy for every grey block and tile, and what the green card holds.
- Which sections are which service, Novi, Polovni, Najam, Servis, or whether this story is not about the four services.
- Anything said only in the voice over.
