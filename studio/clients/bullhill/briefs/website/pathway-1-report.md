# Pathway 1 Foundry, build report

Branch claude/hopeful-maxwell-bwuy3c-p1. All work is in bullhill-site/src/p1/. Nothing in shared, main.tsx, package.json or index.html was touched. Open it at /?v=1, German at /?v=1&lang=de.

## What is built

Nine blocks in the order of the pathway brief, desktop and phone.

- Header. Sticky, #111 at 92 percent with a 12px blur. Desktop has the five nav items, the shared LangSwitch and a bracket Call us. Phone has the logo, a square bracket call button and a bracket Menu button that opens a Radix Dialog, full screen #111, nav as 40px uppercase lines, call, email, bracket Call us and the LangSwitch.
- Hero. Dotted hill in SVG circles with one line of red dots up the near slope, split headline (64px desktop, 40px phone), mono lede, two bracket buttons, Scroll cue on desktop.
- Ethos and services (id services). Light panel with 24px top radius riding over the hero, then four overlapping cards in black, charcoal, bull-red and light grey. Each has its own dot drawing (trench cut in a grid with a red duct line, duct bundle in a dot ring, dotted house with a line in, dotted layers closing).
- Process (id process). Radial dot field behind the title, the six trench layers as a big list (64px desktop, 32px phone) with Ducts in #111 and a red square at its note, then four steps in hairline columns.
- Projects (id projects). Scroll snap row, the centred card raised on #ececE9 with bracket corners. The active card follows the scroll position. Square prev and next buttons and a 01 / 05 counter.
- Crew (id crew). #111 with 24px top radius, mono bar, intro, title, three crew bands, second line, four stats with hairlines, fleet rows and regions.
- Audiences. Operators then contractors mirrored, scattered dot field, three pixel icon cards each (red, charcoal, light), a dotted terrain wave at the end.
- Contact (id contact). Real form. Role choice is a Radix RadioGroup styled as bracket toggles. Required marks, per field messages with a "!" badge and text, 800ms sending state, success message, and ?form=error shows the error box. Big phone number, email, WhatsApp and hours beside it on desktop, below on phone.
- Closing. Dotted hill left, bull-red panel right with the form title, bracket Call us, black duct ends, 28px nav links, address, legal links, company line, rights line and the on-red logo.

German is checked at 390, 768 and 1440 with a script that lists every element whose box leaves the viewport. None do.

## Checks

- npm run typecheck and npm run build pass.
- Shots at 390 and 1440, English and German, three full passes, plus a 768 pass. The shoot tool reports no contrast fails, no small targets and no console errors. Its only finding is the 12px mono labels, which the rules allow.
- States driven by script. Phone menu open in both languages, empty submit on both widths, sending, success, ?form=error, project row moved to the third card, bracket hover.
- baselint leaves 18 warnings, all spacing of 128, 160 or 224px. The build rules allow multiples of 32 above 96, the lint only knows the base scale.

## Where it differs from the reference and why

- Four card colours follow the brief. Text on the bull-red card is white, not black, because black on red is 3.74 to 1 and the card copy is 14px mono.
- Red dots on the charcoal card (the red duct) measure about 1.9 to 1. They are decorative and aria-hidden. If you want them stronger, the duct could be filled or drawn in white.
- The reference header is a floating pill nav. The brief asked for a full width sticky bar, so that is what is built.
- Logo is the shared lockup at 40px desktop and 32px phone as asked. The BullHill word under the excavator is small at that size. Larger would need a brief change.
- The Scroll cue is hidden on phone. The two bracket buttons and the lede already fill the bottom of the first screen.
- The hill is a hand tuned height field with two rises, not a rendered 3D mesh. It reads as a hill at both widths but is flatter on the far side than the sphere in the reference.
- The reference has a partners block with a dot wave beside text. The brief has no such section, so the wave closes the audiences block instead.
- Layer list greys run grey-500 to grey-800 with Ducts in #111. Anything lighter than grey-500 fails 3 to 1 on #dadada.
- Red error and required marks are small badges and a red field line. Red text at 12px on #dadada is 4.0 to 1 so messages are #111 text next to the red badge.
- The FAQ in content.ts is not shown. The pathway brief lists no FAQ section. It would sit well as a Radix Accordion between crew and audiences if wanted.
- Project card buttons and the legal links point at in page anchors, since there are no project pages or legal pages yet.
- German long words get soft hyphens through a small helper in copy.ts, because headless Chrome did not hyphenate on its own. It is invisible in English.

## Strings added in copy.ts

Main nav label, the second crew line, email label, email error, hours label, address label, project row label and the success heading. Each has English and German.

## Needs from shared files

Nothing blocking. Two optional notes.

- Logo kind logo at 32 to 40px has a small wordmark. A wide lockup variant, mark beside wordmark, would read better in headers.
- content.ts has no string for a second crew line, so one lives in copy.ts. If the other pathways need it too it could move into content.ts.

## Round 2, real photos, work section and the red glow

All in bullhill-site/src/p1/. Nothing in shared was touched.

- Work section (id work) sits on #111 straight after the hero and before the light ethos panel, which still slides over it with its 24px top radius. Mono kicker row with Our work on the left and 07 photos on the right on a hairline, uppercase 40px title left, mono lede right. Then a snap row of seven tall cards with 24px radius, 480px tall on desktop and 400 on phone. The first card is 640 wide on desktop, the rest 320. On phone every card is 300 wide, so one whole photo and the edge of the next show under the title in the first screen. Captions sit under each card as 01 / 07 plus the caption in mono. Square prev and next buttons with a counter, same buttons as the projects row. The Scroll cue in the hero now points to the work section.
- Focal points are set per photo in copy.ts (WORK_FOCAL for the tall cards, PROJECT_FOCAL for the 4 / 3 project crops), so the mountains and the dumper show in card 01, the duct bundle in 02 and 03, the machine in 04 and the manhole in 06.
- Project cards show their photos with a 12px radius. Services cards keep their dot art and the crew strip keeps its placeholders. Real photos show clean, with no grain, mark or shot brief.
- Sizes are set per slot. Work cards use 640px for the first card and 320px for the rest from 768 up, 300px below. Project photos use 372, 352 and 252px. No photo sits above the fold in this pathway, so none is marked priority.
- Glow, carried from Daylight. Two bull-red radial ellipses rise from the bottom edge of the hero behind the dotted hill at alpha 0.45 and 0.3. The work section repeats the same ellipses mirrored at its top edge, so the glow runs across the seam and fades out under the title. In the closing section a bull-red hill rises from the bottom of the black half under the dotted hill, built like the planet in .p2-footer (a circle, radial red to red-dark to #111, inner highlight, soft outer red shadow), 840px wide on desktop and 520px on phone.

Checks. typecheck and build pass. Shots at 390 and 1440 in English and German, two passes, plus scrolled viewport shots of the work row, the hero and work seam and the closing. The shoot tool reports no contrast fails, no small targets and no overflow. baselint shows 1 warning, the coloured glow shadow on the hill, which is the Daylight treatment on purpose.

The worktree now has its own installed node_modules, so the dev server serves the fonts. Shots were retaken with Archivo and Azeret Mono and match the earlier ones.
