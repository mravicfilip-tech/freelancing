# The phone version, plan of 4 November

Filip, 4 November, "need to figure out a way to make this website mobile responsive too, now", "let's browse ideas on how to execute
this best". This is the plan in words, nothing is built. It waits for Filip's answers at the foot. Hardened the same day.

## What a phone gets today

Production shot at 390 by 844 in a desktop browser set to a phone's size, six screens, `refs/phone-today.jpg`. Not yet seen on a real phone.

- Every screen breaks. The top row puts both logos, the nav, both phone buttons and the quote button on one 390px line, so they overlap.
- The 1440 grid squeezes into 390px. Words run over the scene and over each other, the Najam facts overlap, and Prodaja's tabs, model and callouts collide.
- The CSS has no phone rule. All 8 width rules are for 1400px and wider.
- The word panes stand at fixed pixel heights made for a 1440 by 900 stage.
- The scroll lock, Stops and Anchors read the wheel and the keys only. Read from the code and not yet tried on a touch screen, a thumb scrolls the page natively, so a flick should run the page ahead while the story follows at 600 to 1300px a second.
- The scene already caps the pixel ratio at 1.25 and drops to 1 when the frame rate sags. It still draws with antialias, soft shadows and every yard truck and load, the same as on desktop. Round 8 measured about 3.2MB before the preloader shows.
- The cameras are framed for a wide screen. Three.js keeps the vertical field of view, so a tall screen loses the sides, and the X50, the building and the warehouse are cut.

## Three ways to do it

| # | Way | What it gives | What it costs | Verdict |
|---|---|---|---|---|
| 1 | The same live 3D story, reframed for a tall screen | One story on every screen, the Prodaja tabs, the map and the terms stay live, one codebase | A tall pose for each of the 15 beats, the four Najam sub beats and the Kutija loader shot, a phone layout for each of the 9 word panes, lighter drawing for phones, the most work of the three | The pick |
| 2 | A film of the story rendered ahead and scrubbed by scroll, as Apple does on its product pages | Smooth on any phone, light on the graphics chip | The whole story as frames is a long download, nothing on it can be tapped, and every change to the desktop story means rendering the film again | Refused |
| 3 | A short phone page, the hero scene, then the sections stacked with still frames from the story | The cheapest and fastest | The story, the thing the site is built around, is gone on the screen most visitors use, and it reads as a second site | Refused as the phone version, kept as the fallback for a phone too weak to draw the scene |

## The pick, the same story reframed, in four layers

1. **Layout.** Chosen by the screen's shape, not its width, so any screen held upright, a phone or a tablet, gets it. Each beat splits the screen. The scene fills the top part and the words stand on a calm sheet under it, the way the frosted Najam band works now. Four fact rows become two by two grids, Prodaja's four tabs become one row of chips that scrolls sideways, and the Servis map takes the full width with the two centres under it. The sections after the story, Proizvodi, the closing and the footer, stack to one column. The top row keeps the two logos side by side at the smallest size Linde's co-branding guideline allows, to be checked in the guideline, with a menu button and the Hitan servis call as an icon. The nav and the Prodaja number move into the menu.
2. **Camera.** Each beat gets a tall pose with the same moves as on desktop, the four Najam sub beats and the Kutija loader shot included. Most pull back or rise so the subject sits in the top part above the words. The beats with no words, the drive, the flip, the zoom into the roof, the fork and the dive into the aisle, get a tall pose too.
3. **Touch.** Anchors on touch, one swipe for one stop, the direction Filip accepted on 3 November, and how people already move through stories and reels on a phone. The page holds still during a trip, and the pin ignores the address bar sliding in and out, so the story does not jump.
4. **Weight.** The 1.25 cap and the frame rate monitor stay. On a phone the scene drops antialias, draws smaller shadow maps and fewer yard trucks and warehouse loads, and the Kutija loader gets a lighter first set. A phone that cannot draw the scene, or keeps falling under the frame rate floor, gets way 3.

Order of work. One beat proven on a real phone first, the hero and Kompanija. That beat shows how long the rest takes, so the size of the job is named after it and not before. Then Prodaja, the hardest pane, then the rest. The camera and scroll code are shared with desktop, so desktop is shot before and after at 1440 on every change and must not move.

## The beats on a phone, a draft for Filip's yes

| Beat | Desktop today | Phone camera | Phone words |
|---|---|---|---|
| Hero | The X50 side on at the right, the street | Pulled back, the X50 centred in the top part | Title, the line and the button on the sheet |
| Kompanija, the building | Stop in front of the building, load raised | Higher, the sign and the truck stacked in frame | Title, text, the three facts as a two by two grid |
| Kompanija, the yard from above | Top down along the path, the yard trucks | The same top down view, turned for a tall frame | Title and text on the sheet |
| Prodaja | The words, then the warehouse model and the product cutout with three callouts | The cutout centred in the top part, one callout at a time | Title, chips for the four ranges, the button |
| Prodaja into the warehouse | The side view runs down the aisle | Lower and closer, the aisle runs up the frame | None |
| Servis | The X50 lit on black, then the Serbia map with its roads | The X50 then the map at full width | Title, text, the two centres stacked |
| Najam | The warehouse story, the lorry, the four facts, then the terms | Each sub beat reframed tall, the lorry and the dock door in the top part | The words on the sheet, the terms as four chips |
| Into the aisle, Automatizacija | The dive through the roof light, then the robots | The same dive, the aisle up the frame | Title, text, the three facts as a list |

## To answer before building

1. **Scope.** The whole site, the story and the sections after it, on any screen held upright, phones and tablets. Default yes, screens held sideways come later.
2. **Reference.** None. Default, this plan is the direction.
3. **Baseline.** Production of 3 November, Kutija and round 9. Default yes, desktop must not move.
4. **Output.** Built in the repo, widths 390 and 360 added to the Widths line of the README, a preview link Filip opens on his own phone. Default yes.
5. **Done.** Every beat readable at 390 and 360 with nothing overlapping, anchors on a swipe, 30 frames a second or better on the test phones, `/uireview` with no open sev 1, and Filip's own phone check. Default yes.
6. **Test phones.** Which phones the frame rate is checked on, at least one iPhone and one mid-range Android. Filip to name them, a cloud session has no real phone.
7. **Deadline.** Not named yet.

The build starts in a fresh session that reads this file, `tasks.md` and the client rules.

## Sources

- GSAP, ScrollTrigger.normalizeScroll and ignoreMobileResize, https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.normalizeScroll()
- GSAP, matchMedia for separate phone and desktop timelines, https://gsap.com/docs/v3/GSAP/gsap.matchMedia()
- Lenis with GSAP and React Three Fiber on phones, syncTouch, a community thread, https://github.com/darkroomengineering/lenis/discussions/431
- three.js forum, keeping a camera framed on a tall screen, https://discourse.threejs.org/t/responsive-renderer-with-limits/4401/16
- CSS Tricks on the Apple product page image sequence, which reportedly swaps to a still image on weak devices, https://css-tricks.com/?p=308477
