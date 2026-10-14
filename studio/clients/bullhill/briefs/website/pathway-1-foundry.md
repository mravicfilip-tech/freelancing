# Pathway 1, Foundry

Reference https://www.worldquantfoundry.com/ about 90 percent. Read `build-rules.md` first.

## Reference frames

Desktop frames, one viewport each, at
`/tmp/claude-0/-home-user-freelancing/47010749-f8fd-541e-a7be-8b4f6076588b/scratchpad/refs/wqf_1440/NN.png`.
Phone frames in `wqf_390/`. Contact sheets in `refs/wqf-sheetA.jpg`, `wqf-sheetB.jpg`,
`wqf-phone.jpg` next to this file. The white cookie bar at the bottom of each frame is not part of
the design. Open the frames, do not work from this text alone.

- 00 hero, 01 ethos panel and card row, 02 the four cards, 03 focus title on a dot field, 04 the
  big sector list, 05 and 06 portfolio, 07 team with face strip, 08 to 12 investors and founders
  with coloured cards, 13 and 14 partners with the dot wave, 14 and 15 the orange contact panel and
  footer.

## Look

- Ground `--bh-grey-950` #111 for dark sections, text `--bh-grey-200` #dadada. Light panels
  `--bh-grey-200` #dadada with text #111, rounded 24px on the top corners where a panel slides over
  a dark section, as in frame 01.
- The reference's four card colours map to black #111, charcoal `--bh-grey-700`, bull-red and
  light `--bh-grey-100`. Bull-red takes the place of the orange as the hottest card. No teal.
- Display type Archivo with `font-stretch: 112%`, weight 500, uppercase, line-height 1, tracking 0.
  Sizes 56 to 64 desktop, 40 phone for hero and section titles, 28 to 32 for card titles.
- Mono Azeret Mono, uppercase, 12px, tracking 0.04em, for kickers, nav, card numbers like
  `01 / 04` and button labels. Card copy in mono uppercase at 14px.
- Paragraphs Archivo 400, normal width, 16 to 18px, sentence case.
- Buttons are the bracket button of the reference. Mono uppercase label inside four L shaped
  corner marks, 8px arms, 1px lines, no fill, 44px tall. Hover fills the box with the text colour
  at low contrast and moves the corners out 2px. One filled variant for the form submit.
- Dot art everywhere the reference has point clouds, drawn as SVG circles. Theme it on the hill in
  the BullHill name. A dotted 3D hill or terrain mesh in the hero in place of the dot sphere, a
  radial dot field behind the process title as in frame 03, a dotted wave of terrain as in frame
  14. Dots `--bh-grey-400` to `--bh-grey-600` at 1 to 2.4px with depth by size and opacity. One
  line of bull-red dots along a trench cut through the hill, the only colour in the art.

## Sections, in order

1. Header. Logo `on-dark` top left, 40px tall desktop, 32 phone. Desktop nav right in mono
   uppercase 12px, the five nav items, then the LangSwitch, then a bracket button Call us. Sticky,
   #111 at 92 percent with a backdrop blur. Phone shows logo, a square bracket icon button for call
   and a bracket Menu button. The menu Dialog is full screen #111 with the nav items as huge
   uppercase 40px lines, as the reference footer nav, plus call, email and the LangSwitch.
2. Hero, #111, at least 100svh. Dot hill art centred behind the type. Headline split the way
   frame 00 does it, `c.hero.split[0]` upper left and `c.hero.split[1]` right aligned lower,
   64px desktop. Phone stacks them, first left, second right aligned, 40px. Mono lede bottom left at
   14px with two bracket buttons, Call us and Send the job, and a mono Scroll cue bottom right.
3. Ethos and services, `id="services"`. The light panel rides up over the hero bottom with its
   24px top radius. Left mono kicker `c.ethos.kicker` and the uppercase title. Right a top hairline,
   the body paragraph and a bracket button. Below it the four service cards as in frames 01 and 02,
   tall, overlapping each other by about 24px with 24px radius, each with its dot illustration (a
   trench cut in a dot grid, duct circles in a dot ring, a dotted house with a line in, dotted
   layers closing), the title uppercase centred, `01 / 04` in mono and the short copy in mono
   uppercase centred. Phone stacks the cards full width, each overlapping the one above.
4. Process, `id="process"`. Light ground with the radial dot field. Mono kicker centred, the
   title uppercase 56px centred, the lede centred, as frame 03. Then the reference's big list as in
   frame 04, here the trench layers from `c.process.layers` top to bottom, each line uppercase 64px
   desktop and 32 phone, greys from light to dark with Ducts in #111 as the one in focus and its
   note beside it in mono, the cross section told in type. Then the four steps in a row of
   hairline columns, mono `01 / 04`, uppercase title 20px, body 16px. Phone stacks the steps.
5. Projects, `id="projects"`. Light ground, mono kicker, title uppercase centred and a bracket
   button, as frame 05. Then the portfolio row as frames 05 and 06, a horizontal scroll snap row of
   project cards, the centre card raised on #ececE9 with bracket corners, placeholder photo, title
   uppercase, place and region in mono, and the length, year, client and scope as mono rows with
   hairlines. Square prev and next buttons with arrow icons below, they scroll the row.
6. Crew, `id="crew"`. #111 section with 24px top radius, mono kicker row as frame 06's leadership
   bar. Mono intro centred, then the line `c.crew.title` uppercase 40px centred, a strip of three
   crew placeholders cropped to a wide eye level band as frame 07, then a second line uppercase.
   Names and roles under the strip in mono. Then the stats from `c.stats` as four large numbers,
   uppercase 64px, unit smaller, mono labels, hairline separators, not boxed. Then the fleet as mono
   rows and the regions as a mono line.
7. Audiences. #111 with a scattered dot field, frames 08 to 12. Operators first, text left
   (mono kicker, uppercase title 40px, mono body 14px, bracket button) and the three point cards
   stacked right with 24px radius, bull-red, charcoal, light, each with a small pixel icon top right
   drawn in SVG squares, a big uppercase title 24px top left, the number `01` and a hairline near
   the bottom and the body. Contractors mirrored, cards left and text right. Phone stacks text then
   cards.
8. Contact, `id="contact"`. A light panel with the form, mono labels, underline fields, the role
   choice as bracket toggles, the filled bracket submit, the reply promise in mono. Next to it on
   desktop, or below it on phone, the big call line, phone number large, email and WhatsApp.
9. Closing panel as frames 14 and 15. Desktop left half #111 with the dotted hill art, right a
   bull-red panel with 24px radius holding `c.form.title` uppercase, a short mono line, a bracket
   Call us, a cluster of black rounded duct ends in place of the reference's black pills, then the
   nav as big uppercase links 28px, the address and the legal links in mono, the company line and
   the rights line. Text on red is black or white, never grey.

## Refuse

- No teal, no orange, no blue. No photo backgrounds behind the hero type. No sentence case
  display headlines, this pathway is uppercase all through.
