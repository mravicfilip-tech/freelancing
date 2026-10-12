# Round 3, builder A, shell items

Baseline for the before shots is a clean worktree of commit 3e2070b, because other builders were editing the shared tree. After shots are from the shared tree with every builder's work in it, so scene changes outside my files show up in them and are not mine.

Contact sheets in this folder are named r3-a-*.webp. Before sets are r3-a-before-1920-v5, r3-a-before-1920-v2v4 and r3-a-before-button-board. After sets are r3-a-after-1920-v5, r3-a-after-1920-v2v4, r3-a-after-1440-v5 and r3-a-after-2000-p. r3-a-zoom shows the grid pair on white, on the truck and on dark at 12x, both button edges and the flags. r3-a-buttons-after shows the buttons at rest, at 60 percent hover and with keyboard focus, light then dark.

## Per item

**1 Secondary buttons.** The parked patch applied, then folded into the new button block. Edge measured on real pixels at 1920. Light, line pixel 122 on ground 255 is 4.3 to 1, and 3.9 to 1 against the 245 label tint. Dark, line pixel 140 on ground 11 is 5.9 to 1, and 5.2 to 1 against the 25 label. Both pass 3 to 1. The tint is opaque (#f5f5f5 on light, #191919 on dark, the 4 and 6 percent laid on the ground) so a grid line never shows through a label.

**New, 2D is the only button.** Structure 2 (label block, 1px gap, 48px square cell with plus, phone glyph on phone buttons) and hover D (border draws on clockwise from the top left). Removed from heroframe.css every [data-bs] rule (2 to 6) and every [data-bh] rule (A to E), the btn-l2, btn-k, tick and hover fill rules, the `.btn-ground-dark` selectors and the `is-hover` classes. Removed the ?btn= switch (variant.ts), the /?buttons board (ButtonBoard.tsx), its wiring in versions.tsx and the .bb rules in shell.css. Checked at rest, at 60 percent hover and with keyboard focus, primary and secondary, light and dark (r3-a-buttons-after). Light primary cell is black. On dark the primary is white and its cell is grey (#6a6a6a family, var grey-dark), kept from the board cell Filip pointed at, say if he wants it black. Top row phone buttons already carry the phone glyph in the cell at the right end, as asked, and the left start variant is not built.

**11 After story bug.** Both queries now look inside the body. Checked in the browser, the root attribute is set when the products or footer section is within 95 percent of the viewport and cleared at the top, and the version switch fades with it. Now two sections carry the attribute, the first one found is Products.

**Q2 logos on dark.** public/brand/ekotehnika-white.svg, four fills set one by one to #FFFFFF (three #4d4d4d and the #a00020). HeroFrame stacks the ink and white wordmark, 160 wide, crossfade 200ms on the frame tone. The Linde logo is never hidden. The old logos-off attribute is gone. Seen on S in v2, v4 and v5.

**2 Grid.** Line masking removed (merge, maskStyle, the data-mask boxes and the reduced motion mask pass, all gone). Each line is a 2px pair, black half on the line pixel and white half beside it. Light, black 18 percent, white 40 percent. Dark, black 40, white 40 (the black half is invisible on dark, the white half measures 109 on 11, 3.8 to 1). Light line measures 1.53 to 1 on white, today's solid grey was 1.47 to 1. Over the truck both halves read (white half 150 beside 61). Plus marks at every crossing of a vertical with a block rule, found from `data-rule` on the marker, spec rows, rlist, tabs, dataline and the P callouts, rounded to whole pixels, same --x values as the lines, drawn above the frame so a rule never covers an arm. The two grid rules keep their own marks and are skipped. Reduced motion path places them once.

**3 Prodaja.** Tabs step at k 0.06, 0.28, 0.50, 0.72, last held to the end, and the P text now leaves with the default window (it used to leave at 0.5 to 0.74, which would have hidden models 3 and 4). A click still stops the loop. Outgoing cut out slides 48px left and fades in 400ms, incoming from 48px right in 600ms, same ease. Leader lines draw on from 600ms, 120ms apart, dots land with them, then range and capacity roll in. Tab bar fills over 600ms. The cut out shows from k 0.06 and again each time the beat is entered. End states checked, the frame by frame timing could not be sampled because swiftshader starves the page. The leaders are now 1px divs sized with hypot and atan2 (SVG dashes ignore pathLength with non scaling stroke).
The truck overlap before k 0.45 is scene timing, builder S. The P text now stays to the end of the hold, so S should keep columns 1 to 6 clear for the whole beat.

**Clipped C.** Not a box problem. All four tab ranges and both callouts fit with room at 1280, 1440, 1920 and 2000 (tab range ends 4px inside the tab, callouts 60 to 160px inside). I read the font. In public/fonts/daxline the C outline is complete, advance 540, bounds 57 to 495 at Regular, and the terminals are drawn as slanted cuts (495,27 to 466,98) the same way as G, S and e, in all five weights. So the file is not broken, the glyph just has a very narrow aperture and a steep cut, so it reads as clipped at 14px to 24px when it ends a string. Nothing to fix at the source. I added 4px right padding to the tab and a nowrap callout at min 15em for safety.

**Filip, line cut off at 2000.** The top rule runs unbroken now. The RASPON MODELA cell sits under the top rule with its label 12px below it, the same gap as the PRODAJA marker. Checked at 1440, 1920 and 2000. The 03/06 count of the marker ends 24px before the column 7 line at every width. The old right edge counter is removed (below).

**7 NPane collage.** Four photos in columns 1 to 6 standing on the bottom rule. One unit u is 24px at 1920 by 1080 and 15px at 1440 by 900 (CSS round of the stage height), the collage is 37.5 by 20 units, every offset a whole unit. Large 18 by 16, wide 14 by 8, tall 10 by 14, E20 EVO badge 8 by 9 on top, square, no shadow. Photo reveal is the block wipe, 120ms apart on real time after 300ms, parallax up to 24px (6, 18, 12 and 24px per photo) opposite to the scroll. Collage top is y 535 at both sizes, the stat row now ends at y 528. Alt text is read from proizvodi.photos in copy.ts, which builder D left in place.

**No fades.** Nothing in the shell fades content with a gradient. The only gradients are the two hard stop line pairs and the footer link underline draw.

## Extra items from the thread

- S giant 300+ removed, .s2-giant block and rules gone. copy.ts keys `servis.giant` and `servis.giantLabel` are now unused. Checked S in v2, v4 and v5.
- Right edge counter, progress line and the COUNTER and --prog code removed with their CSS, the still mode rule and the fixed mask entry. Nothing else read them (greped src, v2 v4 v5 shots).
- N spec row only. Figures 40px Light 350, a 20 by 20 solid inline icon above each (clock, truck, wrench, two overlapping squares for Zamena), icons in the ink colour mapped by fact index in NPane, optional `icon` on a new SpecFact type in ui.tsx. Measured at 1920, icon bottom 414 to the digit cap top 446 is 32px, caps with a flat top read 33. Row is 376 to 528 and every label fits at 1920 and 1440. C1 and AT use the same SpecRow and can follow.
- AfterStory renders in place of Footer, dead footer selectors removed from shell.css after a grep of src showed no users (.s2-sec, .sec-grid, .notch, .s2-footer, all .ft-, .s2-label).
- Flags in the hero marker, 10px high (the cap height), Serbia 15 wide at 3 to 2, Montenegro 20 wide at 2 to 1 (15 wide at 2 to 1 would be 7.5 high, so I kept the height at the cap height), 6px before the word, sharp, 1px hairline at 18 percent black, national colours. Montenegro eagle is a simplified gold shape.

## Files

src/ui/heroframe.css, src/ui/HeroFrame.tsx, src/story2/shell/StoryShell.tsx, Grid.tsx, panes.tsx, shell.css, ui.tsx, src/story2/versions.tsx, public/brand/ekotehnika-white.svg. Deleted src/story2/shell/ButtonBoard.tsx and variant.ts. motion.ts untouched.

## Checks and open points

- `npx vite build` clean (built to the scratchpad). `tsc --noEmit` is clean in my files, it currently fails only in src/story2/scenes/linija/automation.tsx (p1 to p3 declared twice), which is not mine.
- S in v5 needs about 20s of swiftshader to draw, shots at 9s show white. Not a regression, the baseline does the same.
- Grid values are a start that holds on white, truck and dark. Filip may want black 22 percent on white if he wants it stronger.
- Not run, /uireview.

## Najam collage removed

Filip, "Remove this from here". The photo collage is out of NPane. Removed the COLLAGE data and markup and the proizvodi import in panes.tsx, the .n-collage and .pw rules in shell.css, the photo reveal and parallax code in the StoryShell loop (the photos list, shownAt and the data-rt query), and the data-rt wipe selectors in heroframe.css. The spec row with its icons, the lede and the button are untouched. `tsc` is clean in my files. N checked at 1920 and 1440 in v2, v4 and v5, see r3-a-after-n-no-collage.webp. The area below the stat row is plain ground in v5 and shows the scene in v2 and v4, whose N cameras still have the framing from before. The v4 trucks run under the spec row at 1440, which is for the scene builders. The photo files and their alt texts in copy.ts are unchanged for the new closing section. Supersedes the item 7 text above.
