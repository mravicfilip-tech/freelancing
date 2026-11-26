# The blog, plan

Filip 26 November, "add blog, add blog single pages, draft images from drive for blog". Kickoff answered with "go with defaults" to the
hardened version. Task ekotehnika-24 in tasks.md, taste entry 2026-11-26 13:06.

## Answers

1. Content. 4 drafts on topics the old blog never covered, each marked as a draft. Linde Safety Guard, the Vemax racking job, Stapler
   Cup 2025 and service sets. Event and job posts say only what the photos and files show. The price guide and rental wait for the old
   articles, so no 2025 prices go out as current. The old posts come in from a WordPress export or pasted texts, who sends it is open.
2. Addresses. The list at /blog/, each post at the root like the old site, for example /koliko-kosta-novi-viljuskar/. Old posts keep
   their exact address when they come in.
3. Scope. The list page and the post pages, one Blog link in the menu and one in the footer. Nothing else on the site changes, no
   homepage teasers.
4. Pictures. One lead photo and up to 3 in the text per post, from Slike kod klijenata, Slike sa dogadjaja, Safety resenja, Servis i
   rezervni delovi and the firm's own photos. No AI images, no Lionsbot, no posed people, each photo once on a page, event photos wide
   or in action with no close faces. Claude picks, Filip corrects per post.
5. Client OK. The Vemax post goes live only with Vemax's OK through Ekotehnika, who asks is open.
6. Baseline. 4311ffa on claude/awesome-faraday-lkhnn2, live as 49c157e. The two new links are the only change to existing pages.
7. Done. doubles.cjs clean at 1440, 390 and 360, shots at all three with the interaction pass on the pinned contents, Filip looks on
   localhost, then his "push vercel". /uireview stays blocked until Filip pastes "drop ekotehnika-8-grad".
8. Session. Carried on in the same session, this file holds the plan.

## Order, per /newui

1. Draft pictures per post from the Drive, picks listed below.
2. The single post page first, the hardest screen, every state. Filip accepts or corrects it.
3. Then the list page from the same parts, and the two links.

## The post page

- Head on the grid, category and date over the title in frames 1 and 2, lede and reading time in frames 3 and 4.
- Lead photo across four frames with the site's parallax.
- Body in frames 2 and 3. Frame 1 a pinned contents list on posts with 3 or more sections. Frame 4 one card for the matching shop
  category or service with the page's red button, secondary on a phone.
- Photos in the text over three frames, grey captions. Tables in the shop's spec table style.
- Close with QuickAsk on the post's topic, then three related posts, Cap under the last only.
- Phone, one column, contents as a closed "Sadržaj" row at the top, the card after the text.
- States. A post with no pictures yet keeps its head with no lead photo. A long title wraps in even lines. A draft shows a "Nacrt"
  mark in place of its date. An address that is no post stays the homepage, as every unknown address does today, a missing page
  for the root is outside this task.

## Picks from the Drive

Sampled from the Drive index, 68 files viewed on contact sheets, converted to webp in `ekotehnika-hero/public/blog/`. No AI images, no
Lionsbot, no posed people, no close faces at the event.

| Post | Lead | In the text | Source folder |
|---|---|---|---|
| linde-safety-guard | lsg-02, the warning unit with its lit triangle | lsg-12 driver's view of a pedestrian in a vest, lsg-13 the vest, lsg-10 loading paper rolls | SAFETY RESENJA/Linde Safety Guard, Linde's own photos |
| postavka-regala-vemax | vemax-07, Linde stackers in a rack aisle | vemax-11 the empty racks, vemax-14 the second room, vemax-13 the trucks close | SLIKE KOD KLIJENATA/Postavka regala u firmi Vemax, phone photos of 23 August 2025 |
| staplercup-2025 | cup3-04, a truck with a pallet stack on the course | cupn-02 the arena entrance, cup2-05 the course from above, cup3-00 an automated truck | SLIKE SA DOGADJAJA/Stapler Cup 2025 |
| linde-servisni-setovi | set-01, Linde wheel chocks under an E25 | set-00 the service kit | SERVIS I REZERVNI DELOVI/Servisni Setovi |

Left out, lsg-00, lsg-14 and lsg-15 (people posing), cup1-00, cup2-01, cup2-03, cup3-01, cup3-03 and cupn-01 (close faces, the podium
and a team photo), the technicians of set-02 to set-08 (staged stock people). vemax-00 to vemax-03 are near the photo Kompanija already
uses, so the post takes other angles. set-00 is also on Delovi, Kontakt and the Places cards, used once on the post page.

## Facts each draft rests on

- Safety Guard, Linde's flyer "Interactive Warning Vest" (EN, 1019) and the deck "Linde Reverse Assist Radar" (05.2024), both in the
  Safety Guard folder.
- Vemax, only the photos. What Ekotehnika did, the dates and the client's words are for Ekotehnika to add, and Vemax's OK is needed.
- StaplerCup, only the photos and the folder names, three day folders and the arena's sign. Who from Ekotehnika went and whether
  drivers from Serbia competed are for Ekotehnika to add.
- Service sets, only Linde's photos, the kit and the chocks. The kit's contents per model are for Ekotehnika to add.

## Built, screen one

The post page at /linde-safety-guard/, /postavka-regala-vemax/, /staplercup-2025/ and /linde-servisni-setovi/, every state.
- Draft, the Nacrt mark in place of a date and the note of what is missing over the text.
- Long post, 4 sections, the contents pinned in frame 1. Short post, 2 sections, no contents, frame 1 empty.
- A table, the radar's data, wraps on a phone. A cut out on white stays in two frames.
- The card in frame 4 reads a shop category's name, count and capacities from the shop's data, or names a service with its form link.
- The shop's html and body clip their sides instead of hiding them (pages.css), which lets the contents pin. Every other shop page shot
  the same before and after at 1440 and 390.
