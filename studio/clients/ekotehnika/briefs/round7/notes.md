# Round 7, Filip's review of the whole site

Filip recorded an 8 minute review on localhost on 3 November 2026, `?najam=2&feel=4`, and said "do it". The transcript is `filip-review-transcript.txt`, the frames he pointed at are in `refs/`, named by the second of the recording. His closing words, "the rest of the website is okay, just fix up the animations here and the scroll and what I told you".

## The notes, in the order he gave them

| # | Where | What he said | Frame |
|---|---|---|---|
| 1 | Load | "this is taking a while. First the buttons come in, then this, then the whole scenery", "maybe we need like a content loader, like a preloader" | sheet1 0 to 0.36 |
| 2 | All text | "I don't want the text effect to be like this, so it comes down from the bottom word by word", "maybe we just do fade or something more professional", "suggest three, four text animations" | sheet1 |
| 3 | Scroll | "the scroll isn't smooth, it feels like 15 FPS", "if I start scrolling really quick, I'm just holding my scroll wheel down, it's going really fast, even in the version where the scroll is slow", "us skipping content is not what we want" | sheet1 1 to 2 min |
| 4 | Prodaja | "get rid of this cross here on this corner", the plus mark where the tab list meets the frame of the cut out, it runs into "N20 do N25 C" | review-141 |
| 5 | Prodaja into the warehouse | "this corner and everything here is cut, and then this transition here and this scene hole here, unpolished and bad", "we should maybe start something like this, and then the lines are going here" | review-150, 160, 168 |
| 6 | Najam, Dolazak | "this bug here with the truck, it goes left and then it goes right and then it goes through the pole", "move this pole somewhere else or figure it out" | review-205 |
| 7 | Najam, Istovar | "we're not seeing the truck and how this truck loadout happens, so fast, we just kind of skip through the animation" | review-225, 235 |
| 8 | Najam, inside | "it looks like we have things faded and whited" | review-244 |
| 9 | Najam, Skladište | "move these cards to the left side and do it differently" | review-252, 270 |
| 10 | Najam, after 72 | "after we hit 72 months and scroll past, this blank screen, this is just a mistake" | review-280 |
| 11 | Najam, Otprema | "these two trucks hitting each other, why is this truck parked so close" | review-295 |
| 12 | Into Automatizacija | "this squash animation, things are squashed here, we shouldn't squash elements" | review-312 |
| 13 | Automatizacija | the robot's path "should be like a progress bar, the line is already cut where the movement is going to be", "he has a line here in front of him, I don't know why" | review-400, 452 |
| 14 | Into Automatizacija | "we get this level of view, we kind of just cut scene transition here, it doesn't feel smooth, finished, ironed out" | review-480, 488, 318, 330 |

## The work, three builders, one slice each

- **Shell and scroll**, notes 1, 2, 3 and 4. A branded preloader so the scene, the words and the buttons arrive together. Four text animations on the switcher in place of the word by word rise. Stops at every section so holding the wheel can never run past one. Frame rate work and a frame rate readout Filip can turn on. The cross at the Prodaja corner.
- **Prodaja into the warehouse**, note 5. The camera goes from Prodaja into the aisle with no empty roof view, no cut corner and no hole, and the racks and floor lines draw on.
- **Najam and Automatizacija**, notes 6 to 14. The lorry path, a slower Istovar that shows the unloading, no white haze inside, the term cards in the left column, no blank frame after 72, lorries parked apart, no squashing, one smooth move from Najam into Automatizacija, and the robot path as a progress bar.

Rules that carry. Nothing is squashed, sunk or scaled to get it out of the way, the camera frames around it. No frame of the story is ever empty white. Words sit over calm light ground.
