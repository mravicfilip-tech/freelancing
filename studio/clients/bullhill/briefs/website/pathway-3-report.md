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
