# UI pass plan, Ekotehnika storyline 2

Filip's ask. Execute every note in `notes.md` (refs 01 to 06, scan items 8 to 23, scene notes S1 to S12) as a UI,
animation and illustration pass to an Awwwards level, read against the Linde brand rules in `brand-rules.md`.
The storyboard timeline does not change.

## What stays fixed

- The timeline in `src/story2/timeline.ts`, 12,000px and the 15 beats H, D1, C1, D2, F, R, Z, P, A, B, S, L, N, T, AT,
  with their spans, hold beats and order. Only what is drawn and laid out inside each beat changes.
- The story content per beat, the copy sources, and the truck models from the Drive.
- Version 5 Sistem is the lead version. Versions 2 and 4 share the shell, so they take the new UI and keep their
  own scenes (decision 1 below).
- Baseline that must not regress is commit 926a2b7, live at https://ekotehnika-hero.vercel.app/?v=5.

## Brand rules that drive the design

From `brand-rules.md`, guideline page numbers in brackets.

1. **The white frame is the brand.** Every Linde layout sits in a white passepartout with the logo on a white field
   (p.6 to 7). The logo may never sit on a photo, on red, on dark grey or with an added border (p.12). This solves
   S2. The logos leave their rounded box and sit in the corner cell of a thin white frame around the whole screen,
   which is also the visible grid Filip asked for in note 5.
2. **Lots of white, black text, red only for emphasis** (p.14). Red may sit only on white or pale grey, never on a
   dark ground (p.14). This clashes with the dark servis screen, see decision 3.
3. **Official red is `#A00020`**, the site uses `#aa0020` and five other reds that are not in the LMH palette
   (p.14 to 15). Greys come from the LMH set, `#e9e9e9`, `#d2d2d2`, `#a1a1a1`, `#6b6b6b`.
4. **Information colours** (blue, turquoise, green, yellow, forklift red) are allowed only in content such as
   diagrams and tables, at 72 and 48 percent tints (p.14). That fits the servis schematic and the spec tables.
5. **Type is FF Dax Pro**, Arial is the only named fallback, and the web licence is on the LMH Xtranet (p.13).
   Geist is not in the guideline, see decision 7.
6. **Headlines are benefit first, short, no commas or dashes, a full stop only on a full sentence** (p.45).
7. **Imagery is real products in real use, bright warm light, reduced saturation with the red accented** (p.18).
   The guideline says nothing on renders, so our 3D models stay, lit bright and warm.
8. **Pictograms are drawn on a 32px grid with a 2px line** (p.19 to 20). Any icon we keep follows that.

## Phase 1, the system (shell, every version)

One builder, files `src/ui/HeroFrame.tsx`, `src/ui/heroframe.css`, `src/story2/shell/*`, `src/story2/copy.ts`.

1. **Frame and grid.** A white passepartout 16px wide around the whole viewport for the pinned story, with a 12
   column grid drawn as `#d2d2d2` hairlines and plus marks at the crossings, after note 5 and the LMH 12 column grid
   (p.7). The logo cell sits top left in the frame (top left is the screen rule, p.57). Every text block, tile edge
   and button sits on a grid line. On the dark servis beat the frame and the logo cell stay white, which is exactly
   the guideline's white field (p.6), so no white wordmark is needed. Fixes S2 boxed logo and S4 no grid.
2. **Top row.** One bar in the frame after T01. Logo cell, six text links, then the two phone numbers as solid grey
   buttons and Zatražite ponudu as the one filled red button, labels in Geist Mono 12px uppercase with 0.08em
   tracking, 48px tall, 4px radius. Fixes S2 buttons.
3. **Type scale, one family.** Display titles in Geist 300 at 120 to 200px with tight tracking (D01, D04), section
   titles Geist 400 at 64 to 96px, body Geist 400 at 20px, labels Geist Mono 12px uppercase. Text in black
   `#000000` per p.14 or our ink, decision 6. No serif (decision 2).
4. **Buttons.** Primary filled `#A00020` with white text on light ground only. Secondary solid `#e9e9e9` with black
   text. On the dark servis beat the primary turns white with black text, since red may not sit on dark (p.14).
   Hover is a block wipe of the fill from left to right in 240ms.
5. **Data instead of cards.** The white rounded caption cards go everywhere (S4, S6, S9). Facts become spec rows
   in hairline grid cells, a big figure in Geist 300, a mono label under it (D03, D05, ref 06).
6. **Section markers.** Each hold beat gets a numbered marker on the grid, 01 to 06 in mono with a circle, and a
   section counter with a thin progress line on the right edge (ref 06, D04).
7. **Red use.** Red only on the filled primary button and the truck shells, as ruled on 2026-10-09.

## Phase 2, motion (shell, every version)

Same builder as phase 1, so type and motion are built once.

1. **Block wipe reveal** on every hold beat title and the hero headline, line by line, the bar in black on light
   beats and white on the dark beat, 0.6s per line, 80ms stagger, eased out (note 1).
2. **Scroll fill text** on the hold beat paragraph, grey `#a1a1a1` filling to black letter by letter from the story
   clock, not a fade (T07, D02).
3. **Figures count up** in the spec rows as their beat enters (ref 06, D03).
4. **Grid lines draw on** from the plus marks when a beat starts, 0.4s, and dim between holds.
5. **Notched section edge** where the pinned story hands over to Proizvodi, and Proizvodi to the footer (T03).
6. **Hover and focus** on every link and button, the wipe on buttons, an underline that draws on links.
7. Reduced motion shows every end state at once, as today.

## Phase 3, each beat (version 5 scene and shell layout)

Scene work by the Sistem builder, files `src/story2/scenes/sistem/*` only. Layout per beat by the shell builder.
Spans and order are untouched.

| Beat | Rejected now | New layout | Scene and illustration |
|---|---|---|---|
| H | The kicker crowded by the scene (S2) | Headline on the grid at the left, block wipe, the top row bar | Pale trees redrawn as real trees, warm bright light (p.18), the yard in light |
| D1, D2 | none named | Top row only | The site passes behind, same light palette |
| C1 | Muddy grey wall behind the title (S1), text touching the scene (S2) | Title on plain white ground, spec row of three figures (Od 1997, 1.000+ klijenata, Linde) on the grid below the scene with a clear band between | Wall in white and `#e9e9e9` with real windows and edges, EKOTEHNIKA sign as the one dark element, shrubs as plants |
| F | none named | none | Flip as now |
| R | Empty ground both sides (S3), weak left column (S4) | Title and fill text on the grid, three facts as a spec row | The Ekotehnika yard from above, the two halls, rows of parked trucks, pallets, markings, greenery, drawn from the drone stills as reference only |
| Z | none named | none | Roof push as now |
| P | Centred stack of box and icon cards (S5) | Text left on the grid, the four truck types as tabs (T08), each with its Linde cut out render and a spec row | Warehouse reveal behind as now, then T02, a real lit truck with half of it redrawn as a precise wireframe |
| A, B | none named | none | As now, the R16 down the aisle into black |
| S | Text packed top left, empty frame (S6), blueprint not precise (S7) | Ref 06, text on the grid left, a giant faded 300+ behind the drawing, one data line at the bottom, counter on the right | A precise schematic of the X50, orthographic side view, outline and key edges only, two line weights, dashed centre lines, dimension lines with real X50 figures, a fine grid, no glow, wheels turning, mast and forks shown |
| L | none named | none | The fork blade lift as now |
| N | Empty sides (S8), centred stack (S9) | Text left on the grid, the six facts as one spec row, ponuda button | The depot floor runs edge to edge, bays to the frame, fifteen trucks plus empty bays, soft shadows |
| T, AT | Too literal, toy robots, giant word (S10) | Title on the grid with a real offer line and a CTA, no single giant word (decision 11) | C-Matic robots at true scale in a believable warehouse aisle, their routes drawn as precise system lines |
| Proizvodi | WordPress 2011 look (S11) | F04 category list with inline truck images and model counts, then a lead truck with a spec table (D05, D06), the delivery photos as a composed collage after ref 02 | Linde cut out renders from the Drive (Freisteller files), or our models rendered in one light |
| Footer | Stock three columns (S12) | T11 closing band with one large line and the primary button, then the footer on the grid, logos in the frame cell, Hitan servis as the loudest element, F06 line drawings of the trucks on a ground line | Drawn Linija trucks reused as line art |

## Phase 4, check and ship

1. Before and after shots of every hold beat at 1440 with `node studio/scripts/shoot.mjs` (Widths in the README is
   1440).
2. `/uireview` once on the finished pass, one round and one re check, then the decision card.
3. Contrast on the real pixels behind every text, AA for body and large titles.
4. Filip checks scroll on a real GPU, since every check here runs on software rendering.
5. Deploy to production from a clean copy, as today.

## Build split

- Builder 1, shell and motion, phases 1 and 2 and the layout column of phase 3. Files listed in phase 1.
- Builder 2, the Sistem scene, the illustration column of phase 3. Files `src/story2/scenes/sistem/*`.
- Builder 3, after builder 1 lands, adjusts Linija and Grad framing to the new frame and grid only, no redraws.
- I check every builder's frames at full size before anything is committed, then run `/uireview`.

## Decisions for Filip, each with my default

Answer yes to take every default, or correct the line.

1. **Versions.** The new UI goes on the shared shell for 2, 4 and 5, scenes redone in 5 only. Default yes.
2. **Serif accent** from refs 02 to 04. Default no, Geist light at display size carries the look, the guideline has
   no serif.
3. **Dark servis screen.** The guideline never shows dark grounds and bans red on dark. Default keep it dark as you
   ruled, with no red on it (white primary button, white schematic), and the logo stays legal in the white frame.
4. **Logo placement.** Default the white frame with the logo cell top left, no rounded box.
5. **White wordmark on dark.** Default not needed, the frame keeps the logos on white.
6. **Red and text colour.** Default align to the official `#A00020` and black text, retire the five extra reds.
7. **Typeface.** Default Geist now, and Ekotehnika asks LMH for an FF Dax Pro web licence, which the guideline names
   as the house font.
8. **Company line.** Ekotehnika's own playbook says "ekskluzivni distributer Linde MH za Srbiju i Crnu Goru", the
   site says "Zvanični Linde partner". Default keep the site line until Ekotehnika confirms.
9. **Najam calculator** (T06). Default out of this pass, it needs real prices.
10. **Client logo wall** (T04). Default out until Ekotehnika gives permission.
11. **The giant automatizacija word.** Default replaced by a normal title and an offer line.
12. **Photos in Proizvodi.** Default kept, as a composed collage, not a strip.
13. **Play button on servis** (ref 06). Default none, no servis video exists.
14. **Always on your side claim.** Default not used, the guideline gives no rule for it.

## Done

No open sev 1 on the `/uireview` card, every scene note S1 to S12 answered on screen, the timeline unchanged, and
the preview URL live.
