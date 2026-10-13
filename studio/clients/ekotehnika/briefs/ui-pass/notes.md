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

## Scan of the other five sites, items to copy

Screens in `refs/scan/<site>/`, shot at 1440 by 900 with cookie banners hidden.

19. **D drone.riotters.com, the closest to an Awwwards light industrial look.** Lenis, five WebGL canvases, Switzer
   type with protoMono labels. Said: "I like the UI here too, maybe it's a bit too advanced but still good example."
   D01 `d01-giant-light-wordmark-hero.webp`, a 240px weight 300 wordmark with -13px tracking, pale on white, the
   product reveals behind it. D02 `d02-scroll-fill-text-on-split-grid.webp`, the screen split by one hairline into
   halves, a statement filling grey to ink on scroll. D03 `d03-spec-row-hairline-cells.webp`, three figures (5
   returns, plus or minus 2 cm, 450 m) in hairline cells with tiny mono captions, a dial arc drawing above them.
   D04 `d04-giant-light-section-title-inline-tabs.webp`, section titles at about 120px light with a numbered circle
   marker and inline text tabs under them. D05 `d05-spec-table-mono-labels.webp`, a small spec table of hairline
   cells, mono label over value. D06 `d06-product-cut-out-with-spec-callouts.webp`, the product cut out large,
   callout text left and right.
   Copy for us. Geist 300 at display sizes for section titles, scroll fill text, spec rows and tables for each Linde
   truck (nosivost, visina dizanja, baterija), numbered section markers, the cut out with callouts for prodaja.
20. **F floema.com.** Lenis, Zimula type. F01 `f01-hero-floating-product-images.webp`, small product images drift
   in and settle around the hero line. F04 `f04-category-list-with-inline-thumbs-and-counts.webp`, a centred list of
   categories at about 40px with an icon, a small product image inline and a count, Urban (51). F06
   `f06-footer-brand-shape-and-line-drawings.webp`, the footer is a brand colour band with one huge brand shape and
   line drawings of the products standing on a ground line. F03 cut outs on light ground, F05 quote band and a
   three step row (we design, we build, we implement).
   Copy for us. F04 for Proizvodi (Čeoni viljuškari with a small truck image and a count of models), F06 for the
   footer with the drawn Linija trucks on a ground line, F05 three step row for servis or najam.
21. **O orano.group, corporate, mostly news.** O01 `o01-process-cycle-row-with-icons.webp`, the full cycle of the
   business as a row of steps with icons on a band, plus marks on a grid. O02 `o02-network-map-dans-le-monde.webp`,
   a dark map drawn as a dot and line network with the sites listed beside it. O03 a statement over a landscape
   photo with one word highlighted on a solid block.
   Copy for us. O02 as a servisna mreža map of Srbija i Crna Gora (servisna vozila širom Srbije is a real claim),
   O01 as the cycle prodaja, najam, servis, delovi, otkup.
22. **A animejs.com.** A dark instrument dial in the hero, the shape inside morphs while the rings stay, and section
   titles in different accent colours appear around it as you scroll. Earlier scan showed a 3D part that turns into
   a line drawing on light and then an exploded view. Copy for us. One instrument at S (a gauge for the X50 with
   real figures), and the shaded to line drawing to exploded sequence as the bridge from P into the servis
   schematic (pairs with S7).
23. **B brand.dropbox.com typography.** B01 type hero on a visible grid with blue hairlines and editor style
   handles. B02 specimen blocks, B03 a collage of type in many sizes and weights on colour tiles. Copy for us. The
   type system idea, one family (Geist) used across weights 300 to 600 with a strict scale, and the visible grid
   with handles as UI flavour (note 5).

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
S6. **Version 5, S, the servis screen.** Ref `refs/scenes/s06-v5-s-servis.webp`, Filip marked the left block.
   Said: "Bad UI on the left, too much space unused. The UI execution again bad."
   What is there now. Kicker, a two line title at about 96px, two lines of body, two dark glass tiles (Hitan servis
   with the number, 300+ tipova vozila) and the red Zakažite servis button, all packed into the top left third.
   The rest of the dark frame holds only the diagonal lines and the X50 blueprint far right, and the lower half and
   the middle are empty.
   Also seen. In this frame the blueprint shows the cab and wheels but no mast or forks, so the truck reads as a
   small car. A defect to fix in the scene.
   Candidates on file for the fix. Ref 06 is this beat almost one to one. Left column on the grid, the blueprint
   larger and centred, a giant faded figure behind it, a counter on the right edge, one data line at the bottom in
   place of the two tiles. Same shared column problem as S4.
S7. **Version 5, S, the blueprint is not a proper schematic.** Ref `refs/scenes/s07-v5-s-blueprint-not-precise.webp`,
   Filip marked the blueprint. Said: "The illustration on the right feels too much hand drawn, lines not precise,
   doesn't feel like a proper schematic. Schematics are really precise."
   What is there now. The X50 mesh drawn as edges geometry in a three quarter perspective view, with a soft glow.
   Every mesh edge above the angle threshold shows, so the tyre treads turn into dense clumps, lines overlap and
   double up, all lines have the same weight, and there are no dimensions or construction lines. Mast and forks are
   missing (S6).
   What a precise schematic needs, my read. An orthographic view (side elevation, or a clean isometric), silhouette
   and key feature edges only, two line weights (outline heavier, detail thin), dashed hidden and centre lines,
   dimension lines with arrowheads and real X50 figures, a fine measuring grid behind, no glow. The drawn Linija
   blueprint on S is already closer to this than the 3D one.
   Open. Whether the wheels still turn in the schematic. Default yes, the wheel outlines rotate with the clock.
S8. **Version 5, N, empty sides of the najam screen.** Ref `refs/scenes/s08-v5-n-empty-sides.webp`, Filip marked the
   two empty fields left and right of the text, above the platform. Said: "Nothing here illustration wide, can be a
   grid or something else".
   What is there now. A centred stack (kicker, title, a wide box with the red button, four tiles) above a white
   platform with fifteen trucks in five by three bays. Both upper corners, about a third of the width each, are
   plain light-grey ground, and the platform edges fade off into nothing.
   Options Filip named or that fit. The visible layout grid from note 5 running edge to edge with plus marks. The bay
   lines of the platform extended to the full width as a depot floor, with more trucks or empty bays to the edges.
   Rental details placed on the grid in those fields (from note 3 cards or ref 06 data lines).
   Also seen. The same centred title, box and equal tiles stack as S5, so the S5 rule applies here too.
S9. **Version 5, N, the najam text block, UI, UX and layout all bad.** Filip marked the centred kicker, title, the
   wide box with the button and the four tiles. Said: "Really bad UI/UX, layout, everything here."
   Screenshot `refs/scenes/s09-v5-n-text-block.webp` when it saved, else see S8's shot, same frame.
   What is there now. The same stack S5 rejected. A dot kicker, a 64px title, a hairline box with one 18px line and a
   red pill button, four equal white tiles with a 22px title and a 14px caption, all centred over the platform and
   reading as a generic template. The six rental facts carry the same weight, so nothing leads.
   Read. One block design repeats on P and N, so both get rebuilt together. The UX gap is the same too, the visitor
   gets facts but no next step besides one button, no fleet to browse, no price or duration to choose.
   Candidates on file. Note 3 offering cards for the fleet, T06 calculator for najam (duration and count to a
   ponuda), ref 06 one big figure (24 sata) with a data line, note 5 grid.
S10. **Version 5, AT, automatizacija taken too literally.** Ref `refs/scenes/s10-v5-at-automatizacija.webp`.
   Said: "This screen is part of the storyboard - but taken too literally, bad execution illustration and UI wise."
   What is there now. The word automatizacija set at about 270px across the full width, one centred line under it,
   and seven top down robots (C-Matic models scaled up about 3 times) on dotted diagonal paths between pale circle
   docks, on a light floor. It copies Figma frame 31 nearly one to one, the robots read as toys at that scale, the
   dots and circles look like a diagram, and the giant word does all the work with nothing to read or do after it.
   Read. Filip keeps the beat (automatizacija is in the story) but wants it designed, not traced from the storyboard.
   Candidates on file. T02 real render with a wireframe overlay (the C-Matic at true scale in a warehouse, its route
   drawn as a precise system overlay). Note 4 statement marquee for the word. T07 scroll fill for the line. A real
   offer line from Ekotehnika on what automation they sell, plus one CTA, which the beat has none of today.
   Open. Whether the giant single word stays at all.
S11. **Proizvodi section, all versions.** Ref `refs/scenes/s11-proizvodi-section.webp`. Said: "Wordpress 2011
   screen, really bad".
   What is there now. A dot kicker and a 96px title (Glavni proizvodi) on white, five equal grey cards with a thin
   line icon at the top and the model name and type at the bottom, a row of four 4 by 5 delivery photos with rounded
   corners, then one red Pogledajte modele button, all left aligned in a 1344px column. Every block is a plain grid
   of equal boxes stacked one under another, with no hierarchy, no motion and no link from a card to a model.
   Read. The photo strip Filip accepted on 2026-10-09 is in it, so the idea of real photos stays open, but this
   execution is rejected along with the rest of the section.
   Candidates on file. Note 3 staggered offering cards with real Linde cut outs and a notched tab. T08 tabbed cards by
   truck type. Ref 02 text left with a collage of the delivery photos. T03 notched edge into the section.
S12. **Footer, all versions.** Ref `refs/current/v5-footer.webp`, the live footer at 1440 (Filip's screenshot did not save).
   Said: "same for footer giga bad execution".
   What is there now. An ink band with the boxed logo tile and a one line lede on the left, then three plain columns
   (Navigacija, Adresa, Kontakt) of 15px text links, a hairline, and a small copyright line, all inside the 1344px
   column with wide empty ink at both sides. No closing statement, no CTA, the emails as plain text, nothing larger
   than 15px except the logo.
   Candidates on file. T11 closing band with one big line and one button before the footer, T03 notched edge into it,
   note 5 grid for the columns, the logo unboxed per S2, a large Hitan servis number as the one loud element.

## Round 2, Filip on the first build

R1. **Buttons.** `refs/round2/r1-buttons-and-numbers.png`. Said: "Make sure we're designing buttons to be modern do a few variants". Numbered variants to pick from.
R2. **Numbers.** Same shot. Said: "Don't use this font for numbers". Daxline Pro has old style figures only, so digits move to Geist lining tabular figures.
R3. **Schematic.** `refs/round2/r2-schematic-before-after.webp`. Said: "Schematic I liked it better in 3d and perspective how it was done before just mind my comments on the lines / execution/design". Back to three quarter perspective with precise lines.
R4. **Arrows.** `refs/round2/r3-list-arrows.png`. Said: "Don't use arrows like I marked in the design they ugly af". No arrow glyphs anywhere.
R5. **Section marker.** `refs/round2/r5-section-marker.webp`. Said: "i dont liek this change it", marking the circled 02 and KOMPANIJA above the R title. Numbered variants to pick from.
R6. **Spacing in the R fact list.** Said: "we can do better spacing here", marking the gap between the lede and the first fact row, where the first hairline sits about 20px under the lede and cuts the VRČIN label. One 8px rhythm for every fact list and spec row.
R7. **Buttons, sharp corners, more variants and hovers.** Said: "for buttons we need to keep corners sharp, but add more variants and hovers". R8. **Button priority on dark.** Said: "We also can't have 3 buttons on darkmode that are same level of priority - need to have primary/secondary (phone numbers are secondary)".
