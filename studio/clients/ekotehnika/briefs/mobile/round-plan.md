# Phone version, round plan of 4 November

From Filip's notes 1 to 6 in `notes.md`. The direction stays the one in `plan.md`, the same live story reframed for a tall screen. The hero and
Kompanija are live, everything after them still shows the desktop layout on a phone. Lines 1 and 3 change layout and need their own answer.
"Go" approves the rest.

## Lines

1. **Top row, a layout line.** Note 2 asks for the top row 40 percent smaller. That puts the Linde logo at 96 by 58px, under the 160 by
   96px screen minimum of the LMH co-branding guideline (G p.11) and Filip's app wide ruling of 12 October that the two logos never go under
   it. Default, keep the guideline. The logos stand at their minimum on the first screen only. When the story starts the row slides up and
   away, the scene runs to the top edge, and the bar at the foot keeps the menu, the call and the quote. The logos come back at the top of
   the page and in the footer. That gives every screen after the hero 120px more of scene than a 40 percent row would. The other answer is
   the row 40 percent smaller on every screen, against the guideline.
2. **Every screen redesigned for a tall screen.** Prodaja and its way into the warehouse, Servis with the X50 and the map, the fork, the
   four Najam sub beats and the terms, the dive into the aisle, Automatizacija, and after the story Proizvodi, the closing and the footer.
   The same pattern as the hero and Kompanija, the scene above, the words below on a white sheet that grows to fit, facts in compact rows,
   Prodaja's four ranges as a row of chips. Type and spacing scale with the width between 360 and 430px.
3. **Pure white behind the words, a layout line for desktop.** Note 6. On a phone the sheet becomes pure white with no blur. Default, the
   desktop Najam band follows, pure white with no blur too, though the client's ticket of 3 November asked for a blurred one. The other
   answer is phones only.
4. **A smoother scroll on a phone.** Note 4. Each swipe glides, a soft start and a soft landing, instead of setting off at full speed.
   More stops on a phone, one wherever words arrive or a move ends, so a swipe never carries the story past words still arriving and never
   crosses a whole section. Desktop keeps 6 Lock fast.
5. **A lighter render on a phone, so no frame is dropped.** Skipped animations on a phone are most likely dropped frames. The phone drops
   antialias, draws smaller shadow maps, fewer yard trucks and warehouse loads, and the Kutija loader gets a lighter first set. Measured
   on Filip's iPhone.
6. **The experience, one pick.** The scene owns the screen. After the hero the top row is gone, every swipe is one glided camera move,
   and the words fade in on the white sheet only once the move has landed, so text never rides over a moving scene. A thin rail of the six
   sections stands at the right edge to show where you are. It refuses sound, a tilt to look that iPhone only allows after a permission
   prompt, haptics that iPhone Safari does not have, and any effect that costs frames.

## Open

- Deadline, now, Filip 4 November, "Build all at once deadline is now". The builders were cut to the core of each slice, what is left is listed in their reports.
- Test phones, Filip's iPhone, and one Android to be named.

## How it is built

Four builders in their own worktrees, by slice, no two on one file. Prodaja and the warehouse moves. Servis, the map and the fork. Najam,
the terms, the dive and Automatizacija. The sections after the story with the top row and the white sheet. The main thread takes the
scroll, the stops and the phone render, and merges. Desktop is shot before and after at 1440 and must not move.
