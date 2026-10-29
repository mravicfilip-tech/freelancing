# Round 6 plan

The client's four notes of 29 October, in `client-notes.md`. One live version, v5 Sistem, on production at https://ekotehnika-hero.vercel.app. Baseline is `e7082ba` on `claude/awesome-faraday-lkhnn2`, the build on production since 15 October. Deadline not set yet.

## Lines

1. **Logo on the building.** The company building in Kompanija carries "EKOTEHNIKA" as extruded Daxline caps. It becomes the real wordmark from `public/brand/ekotehnika.svg`, extruded from the file's own paths, letters and tagline in its grey and the mark in LMH red, about the width of today's sign. Touches the drive past and the stop at the building. No layout change.
2. **Service vans.** The four made up vans, three on the street and one at the yard gate, become their VW Caddy in its 2023 wrap from `refs/`. Silver front, the LMH red rear behind a sweep with two grey stripes, the EKOTEHNIKA wordmark and tagline, SERVIS on the sliding door, Linde and Linde Material Handling on the red. The rear doors carry Linde, the white wordmark and www.ekotehnika.rs. Colours from their guideline, never improvised. No layout change.
3. **Najam as one rent story. Layout line, needs its own answer.** Today Najam is a grid of forklifts filling row by row. The client wants a working warehouse, forklifts moving goods while trucks arrive and leave, with the 36, 48, 60 and 72 month terms in it. It runs through `/story`, the beat table below. Nothing gets built for it until Filip says yes to the table, then one beat is built and shown.
4. **Even scroll.** The scene follows the scroll through two smoothings, and the second one runs per frame, so it lags more on a slow machine and less on a fast screen. A quick flick also throws the story through several beats at once. The fix makes that smoothing run on time instead of frames and caps how fast the story can move, so a flick plays the beats at a steady pace. Three feels to try on localhost, `?feel=1`, `?feel=2`, `?feel=3`, from a low cap to a high one, and `?feel=0` for today's feel. Filip answers with a number.

Lines 1, 2 and 4 are built now. Line 3 waits for the table.

## Questions for Filip

- The deadline for this round.
- The rent scope. The default is the Najam part only, retold as one warehouse story. The wider reading, the whole scroll retold around rent, is there if the client meant that.
- The short term rent. Today's line says "od nekoliko sati do godinu dana", from their live site. The default keeps it and adds 36 to 72 months as the long term offer.

## The Najam story, beat table

The fork lifts the page into Najam as today. Najam grows from 1,300px to about 2,400px of scroll, so Automatizacija starts about 1,100px later.

| Beat | Scroll | Camera move | What the scene shows | Words on screen | The one thing a stranger understands |
|---|---|---|---|---|---|
| N1 Dolazak | 600px | High three quarter view over a warehouse with four dock doors, a slow push in | A truck turns in and backs onto dock 1. Inside, the rented forklifts stand at their bays | Najam viljuškara, the lede, the CTA | These are forklifts you rent to run a warehouse |
| N2 Istovar | 600px | Down to the dock at eye level | Two forklifts drive into the truck and bring the pallets out onto the floor | The four facts of today, 24 sata isporuka, besplatna dostava, održavanje, zamena | They deliver the forklifts and look after them |
| N3 Skladište | 700px | Follows one forklift down an aisle, then a reach truck lifts a pallet to the top rack | The pallets go into the racks while other forklifts cross at the aisle ends | Four cells, 36, 48, 60 and 72 meseci, the lit cell moving on as each pallet goes up | You pick a term from 36 to 72 months |
| N4 Otprema | 500px | Up and back to the whole warehouse | A forklift loads the truck at dock 3, it pulls away and the next truck turns in | Zatražite ponudu za najam | The work keeps going, and the forklifts are yours for the term |

Then the floor drops away into Automatizacija as today.

- **Hardest beat.** N3. Several forklifts carry pallets in step with the scroll, the reach truck lifts to the top rack, and the term cells follow the pallets.
- **Reused.** The warehouse and racks from Prodaja, the Linde truck models already in the site, the dark grid and the robots after it.
- **New.** A lorry with a box trailer for the docks, and the four term cells.
- **Copy.** The months are the client's. The other words are today's, from their live site, and stay marked as placeholders where they are.
- **Three ways to answer.** A voice note over the table, marked frames, or a yes.
