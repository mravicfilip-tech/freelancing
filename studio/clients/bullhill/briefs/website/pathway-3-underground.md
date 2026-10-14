# Pathway 3, Underground

Reference https://vaulk.com/ about 90 percent. Read `build-rules.md` first.

## Reference frames

Desktop frames at
`/tmp/claude-0/-home-user-freelancing/47010749-f8fd-541e-a7be-8b4f6076588b/scratchpad/refs/vaulk_1440/NN.png`,
phone frames in `vaulk_390/`. Contact sheets `refs/vaulk-sheetA.jpg`, `vaulk-sheetB.jpg`,
`vaulk-phone.jpg` next to this file. Open the frames, do not work from this text alone.

- 00 photo hero with corner marks, 01 the descent from the photo into dark earth, 02 the white
  wireframe on black, 03 to 05 the side index, tags, arrow lists and grey button, 06 the light
  logistics panel, 07 to 10 the timeline with notched media frames, 11 and 12 the full bleed photo
  with thumbnails, 12 and 13 the grey protection matrix, 14 the use environment tabs, 15 and 16 the
  FAQ on a warm glow, 16 and 17 the contact form and the footer.

## Look

- Ground `--bh-grey-975` #0e0f0f, text white, secondary `--bh-grey-400`. Light panels
  `--bh-grey-100` with 16px radius inset 16px from the screen edge, as frame 06. The matrix section
  on `--bh-grey-300`. The reference orange becomes bull-red, for the small arrows, dots, `001`
  numbers and tag icons. The dark red glow of frames 03 to 06 becomes a radial of bull-red at 0.25
  to 0.4 alpha on the near black. The peach glow behind the FAQ becomes bull-red at 0.10 alpha.
- Type Instrument Sans, weight 500, sentence case. Hero 56px desktop, 32 phone, centred. Section
  lines 28 to 34px, line-height 1.3. Body 16 to 18. Lists 14 to 16.
- Mono Chivo Mono 12px uppercase for tags, the side index, numbers and the small labels.
- Tags are a 1px bordered box with a bull-red square cross icon and a mono label, as frame 03.
- Lists use a small bull-red down right arrow and 1px hairlines between items, as frame 03.
- Buttons. Small grey button, `--bh-grey-200` fill, #111 text 14px, with a square plus or chevron
  cell on the right, as `More about our concrete` in frame 04, 44px on phone. Primary black button
  with a bull-red dot before the label, as `Request expert guidance` in frame 13.
- Media frames have a notched bottom right corner, a chamfered cut with a short grey bar beside
  it, and crosshair registration marks at the frame corners, as frames 07 to 10. Build the notch
  with `clip-path`.
- Wireframes are thin white 1px line drawings in inline SVG, isometric, as frames 02 and 05. Draw
  a trench section, the surface slab cut open, the walls, the sand bed, a bundle of four ducts as
  cylinders running the length, the warning tape above them, a chamber box at one end. Line
  opacity 0.5 to 0.9 for depth.

## Sections, in order

1. Header, as frame 00. A dark tab at the top centre with an angled right edge, logo
   `wordmark` `on-dark` 20px tall, the nav in 14px with a bull-red chevron before the active item,
   and a light grey Contact us pill with a bull-red dot. Phone as the reference phone frame 00, a
   tab across the top with a menu icon left, the wordmark and the Contact us pill, plus a call
   icon button. Menu is a Dialog sheet from the left on #0e0f0f with the items at 28px, the
   LangSwitch, call and email. The LangSwitch also sits in the desktop tab.
2. Hero. Full bleed photo placeholder 100svh with the shot brief, darkened toward the bottom, four
   white L corner marks inset 24px, `c.hero.title` centred in white, a small bull-red chevron
   under it.
3. Descent, as frame 01. A tall band where the photo ground turns into dark earth, layered SVG
   strata lines and thin root lines in greys fading into #0e0f0f.
4. Process wireframe, `id="process"`, as frames 02 and 05. The big trench wireframe centred, then
   `c.process.title` centred at 28 to 34px and the lede. Mono tags pinned to parts of the
   wireframe, from `c.process.layers`, Surface, Warning tape, Ducts, Sand bed.
5. Services, `id="services"`, as frames 03 to 05. Desktop has a left side index in mono with the
   four service titles, the first active with a bull-red dot and white text, the rest grey. Each
   service is a block with a tag, an empty bordered detail frame holding a small wireframe of that
   job, the body at 20px and an arrow list. Use `body` and the points from `copy.ts`, three to four
   points per service, and a grey button. A bull-red glow sits behind the first block. Phone drops
   the side index and stacks the blocks.
6. Steps panel, as frames 06 to 10. The light panel with a mono kicker `c.process.kicker`, a
   centred 34px line from `copy.ts` about the build chain from permit to restored street, then
   the four steps from `c.process.steps`. Each step a notched dark media frame placeholder with
   crosshairs on one side, on the other the bull-red `001` and the title at 20px, the body and a
   grey Know more button. Steps alternate sides on desktop, stack on phone.
7. Full bleed crew photo, as frames 11 and 12, `c.crew.shot`, with a row of three small
   thumbnails at the bottom centre.
8. Matrix, `id="crew"`, as frames 12 and 13, on grey-300. Left column `c.crew.title` at 28px,
   `c.crew.body` and a black dot button. Right four columns with 1px #111 hairlines and crosshair
   marks where they meet, one per machine in `c.crew.machines`, a 32px line icon, type, size and
   count. Above the columns the four stats from `c.stats` in the same column grid, 40px numbers.
   Regions as a mono line under the grid. Phone shows two columns.
9. Projects tabs, `id="projects"`, as frame 14. #0e0f0f. A 34px line from `copy.ts`, then Radix
   Tabs for the five projects, `001` to `005` in mono with the project title and region under it,
   the active one white with a bull-red underline, the rest grey. The panel is a light card with a
   notched photo placeholder left and on the right a mono `PROJECT 001/005` line, the title at
   28px, length, year, client, scope and connections as hairline rows, and a Speak with BullHill
   line with a grey Contact us button. Phone scrolls the tab list sideways.
10. Audiences. #0e0f0f, two columns, each a tag, the title at 28px, the body and the three
    points as an arrow list, the cta as a grey button.
11. FAQ, as frames 15 and 16. Light panel with the soft bull-red glow bottom left, left column
    `c.faq.title` at 28px and a black dot button, right a Radix Accordion with the bull-red arrow
    before each question and a small square chevron toggle on the right, hairlines between.
12. Contact, `id="contact"`, as frames 16 and 17. White ground. A 34px line from `copy.ts`
    saying they can reach BullHill by form, phone or WhatsApp. The role choice as square check
    style radios in a row. Fields on `--bh-grey-100` with 2px radius, labels 12px above, a big
    message box, the consent line and a black Send button with a bull-red dot. Right column the
    phone, email, WhatsApp and address, each with a bull-red arrow.
13. Footer, as frame 17. A thin #0e0f0f bar, rights left, legal notice, privacy and the
    LangSwitch right, all 12 to 14px.

## Refuse

- No orange, no peach, no green. No rounded pill buttons except the Contact us pill. No photos
  from the web, the hero is a placeholder like every other photo.
