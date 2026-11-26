# Polovni, plan

Filip 26 November, "create a new filter for polovni which is used shop produts shop, this will be a standalone shop but access by
filtering, the new filter will show the current products", with a mojauto.rs ad as the example, and "templatize the process when client
adds a link from polovniautomobili that you take as much info as you can for our product template and ask client questions". Kickoff
hardened, answered with "go". Task ekotehnika-26.

## Answers

1. Built in the prototype first, it reaches the demo repo as a branch the client merges, never as a copy over his edits.
2. A Novi and Polovni switch at the top of Prodavnica and its list pages. Polovni has its own list at /prodavnica/polovni and a page per
   machine. The menu's Polovni link switches from ekotehnika.rs to the list once a confirmed machine is on sale (usedLive.ts).
3. Everything Ekotehnika sells used. Forklifts in the shop's own categories, other machines in a group of their own, Ostale mašine
   until Filip names it.
4. The price when the client gives one, Cena na upit otherwise, in euros. PDV is asked per machine, sa or bez, since nobody has said.
5. Only Ekotehnika's own ads, the skill asks first.
6. Original photos first, the portal's marked photos only when there are none.
7. The template is the skill polovni-oglas, it reads, fills, asks once, then adds, builds and shows. A page that refuses the reading
   gets the paste fallback.
8. Sold leaves the list, its page stays with a Prodato mark.
9. The client needs a GitHub account, a Claude plan with Claude Code, and mojauto.rs and its image host allowed in his Claude
   environment.

## What the example ad gives

The reader (scripts/polovni-oglas.mjs) on the mojauto.rs ad of a John Deere 6120 M 4x4 found the title, the kind (Poljoprivredne
mašine), the brand, year 2020, 2942 working hours from the description, price Dogovor, 6 spec pairs, 5 history pairs, the equipment, 39
description lines and 19 photos at 800 by 600, each with the mojauto mark. polovniautomobili.com answered 403.

## Built, screen one

- The switch, two cells of the site's segmented control over frames 1 and 2, at the top of the shop's home, Svi modeli and every
  category. Novi 89, Polovni with the count of machines on sale.
- The list, the shop's list head, chips by kind once two kinds are on sale, the shop's cards with photo, kind, title, year, hours,
  price and the inquiry button, an empty state with the way to the new models and the sales number.
- A machine's page, laid out as the model page. The gallery of photos beside the kind, the title, the price with PDV, the year and the
  hours, the red Zatražite ponudu with the topic filled in and the sales number. Then the data table and the equipment, then the other
  used machines. A sample shows a Primer mark and a line saying it is not an offer, a sold machine a Prodato mark and no inquiry.
- One sample, the John Deere from the example ad, status primer, not confirmed, six of its photos with the portal's mark. It must go
  before production unless Ekotehnika confirms the ad is theirs.
- The skill .claude/skills/polovni-oglas/SKILL.md in the app's folder, copied into the demo repo with the pages.
