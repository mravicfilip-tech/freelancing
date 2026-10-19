# BullHill website, round 7 notes, the real projects and no crew portraits

Status. Built in 3f15369 on Filip's "go, both for the portraits", 19 October 2026, not deployed. Production
is at 80b8ba0. The GPS stamps on the client's mailed photos place Admont, Ardning, Gröbming and Haus im
Ennstal in Styria, and a Höhenfeldweg in Haus im Ennstal, so Hohenfeld is likely there. The Haus im Ennstal
card carries IMG_8605 from that mail, stamped Haus im Ennstal, now `street-barriers`.
Foundry at `/?v=1`, the Projects row in `bullhill-site/src/p1/Projects.tsx`, the data in
`bullhill-site/src/shared/content.ts` from line 262 (English) and 466 (German). Daylight and Underground
read the same data.

## Notes

1. Six real places replace the five stand-in projects. The client captioned each card's screenshot with a
   place and a route length, "Admont 1909m" on Backbone route, "Grobming 1330m" on Town centre rollout,
   "Hohenfeld 755m" on Village connection, "Ardning 2197m" on Business park access, "Oberhaus 957m" on
   Cross border link, and then "6 mesta ima", there are six places, the sixth "Haus am Ennstal(791m)".

2. The titles, "E sad ove naslove, ne znam da li da ostanu ti ili da ih promenis. Malo mi nema veze sa
   ovim", now these titles, I don't know whether they stay or you change them, they don't really relate
   to this. The stand-in titles are Backbone route, Town centre rollout, Village connection, Business park
   access and Cross border link.

3. The years, "Grobming, Haus am Ennstal(791m) Oberhaus i Hohenfeld 2026, Admont ardning 2026", then
   corrected, "Admont i Ardning 2025". Gröbming, Haus, Oberhaus and Hohenfeld 2026, Admont and Ardning
   2025.

4. "Ovo "For" izbaci..", take the For row out of every card.

5. "Route stavi u metrima ovim sto sam poslao", the route in metres, as sent in note 1.

6. "scope stavi svugde isto kao na ovoj slici", the scope the same on every card as on the Town centre
   rollout card, "Trench, ducts, house connections".

7. Connections, "Admont 70, Grobming 44, Hohenfeld 25, Oberhaus 32, Ardning 73, Haus am Ennstal 26".

8. "I skloni ono polje gde treba nase slike", and take away the field where our photos should go, on a
   screenshot of the crew section at desktop, the three portrait placeholders under "A small crew that
   knows the work.", each "Name to follow". Round 6 note 3 kept them, this takes them out.

Checks. The six routes add up to 7,939 m, which matches the 8 km in the stats box, and the connections add
up to 270, which matches the 270 there. The stats box says 5 towns and the cards are six places.

## Round plan, hardened 19 October, waiting on Filip's go

Live version touched, Foundry at `/?v=1`, production at 80b8ba0. Daylight and Underground take the same
data. Deadline to be named.

1. Six cards in the client's order, Admont, Gröbming, Hohenfeld, Ardning, Oberhaus, Haus im Ennstal. Rows
   Route, Year, Scope, Connections. The For row goes.
2. Route in metres as the client sent them, written "1909 m". Scope "Trench, ducts, house connections" on
   every card, German "Graben, Rohre, Hausanschlüsse".
3. Years. Admont and Ardning 2025, the other four 2026, from the client's later correction.
4. The place becomes the title, ADMONT. The line under it carries the region, region to be confirmed by
   the client for each place.
5. Gröbming and Haus im Ennstal, the usual spellings, where the client wrote Grobming and Haus am Ennstal.
6. The five cards keep their photos once the client confirms each was taken at that place. Haus im
   Ennstal needs a photo from the client, `road-crew` is already in the work row.
7. The Projects lede becomes "Our routes from 2025 and 2026, trench, ducts and house connections.",
   German to match.
8. Layout, its own answer. The three crew portraits leave Foundry. Daylight keeps them unless Filip says
   both. The people data stays in the file for when real portraits come.

Questions for the client, in one message Filip forwards.
- Is each photo from the place now on its card, and is there one from Haus im Ennstal?
- Which region is Hohenfeld in, and are the other five in Styria?
- The stats box says 5 towns and there are six places, 5 or 6?
- Still open from round 6, the registration and VAT number for the footer, and whether the crew in
  `crew-dusk` may show their faces.
