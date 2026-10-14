# BullHill website, round 5 notes, motion and phones

Status. Filip said "go" at 16:13 on 14 October 2026 to the whole site motion story, hero 6 as the
default hero, the outline version of the arrow cell for secondary buttons and the 30svh phone pin.
Then one note, below. Foundry at `/?v=1`, files in `bullhill-site/src/p1/`.

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
