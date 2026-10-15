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

7. Two photos of the contractor cards with no words yet, Weekly progress in bull-red and As built
   records and One site lead in grey (`content.ts` 273 and on). Waiting for Filip's note on them.

## Proposed structure, waiting on Filip

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
