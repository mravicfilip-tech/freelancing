# Pathway 2, Daylight

Reference https://trymeridian.com/ about 90 percent. Read `build-rules.md` first.

## Reference frames

Desktop frames at
`/tmp/claude-0/-home-user-freelancing/47010749-f8fd-541e-a7be-8b4f6076588b/scratchpad/refs/meridian_1440/NN.png`,
phone frames in `meridian_390/`. Contact sheets `refs/meridian-sheetA.jpg`, `meridian-sheetB.jpg`,
`meridian-phone.jpg` next to this file. Open the frames, do not work from this text alone.

- 00 hero with the dotted sphere and the floating UI card, 01 logo strip and the photo row, 02
  case study slider, 03 to 05 the photo cluster around a centred paragraph, 06 to 08 the bento of
  feature cards with UI widgets, 09 and 10 the huge headline with the three step rule and the cards
  under it, 11 why brands choose and the testimonial row, 12 and 13 the black footer with the
  glowing planet.

## Look

- Ground white and `--bh-grey-50` #f4f4f2. Text #000. The reference's orange becomes bull-red, in
  buttons, in the dots on the sphere, in progress bars and in the soft glows. Glows are radial
  gradients of bull-red at 0.10 to 0.55 alpha fading to transparent, warm and soft like the
  reference, never a second hue.
- Faint vertical dashed guide lines at the column edges on desktop, 1px `--bh-grey-200`, as the
  reference shows them behind every section.
- Type Geist, weight 400, sentence case. Display tracking minus 0.04em, line-height 1.05. Hero
  56px desktop, 40 phone. Section titles 48 desktop, 32 phone. The process headline 120px desktop,
  56 phone, as frame 09. Paragraphs 16 to 18.
- Mono Geist Mono 12 to 14px for nav links, card labels with a small line icon in front (as
  `BRAND ANALYTICS` in frame 06), meta lines and the table heads.
- Buttons. Primary bull-red fill, white text, 8px radius, arrow after the label, 44px. Secondary
  #000 fill white text. Tertiary white with a 1px #000 border. Hover darkens to bull-red-dark or
  lifts the border.
- Cards `--bh-grey-50` with 12px radius, the bottom half carrying a bull-red radial glow as frames
  06 to 10. UI widgets inside are white cards with 8px radius and a soft level 1 shadow.

## Sections, in order

1. Notice bar. #000 bar, 40px, white 14px centred line, a stand-in about booking routes for the
   2027 season with an underlined link to the form, and a close button. Put its copy in `copy.ts`.
2. Header, as frame 00. Logo `on-light` left, 40px tall. A white pill nav with a 1px border in
   the middle right with the five items in mono, then a Call us outline button and a Send the job
   bull-red button with an arrow. Sticky. Phone shows the logo, a bull-red call button and a
   white Menu button as the reference phone frames do. Menu is a Dialog sheet from the top, white,
   items at 32px, LangSwitch and the two buttons.
3. Hero. Text left, `c.hero.title` 56px, the lede, a bull-red Send the job and a black Call us.
   Right a large sphere as in frame 00, here a hill shaped dome rising from the section bottom,
   dark charcoal glass built from radial gradients, covered in a grid of small ring dots with some
   filled bull-red and glowing. Over it a floating white route card in the reference's style, a
   bull-red header strip with a mono line naming the route, then mono labels and values for
   length, ducts, chambers and a progress figure with a small bull-red delta chip. Bull-red glow
   across the section bottom. Phone puts the dome under the text, cropped by the screen edge, as
   the reference phone frame 00 does.
4. Logo strip, as frame 01. A centred line from `copy.ts` about operators and contractors, then a
   row of six stand-in client logo slots that read as placeholders, mono `CLIENT LOGO` in
   `--bh-grey-400`, no boxes. The row scrolls sideways on phone.
5. Ethos with a photo row, as frame 01. `c.ethos.title` 48px left, then a row of placeholder
   photos with 12px radius bleeding off the right edge, the middle one widest.
6. Project slider, as frame 02, `id="projects"`. Prev and next round buttons at the far edges, a
   centred project headline built from the project in `copy.ts` per project, the meta line in mono
   with a bull-red square between length and region, and a bull-red button to the contact form.
   The buttons switch project. A dot pager below on phone as the reference phone frame shows.
7. Photo cluster, as frames 03 to 05. Eight placeholder photos of mixed sizes, slightly rotated
   between minus 6 and 6 degrees, scattered around a centred paragraph, `c.ethos.body`, with a
   bull-red Meet the crew button and an underlined How we build link. Phone keeps two photos above
   and two below the text.
8. Services bento, `id="services"`, as frames 06 to 08. Title left, `c.services.title` then the
   lede as part of the same 48px headline in a lighter grey, the way frame 06 runs one long line.
   Then four cards in a bento, two wide and two narrow on desktop, each with the mono label and
   icon, the short and body copy and one widget. Trenching gets a depth gauge, ducts get a black
   table as frame 07 with duct, size and status rows, connections get a big counter with a bull-red
   progress bar, restoration gets surface chips. Phone stacks the cards.
9. Process, `id="process"`, as frames 09 and 10. `c.process.title` at 120px left. Then the four
   steps as columns with uppercase titles and body, over a hairline with small black square nodes
   at each column edge. Then a row of four cards, the first a placeholder photo, the other three
   carrying widgets, percent bars for trench, ducts and restored, a checklist with bull-red checks,
   and a small metric table. Phone stacks everything, the step rule runs between steps as on the
   reference phone frames.
10. Audiences and stats, as frame 11. A 120px headline from `copy.ts`, why operators and
    contractors book BullHill, with a paragraph right. Then the four stats from `c.stats` open on
    the page, Geist 64px, labels in mono, not boxed. Then two black cards side by side for
    operators and contractors with a placeholder photo strip at the top, title, body, the three
    points with bull-red check icons and a button. No testimonials.
11. Crew, `id="crew"`. Title left, body right, three portrait placeholders with 12px radius, the
    fleet as a black table in the frame 07 style with machine, size and count, the regions as mono
    chips.
12. Contact, `id="contact"`. Grey-50 ground with a bull-red glow. Left the form title 48px, the
    lede, the phone number at 32px, email and WhatsApp. Right a white card with the form, fields on
    grey-50 with 8px radius, mono labels, the role choice as segmented chips, a bull-red submit.
13. Footer, as frames 12 and 13. #000. Logo `on-dark` top left, link columns with a mono Quick
    links head, right a white 48px line from `copy.ts` asking for the route, the lede and the two
    buttons. At the bottom a huge glowing bull-red hill rising from the bottom edge, the planet of
    the reference, a radial gradient from bull-red through bull-red-dark into black with a soft
    outer glow. Bottom row in mono, privacy, rights, legal notice.

## Refuse

- No orange, no green delta chips, use bull-red or black chips. No testimonials or quotes, they do
  not exist yet. No real company logos.
