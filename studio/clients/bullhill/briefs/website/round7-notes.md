# BullHill website, round 7 notes, the real projects and no crew portraits

Status. Production is at 80b8ba0 since 15 October 2026. These notes were forwarded by Filip on 19 October
2026 as screenshots of the client chat, with no words of his own, so they are queued and wait for his go.
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

## Round plan, waiting on Filip's go

Live version touched, Foundry at `/?v=1`, production at 80b8ba0. Daylight and Underground take the same
data. Deadline not set in the thread.

1. Notes 1, 3 to 7. The Projects row has six cards in the client's order, Admont, Gröbming, Hohenfeld,
   Ardning, Oberhaus, Haus im Ennstal. Rows Route, Year, Scope, Connections, no For. Route in metres,
   "1,909 m" in English and "1.909 m" in German. Scope "Trench, ducts, house connections", German
   "Graben, Rohre, Hausanschlüsse". The five cards keep the photos they have, the sixth gets `road-crew`.
2. Note 2. The place becomes the title, ADMONT, and the line under it reads "Styria, Austria", German
   "Steiermark, Österreich". The stand-in titles go.
3. Spelling. Gröbming and Haus im Ennstal, the official names, where the client wrote Grobming and Haus am
   Ennstal. Hohenfeld is the one place not confirmed as Styria.
4. The Projects lede "A few of the routes from the last three years, from village backbones to town
   centre rollouts." no longer fits. It becomes "Our routes from 2025 and 2026, trench, ducts and house
   connections.", German to match.
5. Layout. Note 8, the three crew portraits leave the crew section, and "A small crew that knows the
   work." is followed straight by "Then we leave the street the way we found it.". The people data stays
   in the file, unused, for when the client sends real portraits.
6. The stats box says 5 towns against six places. Either it stays 5, because Oberhaus counts under Haus,
   or it becomes 6. Ask the client.
