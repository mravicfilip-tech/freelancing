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
