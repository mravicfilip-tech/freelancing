# BullHill website, round 5 notes, motion and phones

Status. Filip said "go" at 16:13 on 14 October 2026 to the whole site motion story, hero 6 as the
default hero, the outline version of the arrow cell for secondary buttons and the 30svh phone pin.
Then the notes below. Filip said "build go go" at 16:30 to notes 2 to 4, the phone hero and the
phone structure, and the client sees only hero 6. In build. Foundry at `/?v=1`, files in
`bullhill-site/src/p1/`.

## Notes

1. Phones too dense, "We need to clean up mobile a lot - its too dense information wise and remove
   those pointing boxes, make it a clean design", on the phone frames of hero 6 beat 4.
   - Done at once, since he named them. The six layer tags and their leader lines are off the phone
     hero, Hero6.tsx, `tags` false on the tall view.
   - The rest is a structure change on phones, so it goes to Filip as one argued structure in words
     first, below. At 390 the page measured 19,946px, 23.6 screens of 844.

2. Header buttons on phones, queued while the button, hero and process builders run. "should be white
   stroke with like 6% white opacity and 6% border and 100% white text with 2 line burger menu icon
   thats modern", on the phone header's phone icon and MENU buttons. Read as a fill of white at 6
   percent, a 1px border of white at 6 percent, the label in white at full strength, and MENU gets a
   two line burger icon in place of the arrow cell. Narrow reading, those two phone header buttons.
   The wider reading, the desktop header Call us and the menu sheet buttons, waits on Filip. It lands
   on the button slice's files (`Header.tsx`, `slab.css`), so it is planned after that slice reports.

3. Hero "Send the job" in bull-red, queued while builders run. "should be primary red color", on the
   second hero button, Send the job, on the phone frames of hero 6. Read as Send the job becoming the
   hero's one primary action in the bull-red fill the form submit already uses, white label, and Call
   us stepping down to the outline secondary, so the hero keeps one primary. This turns over the 16:13
   default that made Call us the solid one. Narrow reading, the hero only. The wider reading, every
   Send the job button on the page in red, waits on Filip. It lands in `Hero6.tsx`, owned by the hero
   builder now, so it is planned after that slice reports.

4. Phone hero after worldquantfoundry's phone hero, queued while builders run. "a structure something
   like this for mobile would be dope", with a shot of worldquantfoundry.com at phone width,
   `round5-refs/wqf-phone-hero.png`. Read as the phone hero only, the rest of the phone structure
   below still waits on his yes. It meets notes 2 and 3, so all three are planned together.

5. Hero scroll out is dull. "the hero animation scroll should be more exciting with some particles dots
   going on and etc on scroll and something happening right now its just model moving its dull".
   Logged REJECTED in taste.md 16:39. Builders are running, so no code. The redraw is proposed in
   words below, with one reference, and built after Filip's yes and after the hero builder reports.

## Hero scroll out, redraw proposed

Why it is dull. The scroll moves the camera 12 percent and slides a line. Nothing happens to the
ground, so there is no event to watch.

The pick, dig, lay, restore. The scroll tells BullHill's job on the block itself, in three acts across
a longer pin, 120svh on desktop. Reference, worldquantfoundry's hero, where scattered dots fly in and
assemble into the form. Here the dots are the ground's own material.
- Dig, p 0 to 0.35. A trench opens along the duct line. The surface, base and backfill above the ducts
  break into particles in their own colours, asphalt dark, gravel grey, soil brown, and lift into a
  slow cloud above the block, so the cut shows in section.
- Lay, p 0.35 to 0.65. The ducts slide in along the trench from the far end, green and orange. Light
  runs through them and out of the open ends as a stream of bright points, the fibre that comes later.
- Restore, p 0.65 to 1. The cloud falls back in layer order, sand, backfill, tape, base, surface, and
  settles flat. The seam sweeps left with the falling ground, so what settles is the real render, plan
  into finished route. The headline moves up and the work photos rise, as now.
- Phones keep the stills, no WebGL. A light 2D canvas of the same particles plays over the still pair,
  the dig cloud lifting and falling, at about 600 points.
- Reduced motion and automated shots get the settled block, as now.

Refused, and why.
- A starfield or dust floating over the hero with no job. It reads generated, the closing dots were
  called AI slop for the same reason.
- A faster or wider camera move. More camera is still only a camera.

6. Process steps, three ticks in place of the CTA, queued while builders run. "we dont have these pages
   yet, they should be 3 ticks not CTAs - apply this on this whole sections blocks here", on step 01
   in German with its "Mehr erfahren" button circled. All four step rows lose the Know more button
   (`step__btn` in `Process.tsx`, `knowMore` in `copy-process.ts`) and get three ticks. No copy for
   ticks exists, so the draft takes the three facts each step's own sentence already states, no new
   claims. Lands in the process builder's files, planned after it reports. The wider reading, the
   project cards' View project buttons, which point at no page either, waits on Filip.

   | Step | English ticks | German ticks |
   |---|---|---|
   | 01 | Route walked. Existing lines marked. Road permits sorted | Trasse abgegangen. Bestehende Leitungen markiert. Genehmigungen geklärt |
   | 02 | Trench to plan depth. Section by section. Street kept passable | Graben auf Plantiefe. Abschnitt für Abschnitt. Straße bleibt befahrbar |
   | 03 | Ducts on a sand bed. Chambers set. Warning tape above | Rohre im Sandbett. Schächte gesetzt. Warnband darüber |
   | 04 | Trench compacted. Surface put back. Ready for cable | Graben verdichtet. Oberfläche wiederhergestellt. Bereit für das Kabel |

   Since the ticks repeat the sentence above them, the default drops the sentence and each step reads
   number, title, three ticks. That changes the step layout, so it is its own line for Filip.

7. Work card captions, one size. "text should be indentical size (smaller) not 1 big, 1 small here", on
   the work row's caption line. The number `.wk__n` in `r3-work.css` is mono 24px over a caption of
   16px on phones and 18px from 768. The number takes the caption's size and line height, so both read
   16px and 18px. The 48 and 56px number column stays, so the caption text does not move. No running
   builder owns `r3-work.css`, so it can go in at once on a "do this now". Done on his "do this now".

8. Who we are, headline on the paragraph's top line. "somehow doesn't look right here - shouldn't
   headline be in top alignment with paragraph?", on the services intro at desktop width. From 1200,
   `.eth__top` in `foundry.css` sets `align-items: end` with `min-height: 360px`, so the kicker and
   headline sit on the bottom of the right column and the headline lands level with the Meet the crew
   button. Worldquantfoundry's ethos panel, the reference, puts the kicker level with the hairline and
   the headline's top on the paragraph's first line. Fix, `align-items: start`, the kicker on the
   hairline, the headline's cap top on the paragraph's first line, the min height kept so nothing below
   moves. `foundry.css` is the phone builder's now, so it goes in after that slice reports. Done on
   his "do this now", the kicker gap 12px at 1200 and up puts the cap tops within 1px.

9. Phone hero needs air. "To cramped we need better spacing overall here - its fighting for air", on
   the phone hero frames. Measured at 390 by 844, `round5-refs/phone-hero-before-air.png`. Header 0
   to 68, first half 92 to 188, the block's box 87 to 660 behind both halves, second half 535 to 631,
   hairline 655, lede 672 to 752, button 776 to 820, 24px to the screen's foot. Every gap is 17 to
   24px because everything is held to one 844px screen. Worldquantfoundry's phone hero leaves about
   125px above its first half and 170px between the second half and its hairline.

   Proposed. The phone hero runs 1.25 screens, about 1056px, and the gaps go up on the 8px scale.
   Header to first half 64. The block between the halves, 48 clear of each. Second half to hairline 64.
   Hairline to lede 24. Lede to button 32. Button to the foot 48. The first screen then holds the two
   halves and the block with air, the lede and Send the job sit just under the fold, and the header's
   phone button stays in view the whole time. The 30svh pin moves to the block only. The hero files
   belong to the dig, lay, restore session now, so it is built after that branch merges.
   Filip said "yes go with 1.25 screens" at 17:17.
   Then at 17:18, "no not everything should go 1.25 screens it should be in one block - shrink down the
   rest of the elements to make this fit". So one 844px screen. Headline halves 48 to 40px, the block
   to about 85 percent clear of both halves, gaps of 24 to 40px, lede and button unchanged in size.

## Phone hero, proposed after the reference

What the reference does. The wordmark top left and one square menu button top right. The headline in
two halves, "Forging companies that" high on the left and "Pull the future forward" lower and right
aligned, with the dot sphere large behind and between them, running off the right edge. At the foot a
hairline, a mono paragraph, one bracket button bottom left and the mark bottom right. One screen,
nothing else.

BullHill on phones.
- Header. Full logo left, the phone icon and MENU right in note 2's ghost style, MENU with the two line
  burger. Refused from the reference, the single button, because a call is BullHill's fastest lead on a
  phone.
- Headline in two halves. "We dig the routes" high on the left, "Fibre runs through" lower and right
  aligned.
- The specimen sits large between and behind the halves, its right end running off the screen edge the
  way the sphere does. No seam line and no tags. The render still takes over the schematic with the
  scroll, as beat 4 does now.
- Foot. A hairline, the mono lede, then one button bottom left, Send the job in bull-red (note 3). Call
  us leaves the phone hero, the header phone icon does that job.
- Refused from the reference, the mark alone bottom right. The taste log rules the full logo or nothing,
  so the corner stays empty.
- The BH 001 card goes on phones. The hero fills one screen, 844px, plus the 30svh pin.
- The tall still is likely re-rendered for the larger block, so it stays sharp at 3x.

## Phone structure, proposed

| Section | Now at 390 | Proposed on phones | Screens after |
|---|---|---|---|
| Hero | 1.6 screens, seam tags, BH 001 card | Seam line and its two tags go, the BH 001 card goes | 1.3 |
| Work | 1.2 | As now | 1.2 |
| Services | 3.1, four cards each with dot art and a paragraph | Cards lose their dot art and become rows, number, title and one line | 1.4 |
| Process | 4.7, drawing with numbered badges, a six row legend, four steps | The badges go, the legend stays as the key under the drawing in one column, step photos at 4 by 3 | 3.2 |
| Projects | 1.4 | As now | 1.4 |
| Crew | 2.8, a photo strip and the machine grid with notes | The machine grid becomes two columns of name and count, no notes | 1.8 |
| Audiences | 3.7, three blocks of text and cards and the wave | One block, three rows of title and one line, the wave goes | 1.3 |
| FAQ | 1.0 | As now | 1.0 |
| Contact | 2.3 | The call block moves above the form, the fields stay | 2.3 |
| Closing | 2.0, nav links, photo and legal | The nav links go, the menu has them | 1.3 |

About 16 screens, a third shorter. Desktop does not change.
