# Clean up round, Ovallo

Status. Plan only, waiting on Filip's answers to the grill. Nothing built. Baseline Ovallo6, fork main
at `7a18b5b`. Task `ovallo-4`.

## The ask

Filip, 2026-10-15. Clean up the design. Three design directions. rho.co is a reference he likes.
Grill him, then plan a pass on all sections. Replace the planet section in Why Choose Ovallo with
something else, logged REJECTED in the fork's `docs/studio/ukus.md` on 2026-10-15.

## Client feedback

Srdjan Niksic in Slack. "Trenutno izgleda previše Gamified, treba i to malo tone down. Više je
serious, nego što je dizajn power display." In English, it looks too gamified, tone it down, the
brand is more serious than a design power display.

Two phone shots of ovallo4.vercel.app came with it, captioned "Ovako", meaning like this. They show
the Why Choose globe and the bento cards.

`docs/ovallo5-brief.md` in the fork quotes this note from 2026-10-12 and records the globe and the
bento cards as the right direction. Ovallo5 and Ovallo6 were built to answer it. Ovallo6 calmed the
motion and the radius, but kept the treatments below.

## What still reads as gamified in Ovallo6

Seen in shots of the fork at 1440 on 2026-10-15.

| Section | Code | Treatment |
|---|---|---|
| Hero | `src/v/hero/hero.css` | Dashboard set at an angle, `rotateY(-9deg) rotateX(3deg)` |
| Plans | `src/v/plans-b` | 3D cube carrying the plan cards, the client's own pick from 2026-10-09 |
| Bento | `src/v/bento/Bento.tsx` | Terminal caret `>_` in the heading |
| Add funds | `src/v/funds/Funds.tsx` | MOD-01 and status label, a network graph of coin nodes |
| Why Choose | `src/v/arc` | Globe, orbit with MOD-01 and APY labels, green SYSTEM ACTIVE card. Rejected |
| Quote | `src/v/quote` | Ghost cards stacked behind the testimonial |
| Footer CTA | `src/v/footer/Footer.tsx` | Orbit with ticks and coin nodes above the headline |
| Every section | `src/v/v.css` | The OVALLO logo chip above each heading, two tone headings |
| Fixed Income | `src/fi/Alternative.tsx` | Node diagram in "A smarter alternative" |

## rho.co

Shot at 1440 on 2026-10-15.

Borrow
- The product is the picture. Real app screens, flat and straight, on calm cards.
- One tone headings in sentence case, large and light.
- Small uppercase labels in one accent as the only eyebrow.
- A numbered list on hairlines for plain facts, as in their fee list.
- Real people in photos.

Refuse
- The starfield texture and the dotted LOCK IN wordmark. They are decoration, the thing we are removing.
- The mint accent. Ovallo's accent stays lilac, per `docs/studio/brend.md`.

## Three directions

### A. Product first, recommended

The Ovallo app is the picture. Each section shows a flat, straight crop of a real Ovallo screen,
the dashboard, a plan card, the deposit methods, the payouts list. Headlines go one tone. The logo
chip eyebrows become small uppercase labels. Dark and light sections keep alternating, per Coco's
rule.

Refuses orbits, globes, cubes, node graphs, HUD labels and tilted mockups. The thin line drawings
inside the light bento cards stay, because the client named those cards as the right direction.

Why it wins. It is what rho does, and Ovallo6 already has the strongest product screens of any
version. It keeps the most of Ovallo6, so the least can regress. Product screens read as a working
platform, which is what "serious" asks for.

Risk. Every replaced illustration needs a product screen that exists. Where none exists, one is made
from the same parts as the dashboard, never in a new style.

### B. Private bank

Light first, paper backgrounds, large type, hairline rules, and real photography of people and
places. Dark only for the hero and footer. Product screens appear twice at most. It reads like a
wealth manager's site.

Refuses product mockups in every section, dark cards and every diagram.

Risk. It lives or dies on photos, and the site has placeholders today. It also walks away from the
dashboard work Coco approved.

### C. Term sheet

The numbers are the picture. Rates, terms, payout schedules and plan limits set as tables and key
figures on a strict grid, like a fund fact sheet. Almost no imagery.

Refuses photos, illustrations, mockups and any motion beyond reveals.

Risk. Cold for a retail investor, and the strongest asset in Ovallo6, the product screens, mostly
goes away.

### What A takes from the others

From B, real photos in the two places that already hold one, Rewards and Private wealth. From C, the
numbered list for Why Choose.

## Why Choose, the replacement

Proposed in words with one reference, built only after Filip's yes.

The six benefits become a numbered list on hairlines, after rho's fee list. Each row holds a number,
the benefit title and its one line, nothing else. The heading and intro stay. The globe, the orbit,
the logo discs and the green card go. Copy stays verbatim.

Reference. rho.co, the section "Manage company cash with ease, not fees".

## Section plan, direction A

Home first, as the screen the client judges. Fixed Income and Tokenized Bonds follow from the same
parts after Filip accepts home. Rows marked Layout move layout, and each needs its own answer.

| Section | Change | Moves layout |
|---|---|---|
| Nav | Keep | |
| Hero | Dashboard straight, no angle. One tone headline | |
| Plans | Cube replaced by the plan card beside a flat term selector | Layout |
| Bento | Caret removed. Line drawings stay | |
| Add funds | MOD-01 and status label removed. Coin graph replaced by the deposit methods as product rows | Layout |
| Partners | Keep | |
| Rewards | Keep, it is already photo plus product | |
| Why Choose | Numbered list, above | Layout |
| Quote | Ghost cards removed, one flat testimonial card | |
| FAQ | Keep | |
| Footer | Orbit above the CTA removed, type only | Layout |
| Every section | Logo chips become small uppercase labels. Headings go one tone | Layout |

Fixed Income, first read, confirmed with shots before building. Keep the calculators, the rates
list, the dashboard and the photos. Replace the node diagram in "A smarter alternative". Straighten
any angled mockup.

Tokenized Bonds, first read. The line infographics on light cards are the calm style the client
praised, so they stay. Keep the earnings calculator and the articles.

## Versions this round touches

Only the fork branch, built on Ovallo6 at `7a18b5b`. ovallo4, ovallo-five, ovallov2 and
ovallo6.vercel.app are not touched. Nothing deploys while the preview hold stands.

## Order of work

1. Filip answers the grill.
2. Before shots of home at 390 and 1440.
3. Build home only, in a fresh session that reads this brief.
4. Self check, baselint, after shots and a compare.
5. Push. Filip reviews on his localhost with `npm run live`.
6. Filip accepts home. Then Fixed Income and Tokenized Bonds from the same parts.
7. `/uireview` once at round end. A pull request to Milos only after Filip's ship line.

## Grill, with defaults

1. Is Srdjan's note new and about Ovallo6, or the 2026-10-12 note about ovallo4? Default, the old
   note, and Ovallo6 still fails it because of the table above.
2. Which direction? Default, A.
3. Scope verb. Default, licence to redesign each section's visuals, while section order and all copy
   stay, per Coco's rule.
4. The planet. The client pointed at the globe as "Ovako". Default, replace it anyway, with the
   numbered list.
5. The footer CTA orbit. Default, it goes, since it is the same motif as the rejected globe. The
   bento rings stay, since the client praised those cards.
6. The plans cube is the client's own pick from 2026-10-09. Default, replace it, and Coco tells the
   client why.
7. Widths. Default, 390 and 1440, since the brand file names both and the client reviews on a
   phone.
8. Deadline? No default, the thread has none.
9. Done. Default, no open sev 1 from `/uireview` at both widths, and Filip's ship line on the commit.
