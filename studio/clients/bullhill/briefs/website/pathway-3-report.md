# Pathway 3 Underground, build report

Branch claude/hopeful-maxwell-bwuy3c-p3. Reference vaulk.com. Everything lives in `bullhill-site/src/p3/`.

## What is built

All 13 sections of the brief, in order, at 390 and 1440, English and German.

- Header. Dark tab with a slanted right edge, wordmark, nav with a red chevron on the active item (scroll tracked), the shared LangSwitch and a light grey Contact us pill with a red dot. Phone has the menu icon, wordmark, pill and a separate call button. The menu is a Radix Dialog sheet from the left with 28px items, LangSwitch, phone and email.
- Hero with a placeholder photo at 100svh, four corner marks and a red chevron. Descent band with strata lines and generated root lines in greys.
- Process wireframe in inline SVG. A projected 3D model of the trench, the layered slab cut open, sand bed, four ducts as cylinders, warning tape with stripes and a chamber with a lid. Four mono tags with leader lines from `c.process.layers`.
- Services with a sticky side index on desktop, bordered detail frames holding four small wireframes, arrow lists and the grey button. Red glow behind the first and last block.
- Steps panel on grey-100 with notched media frames, crosshairs, red `001` numbers and alternating sides.
- Full bleed crew photo with ruler ticks and three thumbnails. Matrix on grey-300 with stats, four line icons, hairlines and crosshairs where they meet. Projects with Radix Tabs and a notched panel with prev and next. Audiences. FAQ on a Radix Accordion with a soft red glow. Contact with a real form (Radix RadioGroup for the role, required messages next to the fields, 800ms sending state, success, `?form=error` for the error state). Footer.

## Checks run

- `npm run typecheck` and `npm run build` pass.
- Four shoot passes at 390 and 1440, English and German. No horizontal scroll in any of them. Menu, empty submit, success, error, accordion and tabs were driven and looked at.
- baselint reports 44 warnings, all sev 3 or by design (see below).

## Where it differs from the reference, and why

- The photo is a grey gradient placeholder, so the descent is a grey gradient with line art instead of a photo turning into soil.
- The side index is dimmed less than the reference. Inactive labels use grey-400 so they pass 4.5 to 1. The reference labels are around 2 to 1.
- Section lines are 28px on phone and 32px on desktop. The brief says 34px, but 34 is off the base scale. Form labels are 14px, not 12px, because labels are needed to act.
- The top corner marks sit 72px from the top and not 24px, to clear the header, as in the reference frames.
- The Contact us pill has a slanted right edge and a 4px radius, as in the reference, so it is not a round pill.
- Dots on the buttons are small squares, as in the reference, 6px.
- Machine icons, wireframes and roots are drawn by hand in code, so they are simpler than the reference models.
- The Know more buttons link to the services section. They are placeholders until a detail page exists.
- Footer legal and privacy links point to the top of the page until those pages exist.
- No scroll motion. The side index and nav active state use IntersectionObserver, which is state and not animation.

## Needed from the shared files

Nothing. No change to `src/shared/`, `main.tsx` or `package.json` was needed. One note for the other pathways. The Radix Dialog needs `container` set to the pathway root or it renders outside `.p3` and loses the scoped CSS.

## Strings added in copy.ts

Contact us label, service points (four per service), the steps line, step photo briefs, know more, the projects line, speak with BullHill, the FAQ button, the contact line, the email format message and the contact detail labels. English and German both.

## Round 2, real photos

Built in `bullhill-site/src/p3/` only. Checked at 390 and 1440, English and German, three shoot and fix passes, typecheck and build pass.

- Hero is `route-trench-village` full bleed. Focal point 60% 50% on phone (trench, dumper and mountains in frame) and 50% 40% on desktop (mountains, dumper and the trench with ducts). A dark gradient rises from the middle to solid #0e0f0f at the bottom, and the headline sits low on it. Worst pixel behind the headline measured at 5.0 to 1 against white at 1200 wide, 6.0 to 1 at 1440, 8.5 to 1 or better on phone and tablet. Corner marks and chevron stay.
- New work section, `id="work"`, right after the hero. Tag with the kicker, 32px title, lede, then a sideways snap row of seven notched frames with crosshair marks and a bull-red 24px `001` to `007` with the caption beneath. Red numbers are 24px because red on dark is only allowed at 24px and up. Square prev and next buttons and a `07 photos` count show from 768 up. On phone one whole photo and the edge of the next show in the first screen after the hero.
- The descent band now starts on #0e0f0f, since the work section sits above it and no longer the hero photo. Its bottom carries Daylight's glowing hill, a half circle with the same radial and glow as `.p2-footer__hill`, at 0.55 alpha and faded out below the band so the wireframe stays the focus.
- Steps 02 to 04 show their photos in the notched frames, step 01 keeps its placeholder. The full bleed crew photo is `excavator-street` with `ducts-fence`, `restored-lane` and `route-trench-village` as the three thumbnails. The project tab card shows each project photo. Service frames keep their wireframes.
- `sizes` is set per slot. The hero is eager with high priority, everything else is lazy.

Not matched or worth a look.
- The three thumbnails are not clickable yet, they are static like the rest of the round. The red active bar on the first thumbnail was removed since it would imply a selection.
- Lazy photos in the far end of the work row load when the row is swiped, as expected.
- Baselint still flags three z-index values and one 1px overlap from round 1, and the hill box shadow, which is copied from Daylight on purpose.
