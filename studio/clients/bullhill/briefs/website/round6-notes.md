# BullHill website, round 6 notes, hero 7 on phones

Status. Hero 7 is the production hero since 15 October 2026, 07b7e8f. The seam between the hero glow
and the work section is fixed in c08b793, not deployed. The note below waits for Filip's yes on the
structure in words, no code yet. Foundry at `/?v=1`, files in `bullhill-site/src/p1/variants/hero/`.

## Notes

1. Phone hero, full screen and autoplay, "The animation on mobile needs to be redesigned better to
   take way more of the screen like full VH if possible and just add shadows to overlay it and I
   think we dont need to have an on scroll animation on mobile iit can just autoplay itself on load
   like a decent normal speed". Today at 390 the scene is a box of about 330 by 300 between the two
   headline halves, pinned for 200svh and driven by the scroll.

2. Blur the company sign, forwarded from the client chat, "Na ovoj slici ima tabla sa firmom,
   bluruj tablu da ne bi popili kaznu neku", a sign with a company name on it, blur it so nobody
   gets fined. The photo is `restored-wall`, the Business park access card in Projects
   (Seekirchen, Salzburg), where the sign hangs on the wall top left. The same photo is in the
   work section as "Restored strip along the kerb", so the blur goes into the photo files
   themselves, all five sizes in `bullhill-site/public/photos/`, not a CSS overlay. While there,
   check the other six photos for readable company names, signs or number plates.

3. No own machines in the crew section, forwarded from the client, "Nemam svoje masine, tako da bih
   ja ovaj segment izbacio, ovo small crew je ok", I have no machines of my own, so I would take this
   segment out, the small crew is fine. On the crew section at desktop, kicker "Crew and machines",
   title "A small crew with its own machines.", body "BullHill started with one excavator and one
   route. Today the crew runs its own fleet". Keep "a small crew", drop the machines and the fleet.
   Open at plan time, whether "this segment" also means the three crew portraits under it, which
   show an excavator placeholder and "Machine operator".

4. No machines in the numbers block either, forwarded from the client, "Isto i ovde, izbaciti masine
   pa cemo ubaciti kad bude bilo, sad cu ti napisati tacne podatke za ovo gore, kilometre i ostalo",
   same here, take the machines out and we put them back when there are some, the exact figures
   for the numbers above, kilometres and the rest, follow from the client. On the crew matrix, title
   "The numbers, and the machines behind them.", body "the fleet that did the digging", the four
   machine cells under 240 km, 1,900, 38 and 12. Keep the numbers, drop the machine row and the
   machine words, and swap in the client's figures when they arrive. All of them are stand-ins now.

   The own machines claim is wider than these two screens, the client's words apply site wide,
   both languages. Hero lede "Our own crew, our own machines." (`content.ts` 161, 392, live in
   production). About body "a trenching crew with its own excavators" (182). Contractors block
   "with our own machines, our own transport" and the card "Own machines, excavators, trucks and
   compaction gear, no hire delays" (282, 284, 484, 486). Crew title and body and "The fleet"
   (293, 294, 301 to 307, 495, 496, 502). Matrix title and body (`p1/copy.ts` 16, 17, 30, 31).
   The hero 7 scene shows an excavator at work and claims no ownership, so it stays.

5. The client's figures for the numbers block, "8km; 270 house conn; 5 towns; 1 years in ground".
   They replace the stand-ins one for one, 240 km of trench dug to 8 km, 1,900 house connections to
   270, 38 towns and municipalities to 5, 12 years in the ground to 1, with the label in the singular,
   "year in the ground" (`content.ts` 247 to 250 and the German block). Open at plan time, whether
   "1 year" stays on the page, a first year reads as new, not as proven.

6. Where we work, wider, "A lokaciju prosiri na celu nemacku i austriju, belgiju holandiju, cesku,",
   widen the area to all of Germany and Austria, Belgium, the Netherlands, Czechia. The message ends
   on a comma, so the list may go on, ask before building. "Austria and southern Germany" is in nine
   places, both languages. The meta description (`index.html` 7, `content.ts` 124, 355), the contact
   area (155, 386), the hero lede (161, 392, live in production), the Short notice starts card (286,
   488), the FAQ answer on regions (320, 520) and the footer line (342, 542). The Where we work list
   names six regions, Upper Austria, Lower Austria, Vienna, Salzburg, Styria, Bavaria (310, 510), and
   becomes the five countries. The address stays Wels.

7. Two photos of the contractor cards, Weekly progress in bull-red and As built records and One
   site lead in grey (`content.ts` 273 and on). Then Filip, "dont apply the data on the boxes below
   just on the stats boxes where we have those things listed". Read as, the client's figures of note
   5 go into the four stats boxes only, and nothing changes on these cards. No change from this note.

8. Contractors block without our machines, forwarded from the client, "Bez nasih masina", on
   "Extra capacity when the schedule is tight. We join your project as a subcontractor with our own
   machines, our own transport and a crew that knows the work." Already on the site wide list under
   note 4, the body (`content.ts` 282, 484) and the Own machines card beside it (284, 486), which
   goes or gets a new point the client can stand behind.

9. Short notice starts with the wider area, forwarded from the client, "Isto i ovde prosiri
   lokaciju", on the card "Across Austria and southern Germany, when a section needs more hands."
   Already on the list under note 6 (`content.ts` 286, 488), it takes the same country list.

10. Real contact details, forwarded from the client. Phone "+43 665 65942472" ("Ovaj br"), the same
    number for WhatsApp ("Isti br i za whatsup"), email "bullhilldoo@gmail.com". They replace the
    stand-ins `+43 660 000 00 00`, `tel:+436600000000`, `https://wa.me/436600000000` and
    `office@bullhill.at` (`content.ts` 148 to 152, 379 to 383). The phone feeds the header call
    buttons, the menu, the hero and the contact block through `phoneHref`, so one change covers them.
    New values `tel:+4366565942472` and `https://wa.me/4366565942472`. Shown as the client wrote it
    unless Filip wants it grouped.

11. A question from the client, not a change, "I sta treba da ide, sta si zamislio u tim poslednjim
    padaju..." (cut off), what should go in those last drop-downs, what did you have in mind. Read as
    the FAQ accordion, the last expanding rows before the contact block, four stand-in questions on
    fibre laying, metres a day, permits and regions (`content.ts` 315 and on). Filip answers him.

12. The address, forwarded from the client, "Kidričeva ulica 24, 3000 Celje". Celje is in Slovenia,
    and "doo" in the email is the Slovenian d.o.o. It replaces the stand-in "Street and number, 4600
    Wels, Austria" (`content.ts` 154, 385, German "Slowenien"). The footer still carries the stand-in
    Austrian register numbers "FN 000000x · UID ATU00000000" (346, 546), which do not fit a Slovenian
    company. Ask the client for the registration number and the VAT number, SI and eight digits, or
    drop the line until they arrive. Ask too whether Slovenia joins the country list of note 6.

13. No asphalt and no permits, forwarded from the client on the FAQ, "Asfalt ne radimo, al ovo
    ostalo da", "I ove permits(dozvole) to ne radimo", "Ostala pitanja su dobra, ostavi ih". Filip,
    "apply this too". The permits question leaves the FAQ, the surface question becomes paving and
    turf. The same two claims go wherever else the copy made them, the Surface restoration card,
    the Surface layer note, and process step 01, now Survey and marking with "Trench line marked."
    as its third tick. Both languages.

14. More photos to come, "Poslacu ti jos slika na mail, pa ih ti rasporedi, kako mislis da bi bilo
    dobro", I will send more photos by mail, place them as you think best. Waiting for the mail.

15. Slovenia joins the country list, Filip, "Add slovenie as a country we work with as well". It answers
    the question under note 12. Slovenia goes last, after Czechia, in all fifteen places, both languages
    and the meta description, and the Where we work list has six countries.

16. "wont scroll back", a phone photo of a laptop on the Projects row, Town centre rollout and Village
    connection on screen. At 1366 wide the last three cards share the end of the row, so the back arrow
    asked for the end again and the row stuck on 05 / 05. The back arrow now steps from where the row is.

## Round plan, Filip "build" at 13:3x, note 1 "Yes, as proposed"

Live version touched, Foundry at `/?v=1` with hero 7, production at 07b7e8f. Daylight and Underground
read the same `content.ts`, so the facts (phone, email, address, area, figures) change there too.

1. Note 1, the phone hero, by a builder in its own worktree. Hero 7 under 768 only, hero 6 and the
   desktop untouched.
2. Notes 3, 4 and 8, no own machines. The hero lede ends "Our own crew." The crew title becomes "A small
   crew that knows the work.", the body loses the excavator and the fleet. The machine row leaves the
   numbers block, its title becomes "The numbers behind the routes.". The contractors body loses
   "our own machines, our own transport", and the Own machines card becomes "Machines for the ground,
   excavators, trucks and compaction gear matched to each route." The three crew portraits stay.
3. Note 5, the four stats boxes only, 8 km, 270, 5, 1 year.
4. Notes 6 and 9, the area becomes Germany, Austria, Belgium, the Netherlands and Czechia in all nine
   places, Where we work lists the five countries. The list grows when the client sends more.
5. Notes 10 and 12, the phone, WhatsApp, email and the Celje address. The stand-in FN and UID line
   leaves the footer until the client sends the Slovenian numbers.
6. Note 2, the sign in `restored-wall` blurred in all five files, the other six photos checked.
7. Note 11 is Filip's to answer, a draft reply on request.

Defaults Filip can correct after the build, the copy lines in step 2 and dropping the FN and UID line.

## Proposed structure, accepted 13:38

1. The scene fills the first screen, 100svh, edge to edge, behind the header. No pin, the page
   scrolls on into the work section after one screen.
2. A black scrim over the top third holds the headline in one block, "We dig the routes, fibre runs
   through". A black scrim over the bottom 40 percent holds the step label, the lede and Send the
   job. The action sits in the clear middle band.
3. The story plays by itself once the hero is on screen, five steps in about 12 seconds, then holds
   the end frame with the house lit. It pauses when the hero leaves the screen and goes on when it
   comes back.
4. Capable phones run the live scene driven by time. Weaker phones play the 28 frame flipbook,
   re-rendered for the new framing, with each frame fading into the next. Reduced motion shows the
   end frame still.
5. Desktop keeps the scroll driven pin as it is.

This replaces the 2026-10-14 16:30 phone hero structure in the taste log, headline halves around a
picture, once Filip says yes.
