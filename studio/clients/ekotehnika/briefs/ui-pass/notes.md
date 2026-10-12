# UI pass and polish, Filip's notes

Raw notes as Filip gives them, in his words where possible. Nothing here is built until he says he is done
and the plan is agreed. The story stays as it is.

## Notes

1. **Text reveal animation, block wipe.** Ref `refs/01-text-reveal-block-wipe.webp` (a McLaren helmet site).
   Said: "I like this version of text reveal animation but styled for us yeah color wise".
   What the ref does. Each headline line is covered by a solid colour bar that slides off to show the text,
   line by line, staggered. The small labels and their links (PAGES, FOLLOW ON) reveal the same way.
   Open. Bar colour. Red is only for primary actions (APP-WIDE ruling 2026-10-09), so my default is ink bars on
   light beats and white bars on the dark servis beat. Linde red bars would need Filip to open that rule.
   Open. Where it applies. Default is every hold beat's title and tile text, plus the hero headline.
2. **Screen layout, text left with a clear CTA, image collage right.** Ref `refs/02-left-text-collage-grid.webp`
   (Lando Norris store). Said: "This is a good UI screen - look at elements placement, content grid, images, text
   on the left with clear CTA".
   What the ref does. One text column in the left third, a small kicker with an icon, a three line headline set
   very large, three lines of body, one bright CTA right under it. The right half holds one tall portrait image,
   with two or three smaller images placed off grid around it, overlapping its edges and the text column's edge.
   A lot of empty ground, a faint line pattern behind.
   Open. Which screens. My read is the hold beats with text (C1, R, P, S, N) and Proizvodi.
   Open. Two rulings it touches. The headline mixes a heavy sans and a light serif, and the 2026-10-08 ruling is sans
   serif only. The images are photos, and the 2026-10-09 ruling keeps real photos to one strip in Proizvodi, so a
   collage needs either the 3D or drawn scene as the images or Filip opening that rule.
3. **Offering cards in a staggered grid.** Ref `refs/03-offering-cards-staggered-grid.webp` (Lando Norris helmets).
   Said: "same here - good grid, good UI, great UI card for the offering example".
   What the ref does. A section head with a two line title on the left and a short paragraph top right. Below, four
   columns of tall cards, every other column dropped half a card, so the grid steps. Each card is a hairline
   outline on the ground, one product cut out and centred, and a notched tab in the bottom right corner with the
   name and a year in the accent colour.
   My read. This fits Proizvodi and the najam fleet, one Linde model per card, name plus type or capacity in the tab.
   Material. The truck folder in the Drive holds about 9,000 PNGs, many of them official Linde cut out renders
   (files named Freisteller), so real product images per card are likely there. The eight GLB models can also be
   rendered as cut outs in one consistent light.
   Open. Same serif accent in the title as note 2. Card tab text in linde red would break the red only for actions
   rule, so the default is ink name and text-grey detail.
4. **Statement moment, giant marquee text around a centred image.** Ref `refs/04-statement-marquee-centre-image.webp`
   (Lando Norris, message from Lando). Said: "Same here".
   What the ref does. A small mark and a tiny label centred at the top. Two lines of very large type run edge to
   edge and move sideways with scroll, the two rows in opposite directions. One image card sits dead centre and the
   type passes behind it. A hand drawn signature strokes on over the image.
   My read. One pause in the page that says who Ekotehnika is, between the story and Proizvodi or as the Kompanija
   opener. Candidate line, the company's own tagline from its logo, "Snaga koja pokreće", or a claim already on the
   site such as Od 1997.
   Open. The centre image. No owner photo is on file and the signature has no Ekotehnika equivalent, so my default
   is a lit Linde truck render or one delivery photo in the card, and no signature. Same serif accent as notes 2 and 3.
5. **UI placed against a visible grid.** Ref `refs/05-visible-grid-lines-crosshair.webp`, layout only, not its
   content. Said: "I like placement of UI against a grid on the website - it adds to flavor and makes it look like
   geometric".
   What the ref does. Hairline guide lines stay visible on the page, a vertical centre line and a horizontal rule,
   with a small plus mark where they cross. Image, caption and text blocks snap to those lines, so the layout
   reads as measured.
   My read. It suits an engineering brand and echoes the servis blueprint. Hairlines in shade-grey on the light
   beats and a faint white on the dark servis beat, a plus mark at the crossings, every text block and tile edge
   sitting on a line. Lines never run through text.
   Open. Whether the grid is fixed to the screen for the whole story or drawn per section.
   Second example, shown in chat only (its file was not saved), layout only. Said: "Another example what i said above".
   A hairline rule under the top line and one above the bottom edge frame the screen, and a vertical hairline splits
   it into two equal halves. The object sits centred in the left half, the text block centred in the right half,
   and small tab labels run along the top of the right half with a dot over the active one.
6. **Servis screen, a better design than ours.** Ref `refs/06-servis-screen-wireframe-data.webp` (Citrix and an
   F1 team). Said: "example this is better screen design vs what we have for services".
   What the ref does. Left column, a small uppercase kicker, a large two line title, two lines of small body, a
   round play button with its label, and one text link. Centre, the car as a glowing wireframe on dark, with the
   wheels lit hot as the one highlight. Behind the car, one giant faded number with its unit and a widely spaced
   label (8958 RPM, rotational speed). Right edge, a section counter (02 over 03) and a thin vertical progress line.
   Bottom, a small label with one line of data (telemetry data).
   How it maps to our S beat. The X50 blueprint is our wireframe, the turning wheels are the highlight, a giant faded
   figure sits behind it from the servis copy (300+ tipova vozila, or the Hitan servis number), the counter shows the
   section, and the bottom line carries one servis fact. Our two tiles would go, replaced by the data line.
   Open. The wheel highlight colour. Red glow is what the ref uses, and red is only for actions today. Default is a
   white glow, red only if Filip opens that rule for the servis highlight.
   Open. The round play button. We have no servis video, so the CTA stays Zakažite servis unless a video exists.
7. **Sites to scan for layout and animation ideas.** Said: "check and scan this website for improvements even on
   the animations etc", "Also check the UI layout too", for https://terminal-industries.com/,
   https://animejs.com/, https://floema.com/en and https://brand.dropbox.com/typography (Filip, "this one too"), then https://www.orano.group/ ("now this too"). Once Filip allows them, each gets a full scroll at 1440 with section shots and frame steps of the motion,
   and the findings land here as their own notes.

## Scan of terminal-industries.com, items to copy

Screens in `refs/scan/terminal/`, shot at 1440 by 900. Logistics, trucks and yards, so the closest match to
Ekotehnika of the five sites. Built on Lenis smooth scroll and one WebGL canvas. Type is Suisse Intl for
headings and body, and Geist Mono 11px uppercase for every label and button, which pairs with our Geist.

8. **T01 Floating nav bar.** `t01-hero-cinematic-truck-and-floating-nav.webp`, `t01b-nav-pill-detail.webp`.
   One rounded grey glass bar, about 1110px wide and 78px tall, inset from the top and the sides. Logo, five links
   with small chevrons, an ask box, then three buttons with mono uppercase labels, the bright one first.
   Copy. A single bar for our top row in place of the separate tile, links and pills, with our two phones as the
   two outlined buttons and Zatražite ponudu as the one filled one. Mono uppercase for the button labels.
   Clash. The co-branding sizes, a 160 by 96 Linde logo does not fit a 78px bar, so the bar grows or the logo sits
   outside it. Filip to choose.
9. **T02 Real render with a wireframe overlay.** `t02-real-render-with-wireframe-overlay.webp`.
   A lit photo real truck where part of it is redrawn as a glowing wireframe, real and digital in one frame.
   Copy. The Z to P or A beat, a lit Linde model with its wireframe drawn over half of it, which leads into the
   servis blueprint. Our models and edges geometry already do this.
10. **T03 Section edge with a notch.** `t03-scroll-text-and-notched-section-edge.webp`.
   A dark section ends on a curved bottom edge with a wide notch, and the next light section slides up under it.
   Copy. The cut between the pinned story and Proizvodi, and between Proizvodi and the footer. Matches the tab
   shapes in refs 01 and 03.
11. **T04 Logo wall on a visible grid.** `t04-logo-wall-on-visible-grid.webp`. Client logos in grey, one per grid
   cell, with hairlines and plus marks at the crossings. This is note 5 in practice.
   Copy. A Klijenti row, only if Ekotehnika gives permission to show client logos. Filip to confirm.
12. **T05 Three path cards with mono step labels.** `t05-three-path-cards-mono-labels.webp`.
   Three equal cards, a mono label (01 Fast start), a short title, three lines, an image, a full width button.
   Copy. Najam, Prodaja, Servis as three entry points, each card with its own CTA.
13. **T06 Calculator with a dark result card.** `t06-roi-calculator-dark-result-card.webp`.
   Inputs on the left (gates, shifts, wage), a dark card on the right with a big live result and a notched tab.
   Copy. A najam calculator (koliko viljuškara, koliko meseci) with a price range in the result card and a
   ponuda form under it. Needs real price data from Ekotehnika, otherwise dummy. Filip to decide if it is in scope.
14. **T07 Scroll fill text reveal.** `t07-scroll-fill-text-reveal.webp`, `t07b-scroll-fill-text-reveal-later.webp`.
   A heading and its paragraph start in pale grey and fill to ink letter by letter as the user scrolls, with a mono
   step number (02) beside them. Measured, body at about 34px, line height about 41px.
   Copy. The hold beat text on C1, R and S, filled by the story clock rather than a fade. Pairs with note 1.
15. **T08 Tabbed feature cards.** `t08-tabbed-feature-cards.webp`. Mono pill tabs (at the gate, in the yard) over a
   row of large cards, the active one bright with text, the next one grey, arrows to page.
   Copy. Proizvodi by truck type, tabs for čeoni, retrak, paletari i slagači, komisioneri.
16. **T09 Quote over a full bleed photo.** `t09-quote-over-full-bleed-photo.webp`. One client quote, centred,
   white on a dark photo, name and company under it. Copy only with a real quote from Ekotehnika.
17. **T10 Contact form on a dark card.** `t10-contact-form-dark-card.webp`. A short checklist of what happens next
   on the left, a dark form card on the right. Copy for the ponuda form.
18. **T11 Closing CTA and footer.** `t11-closing-cta-and-footer.webp`. A dark green band with one big line and one
   button, then the footer in the same colour. Copy the structure in ink for our footer.

## Scenes Filip does not like or wants improved

S1. **Version 5, C1, the colouring is bad.** Our shot of the current state `refs/scenes/s01-v5-c1-now.webp`.
   Said: "Coloring here is bad", marking the band from the top row down to the forklift's mast top, across the
   title and the EKOTEHNIKA sign.
   What is there now. One flat mid warm grey wall fills that whole band, edge to edge, with the title and the 3D
   EKOTEHNIKA letters both in ink on it, a slate teal door block, and pale grey blobs for shrubs along the kerb.
   The grey reads muddy against the white ground below, and the title and sign compete on the same tone.
   Open. What Filip wants instead. My read is a light ground behind the title (white to light-grey), the building
   as a lighter form with real windows and edges, the sign as the one dark element, and shrubs that read as plants.
S2. **Bad UI on the top row and the C1 tiles, version 5.** Ref `refs/scenes/s02-v5-c1-top-row-and-tiles.webp`,
   Filip marked the top row and the bottom band with the lede and three tiles. Said:
   "I don't like the fact the logo is boxed up".
   "Poorly executed button design".
   "The empty space between the UI/animation is low, we can't clearly read the information".
   What is there now. The two logos sit in a white rounded tile. The phones are two thin 1px outline pills with
   15px text. At C1 the lede and the three white tiles sit right under the road, touching the scene, with no ground
   between the picture and the text.
   Open. Logo without a box. On light beats the red Linde block and the graphite wordmark can sit straight on the
   ground. On the dark servis beat the graphite wordmark fails contrast, so it needs a white version, and the
   co-branding guideline asks for graphite, so a white wordmark is Filip's call. Ties to T01, the floating nav bar.
   Open. Buttons. T01 (filled primary, mono labels, solid secondary) is the strongest candidate on file.
   Open. Space. My read is a clear band of plain ground between the scene and every text block, the scene framed
   smaller or higher at the hold beats, so text never touches the picture.
S3. **Version 5, R, too much empty space around the top down road.** Ref `refs/scenes/s03-v5-r-empty-top-down.webp`,
   Filip marked the two empty fields left and right of the road. Said: "Bad here - too much empty space, we don't
   have anything around here on the illustration itself".
   What is there now. One straight grey road with a white centre line and the forklift on it, then plain light
   ground on both sides, edge to edge, with nothing drawn in it.
   Open. What fills it. My read is the Ekotehnika yard seen from above, roofs of the two halls, rows of parked
   forklifts, pallets and racks, kerbs and lane markings, trees and grass edges, a van at the gate, all in the light
   palette, kept clear of the R text column. The drone stills in the Drive (ANDronEkotehn-1010, 1011, 1019, the
   yard straight down with rows of forklifts) are the drawing reference for the real layout, used as reference only,
   since drone footage is out.
S4. **Version 5, R, the whole left column is bad.** Ref `refs/scenes/s04-v5-r-left-column.webp`, Filip marked the
   kicker, title, subheadline and the three cards. Said: "This whole UI on the left is bad", "Bad subheadline",
   "Bad cards", "Doesn't feel premium. No grid on this page, nothing just like really bad."
   What is there now. A small dot kicker (Kompanija), a two line title at about 64px, a two line subheadline at 16px
   in text-grey, then a gap and three white rounded cards stacked at the bottom, each a 22px title and a 14px caption.
   Nothing lines up with anything else on the screen, and the column floats.
   Read. This is the shared shell, so the same column style shows on C1 and servis in every version.
   Open. Subheadline, the copy, the style, or both. The line is "Iz Vrčina, na južnoj ivici Beograda, naši tehničari
   rade sa originalnim Linde delovima", from the competitive analysis.
   Candidates on file for the fix. Note 5 grid, every block on a line. T07 scroll fill for the text. T05 mono step
   labels. Ref 06 data line in place of cards (a big figure, a mono label, one line). Ref 02 placement.
S5. **Version 5, P, the prodaja screen.** Ref `refs/scenes/s05-v5-p-prodaja.webp`, Filip marked the whole screen.
   Said: "Giga bad AI slop screen".
   What is there now. Everything centred in one stack, a dot kicker, a 96px title, a wide hairline box with one line
   and the red Zatražite ponudu button, then four equal hairline cards each with a thin line icon, a name and a model.
   The lower half of the screen is empty white, with a faint lighter panel behind the middle. Nothing ties it to
   the warehouse scene, every element has the same weight, and the icons are generic.
   Candidates on file for the fix. Note 3 staggered offering cards with real Linde cut out renders. T08 tabbed
   feature cards by truck type. Ref 02 text left with the products as the images. Note 1 block wipe on the title.
