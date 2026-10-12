# Round 3, builder D, products section and footer

## Files changed

- `ekotehnika-hero/src/story2/shell/sections.tsx` has Products, Footer and the new AfterStory (Products, then Footer).
- `ekotehnika-hero/src/story2/shell/sections.css` is new. All rules use the `sx-` prefix and it is imported from sections.tsx.
- `ekotehnika-hero/src/story2/copy.ts` has a new `proizvodi` block (seven cells, counts add up to 96, all marked dummy) and phone e-mails and labels in `footer`.
- `ekotehnika-hero/src/story2/shell/lineart.tsx` has FooterLine with a viewBox cut to the trucks (1546 by 300) so it fills the grid width.

## Switch needed in StoryShell.tsx

Import `AfterStory` instead of `Footer` and render `<AfterStory />` in the two places it renders `<Footer />` (reduced motion branch and normal branch). Until then only the footer shows, with no products section.

## Dead selectors in shell.css, safe to remove

From the comment "sections after the story, plan part D" to the end of `.ft-base`, that is `.s2-sec`, `.sec-grid`, `.notch`, `.notch svg`, `.s2-footer`, `.ft-grid`, `.ft-logo` with its three img rules, `.ft-hitan`, `.ft-num`, `.ft-col`, `.ft-nav`, `.ft-adr`, `.ft-kon`, `.ft-col h3`, `.ft-col ul`, `.ft-col li, .ft-col p`, `.s2-footer a` with its hover rule, `.s2-footer .ft-logo, .s2-footer .ft-num`, `.ft-ground`, `.ft-line`, `.ft-base`. Also `.s2-label`, only the old footer used it. The exported `Notch` component is gone and nothing imported it.

## Decisions

- Products cell lattice is columns 5 to 12 cut in four equal units. One lead cell (H30 D) spans two units and two rows, four cells sit beside it, two wide cells close the last row. The lead is the one clear hero item the taste log asks for.
- Cell content is the model range top left, the count top right, the cut out standing on a shared ground, then the name and the capacity. The range drops the "Linde" prefix so it fits a 222px cell at 1440.
- Left column holds the label and title at the top and the lede and the primary at the bottom, standing on the bottom rule.
- Lines are 1px pairs, black 18 percent beside white 40 percent (black 24 percent on the pale grey footer so it still reads). Plus marks are solid ink at every crossing, 16 in Proizvodi.
- Row height is `clamp(260px, 28vh, 304px)`, so the whole section fits one viewport at 1440 by 900 and at 1920 by 1080.
- Stagger is 90ms per cell through an IntersectionObserver, with no hiding at all under reduced motion.
- Hover on a cell, measured in the browser, gives fill rgb(233, 233, 233), cut out translateY(-8px) and the name underline at 100 percent.
- The footer rows draw only the verticals they use (row 1 uses columns 1, 7 and 13, row 2 adds column 10, row 3 draws all five behind the trucks). Column 4 would cross the Ekotehnika logo at 1440.
- The ground rule under the trucks is solid ink, not a hairline pair, so the wheels stand on something firm.
- `data-after-story` is on both the products section and the footer, so the version chip steps aside over the products and the skip link lands on the first section after the story. The footer keeps `id="kontakt"` and the inner `id="sadrzaj"`.
- The old footer notch is dropped. The new spec does not name it and a tab on a pale grey band under a white section had nothing to join.

## Found, not mine

- The Daxline Pro capital C renders with a cut right side in "N20 do N25 C" and "C-Matic 10" at 16px and 18px, medium and regular. It is the font file, not the width, so the P tab clip in item 3 may have the same cause.
- The primary button now shows a black plus cell. That comes from builder A's button rules, no arrow, but Filip should know it is on this view's one primary.

## Checks

- `tsc --noEmit` clean, `vite build` clean (built to the scratchpad, not to dist).
- Shots at 1920 by 1080 and 1440 by 900, before and after, in `r3-d-footer-before.webp`, `r3-d-footer-after.webp`, `r3-d-products-before.webp` (the rejected round 1 ref, the section did not exist) and `r3-d-products-after.webp` (with hover).
- Hover shots were taken with reduced motion emulated, because the machine was at load 13 and WebGL starved the transitions. The stagger was seen end to end (all cells at opacity 1 after the observer fired), the middle frames were not caught.
- Smallest text is 14px, all text is black, red appears only on the primary.
- Temporary hook removed. Dev server on 5205 stopped.

## Restart

Round 3 restart, closing section and the inset ruling (taste 18:50 and 19:00). Files changed are `sections.tsx`, `sections.css` and `copy.ts`. `lineart.tsx` is untouched.

- The parked patch applied clean. I finished it. The closing section is `Closing` in `sections.tsx`, rendered by `AfterStory` between Products and the footer. StoryShell already renders `AfterStory`.
- Grid is the story's 12 columns, 48px margins and 24px gutters, hairline pairs and solid plus marks at every crossing. Height is four rows of `clamp(170px, (100vh - 140px) / 4, 230px)` plus padding, 1028px at 1920 by 1080 and 850px at 1440 by 900.
- Four delivery photos each fill a two column by two row cell, square corners, no shadow, object-fit cover. Left pair in columns 1 to 2 and 3 to 4 (rows 1 to 2, then 3 to 4), right pair in columns 9 to 10 (rows 3 to 4) and 11 to 12 (rows 1 to 2). They stair step so no two share a row while moving.
- Flow is scroll linked translateX with no opacity. Left pair enters from the left window edge, right pair from the right edge. Each photo starts at its own point of the run (0, 0.2, 0.3, 0.1) and the run ends when the section top is a tenth of the window from the top. With reduced motion `--k` is never set and the photos sit in their cells.
- Photos sit over the hairlines and under the plus marks, so no rule cuts through a photo. Their edges are the grid.
- Centre, columns 5 to 8, all centred: Kontakt, the headline "Recite nam / šta vam treba" in two lines, one short line, the one primary Zatražite ponudu, then the two phone secondaries. Red only on the primary.
- Bug fixed on the way. `.s2 h2` and `.s2 p` in shell.css reset margins with higher specificity than `.sx-ctitle` and `.sx-clede`, so the stack had no spacing. Both rules now name `.sx-mid`.
- Inset. The Proizvodi left column is `padding 36px 0 40px 24px`, so the label, title, lede and button start 24px in from the column 1 line and 36px under the rule. Product cells already pad 24px on every side, the old 26px left is now 24 for consistency. The footer trucks drawing, which touched both outer verticals, now sits 24px in. Footer cells and the copyright row already had the inset. Grid lines did not move.
- Open point for Filip. The photos touch the grid lines on purpose, as the brief says each fills a cell. That is the one place an image edge sits on a line.

Checks. `tsc --noEmit` clean and `vite build` clean (built to the scratchpad). Shots at 1920 by 1080 only, the machine was at load 14 to 21 and the coordinator cut the 1440 set. `r3-d2-closing.webp` has the half way entry and the settled frame, `r3-d2-products.webp` has Proizvodi after the inset. The before is `r3-d-products-after.webp` from the first pass. 1440 by 900 was shot once before the last timing change and looked right, settled at 850px tall. Smallest text is 14px, all text black.
