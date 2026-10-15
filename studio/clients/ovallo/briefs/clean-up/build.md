# Build brief, clean up round, Ovallo

For the three direction builders. Filip asked for all three directions built, then a switcher to
compare them. Read this whole file first, then `brief.md` beside it, then in your worktree
`docs/studio/brend.md`, `docs/studio/ukus.md`, `docs/ovallo6-brief.md` and `docs/ovallo5-brief.md`.

Baseline is Ovallo6, the home page in `src/App.tsx`. It must stay exactly as it is. Your direction
shows at `/?dir=<letter>`, through `src/dir/DirSwitch.tsx`, which the main thread owns.

## Your job

Build the whole home page in your direction, every section in the Ovallo6 order. Nav, hero, plans,
bento, add funds, partners, rewards, why choose, quote, FAQ and footer.

- Same copy, word for word. Take every string from the Ovallo6 components in `src/v/` and from
  `src/data/plans.ts`. Never invent copy, numbers, names or labels. A string goes only when your
  direction removes the element that held it, such as MOD-01.
- Desktop 1440 and phone 390. No horizontal scroll at 390.
- Real interaction where Ovallo6 has it. The term selector, the deposit tabs, the testimonial
  carousel and the FAQ accordion keep working, with the keyboard too.

## Isolation, so three builders never collide

- Touch only `src/dir/<letter>/` and `public/dir/<letter>/`. Everything else is read only.
- Import an Ovallo6 section or component as it is when your direction keeps it unchanged. To change
  one, copy it into your folder and change the copy.
- All CSS is bundled for every page and every direction. Every selector you write starts with your
  root class `.d<letter>-root` or your prefix `d<letter>-`. No top level element selectors, no
  `:root`, no `body`, and no rule on an Ovallo6 class unless it sits under `.d<letter>-root`.
- Your entry is `src/dir/<letter>/Home<LETTER>.tsx`. Its outer element carries `d<letter>-root`.

## Brand, as Ovallo6 has it

- Colours from `src/styles/tokens.css` only. Derived colours with `color-mix(in oklab, ...)`. No new
  hex, no white or black keywords. No outer glow and no coloured blurred shadow.
- Fonts as `tokens.css` sets them now. `--font` (Aeonik) for headings, labels, numbers, buttons and
  nav. `--font-body` (Geist) for paragraphs. `--font-logo` only for the Ovallo wordmark. Older
  `ukus.md` entries that name Linear Grotesk or Onest describe Ovallo4, and Ovallo6 overrules them.
- Radius per `docs/ovallo6-brief.md`. Controls `--r-pill`, small tags `--r-tag`, cards `--r-card`,
  large panels `--r-xl`. `50%` only for dots, small markers and avatars.
- Motion per the keep and remove lists in `docs/ovallo6-brief.md`. `prefers-reduced-motion` turns it
  all off and still shows every piece of content.
- The site has dark and light sections, per Coco. Lilac is the one accent. Sage only for positive
  figures and status dots.
- Headings go one tone. No muted second line in a different colour.
- Eyebrows are small uppercase labels, Aeonik 500, 12 to 13px, letter spacing 0.06 to 0.08em. No
  OVALLO logo chip above headings.

## Taste rules that still hold

- Every REJECTED entry in `ukus.md` is a rule. Plan cards never repeat the Varntix layout of three
  equal cards with the same block order (2026-10-08 21:40). The hero has no floating cards
  (2026-10-08 22:40). Why Choose has no planet or globe (2026-10-15).
- Older ACCEPTED entries describe Ovallo4. Where your direction conflicts with one, your direction
  wins. Name each such entry in your report.

## Refused in every direction

Orbits, globes, rings around the logo, node and network graphs, 3D cubes, tilted or angled mockups,
HUD labels such as MOD-01 and SYSTEM ACTIVE, the terminal caret `>_`, ghost cards stacked behind a
card, the logo chip eyebrow and two tone headings. Direction A alone keeps the thin line drawings
inside the light bento cards, because the client praised those cards.

## Direction A, Product first, prefix `da-`, worktree `/home/user/ovallo-direction-a`, port 5191

The Ovallo app is the picture, as on rho.co. Flat, straight product crops on calm surfaces, at most
one per section. Build new product crops from the same parts as the Ovallo6 dashboard, never in a
new style.

| Section | What to build |
|---|---|
| Nav | Keep the Ovallo6 nav |
| Hero | Ovallo6 copy and both CTAs. The dashboard straight, no rotate. It may bleed off the right edge or overlap into the next section the way rho's hero screen does |
| Plans | The plan card from `src/v/plans-b` beside a flat term selector for 6, 12 and 24 months. No cube |
| Bento | Keep the light bento cards and their line drawings. Remove the caret |
| Add funds | Remove MOD-01 and the status label. Replace the coin graph with the deposit methods as one flat product panel, rows from the Funds copy |
| Partners | Keep |
| Rewards | Keep the photo and the rewards card |
| Why choose | Heading and intro kept. Six benefits as a numbered list on hairlines, one row each with number, title and line. After rho's fee list |
| Quote | One flat testimonial card, no ghost cards. Keep the Trustpilot line and the carousel controls |
| FAQ | Keep the accordion |
| Footer | The CTA as type only, no orbit. Newsletter, links and disclaimer kept |

## Direction B, Private bank, prefix `db-`, worktree `/home/user/ovallo-direction-b`, port 5192

Light first, like a wealth manager's site. Paper backgrounds for most sections, ink text, hairline
rules, generous space and large type. Dark only for the hero and the footer. Photography carries the
page, from `public/photos/` (open each to see what it shows). A flat ink scrim over a photo is fine
for legibility, a gradient is not. Product screens appear twice at most, flat and straight. Where a
section needs a photo that does not exist, use `src/components/PhotoSlot.tsx` with a plain label.

| Section | What to build |
|---|---|
| Nav | The Ovallo6 nav, restyled only if the light first page needs it |
| Hero | Dark. Copy and both CTAs. A large photo, with the dashboard at most as one small flat inset |
| Plans | The terms as an editorial list of large rows on paper, the selected plan's details beside it, Subscribe kept. Not three equal cards |
| Bento | The four offerings as an editorial two column layout with photos in place of diagrams |
| Add funds | On paper, text led. The deposit methods as a list on hairlines, with a photo |
| Partners | Logos in one quiet row |
| Rewards | A large photo with the copy and perks beside it |
| Why choose | Heading and intro kept. The six benefits as a three by two grid of text on hairlines, with a photo |
| Quote | One large pull quote on paper, attribution and the Trustpilot line kept |
| FAQ | One column, hairline accordion |
| Footer | Dark, type only |

## Direction C, Term sheet, prefix `dc-`, worktree `/home/user/ovallo-direction-c`, port 5193

The numbers are the picture, like a fund fact sheet. Rates, terms, payout schedules, limits and
counts set as tables and key figure grids on a strict grid with hairlines. Tabular figures
everywhere. No photos, no illustrations and no mockups. Motion is reveals only. Use only figures
that already appear in the Ovallo6 copy, its UI or `src/data/plans.ts`.

| Section | What to build |
|---|---|
| Nav | Keep the Ovallo6 nav |
| Hero | Dark. Copy and both CTAs on the left, a key figure panel on the right |
| Plans | A term table, one row per plan with name, term, APY, payout and amount sold, the selected row open with Subscribe. Not three equal cards |
| Bento | The four offerings as a two column fact list, each with its title, line and the figures it holds |
| Add funds | The deposit methods as a table, method and what it does, from the Funds copy |
| Partners | Logos in one quiet row |
| Rewards | The perks as a table, with the account balance threshold as the key figure. No photo |
| Why choose | Heading and intro kept. The six benefits as an indexed table, benefit and line |
| Quote | The quote as plain type with attribution, and the Trustpilot rating and review count as figures |
| FAQ | Hairline accordion |
| Footer | Type only, the disclaimer given room |

## Check before you report

1. `npx tsc -b` and `npm run build` pass in your worktree.
2. Start your own dev server, `npx vite --port <your port> --strictPort`, never 5173.
3. Shoot with `node /tmp/claude-0/-home-user/ec7560de-8223-509e-b1a9-b2408b5aaa94/scratchpad/fullshot.mjs
   http://localhost:<port>/?dir=<letter> <out.png> <width> reduce` at 1440 and at 390, into
   `/tmp/claude-0/-home-user/ec7560de-8223-509e-b1a9-b2408b5aaa94/scratchpad/dir-<letter>/`. Full
   pages are tall, so slice them before looking. Look at every part, fix what is off, shoot again.
4. `grep` your CSS for any selector that does not start with your root class or prefix, and fix it.
5. `node /home/user/freelancing/studio/scripts/baselint.mjs --repo <worktree> --client ovallo --base dbf7665`.
   Fix real off scale values. It warns and never blocks.
6. Stop your server with `fuser -k <port>/tcp`. Never `pkill`.
7. Commit on your branch in your worktree. Do not push, do not deploy, do not merge.

Report in five lines or fewer. The commit hash, the sections built, any older taste entry your
direction overruled, and anything unverified. Put detail in `report.md` in your scratchpad folder.
