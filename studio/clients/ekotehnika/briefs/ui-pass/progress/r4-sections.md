# Round 4, sections slice, items 22 and 23 and the footer truck row

Files changed are src/story2/shell/sections.tsx, sections.css, public/footer (deleted) and scripts/render-footer-trucks.mjs (deleted). Nothing is committed.

## Item 22, the text reveal
- A new hook, useReveal in sections.tsx, drives the same parts the beats use. Block wipe through data-wipe, --bx and --tv with wipeAt from motion.ts, and the letter fill through Fill from ui.tsx.
- It runs on real time, started by an IntersectionObserver. A block is any element with data-reveal. It starts when its first wipe or fill is 12 percent of the screen above the bottom edge. Each wipe runs 720ms, the hero's own pace, with 80ms between orders. The fill starts half a wipe after the last wipe and runs 1100ms.
- Proizvodi has four blocks, the label and title, the lede and button, and each product cell on its own with 70ms per cell of extra delay. In a cell the range, the image, the name and the capacity each wipe.
- The closing section has one block, label, two title lines, lede and button.
- The old cell fade (opacity and translate) is gone. No fade anywhere.
- Reduced motion or no observer arms nothing. Checked in the browser, 36 wipe parts, none armed, no data-live.
- A block that is scrolled past without being seen (anchor jump to the footer, fast fling) shows its end state at once. The observer cannot report that, so a scroll check does it.
- Title lines now sit in the same mask as .ln in shell.css. The title is a flex column so the negative margins do not collapse, and the title lines stay where they were.

## Calls for Filip to confirm
- The wipe over a product image uses a light grey bar (grey-light) and not black. A black bar over the 550 by 450 lead image outweighed the text wipes. One line to flip, --bar on .sx-fig in sections.css.
- The footer has no headline. Its loudest type is the two phone numbers. I left them alone under the narrow reading. Wiping them is one data-reveal on row one.

## Item 23
- The two phone buttons and .sx-phones are removed. Only Zatražite ponudu stays.

## Footer
- FooterTrucks, .sx-trucks, .sx-truck and row r3 are removed, with public/footer/*.webp and scripts/render-footer-trucks.mjs.
- Row two now carries the ground rule and its plus marks, so the footer ends on that rule with the copyright row under it. Checked in the after shot, no empty band.

## Needs a change elsewhere
- src/story2/copy.ts still holds footer.trucks and footer.trucksSize, now unused, and closing.phones is unused. Not my file, safe to delete.
- The N20 range text "N20 do N25 C" shows its last C clipped in the Proizvodi cell. It is in the before shot too, so it is not from this change. Cause not found.

## Checks
- tsc clean. vite build into /tmp/claude-0/r4-sections-dist, preview on 4175 (stopped). Old build on 4173 untouched.
- baselint flags only the .sx-ln mask padding and margin in em (0.1em, 0.16em). That is the same mask value .ln uses in shell.css and it scales with the type, so I kept it. Two other flags are in shell.css, not mine.
- Shots, 1920 by 1080, in this folder as r4-sections-before-* and r4-sections-after-*. The after mid shots were taken with the page clock at 0.15 speed, because software GL runs the page too slowly to catch a 720ms wipe in real time.

## Item 21, the grid lines run on from the story into Proizvodi
- The five verticals of Proizvodi now sit on --x1 to --x5 only, 48, 510, 972, 1434 and 1872 at 1920, measured in the browser, the same as the story's. They run from the top edge of the section to its bottom, above the cells, so the story's lines carry on as the stage scrolls away.
- Cells sit on four columns between the lines. Title block in x1 to x2 across three rows, the lead in x2 to x3 across three rows, the six models two to a row in x3 to x4 and x4 to x5. Content, lead and order are kept. The lead image is centred in its tall cell, since it no longer stands on a row's ground.
- Plus marks on every crossing, the top and bottom rules at all five verticals and the two inner rules at x3, x4 and x5. The cells draw no left lines now.
- The title is sized to its cell, max(56px, min(96px, (3 gx minus 48px) over 3.9)). It is 96px at 1920 and the longest line is 363px in a 414px cell. The closing section and the footer are untouched.
- Real scroll from 11400 to 13600 in steps of 200 with scrollpass.mjs, clean, no leak and no tone mismatch. Shots r4-sections-at21-handoff.webp (story last frame above, section top below, lines meet) and r4-sections-at21-done.webp.
- The Proizvodi verticals end at the section bottom and the closing section draws its own verticals at columns 1, 3, 5, 9, 11 and 13, so below Proizvodi the lines change. That is the closing section as it is, not changed here.
