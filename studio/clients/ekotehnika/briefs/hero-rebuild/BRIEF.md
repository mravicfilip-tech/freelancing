# Ekotehnika hero rebuild brief

Rebuild the homepage hero of ekotehnika.rs as one layout with three motion variants. The new hero has two jobs. Explain in five seconds what Ekotehnika does, and turn more visitors into quote requests and phone calls.

Everything you need is in this folder. Screenshots of the live site are in `screenshots`, captured 8 October 2026 at 1440 by 900.

---

## 1. What to build

- One self contained file, `index.html`. Plain HTML, CSS and vanilla JS. GSAP from cdnjs is allowed if it makes the motion cleaner. No build step.
- Desktop at 1440 by 900 is the target. Phone layout is left out on purpose.
- One hero layout, described in section 7. Three motion variants of that same layout, described in section 8.
- A small floating switcher in the bottom right corner labelled V1, V2, V3, plus keys 1, 2 and 3, so the variants can be compared. The switcher is review chrome and not part of the design. Switching replays the variant from the start.
- Show the real site header above the hero (logos, top contact bar, nav) so the hero is judged in context. Rebuild it from `04_header-nav.png`, do not redesign it.
- All copy in Serbian Latin script, from section 6.

---

## 2. Who Ekotehnika is

- Official Linde Material Handling dealer for Serbia and Montenegro since 2023, by its own account. Based in Vrčin, on the south edge of Belgrade.
- Founded in 1997 as a forklift repair shop. Service is the core of the business. Their own About page calls the service centre "the heart of our company".
- Sells new Linde trucks, rents them, sells used Linde Approved Trucks, services all brands, supplies parts, and offers Linde safety tech and automation.
- B2B only. Buyers are warehouse and logistics managers, plant managers, small business owners buying one or two trucks, procurement leads and safety officers.
- Nothing is sold online. Every visit should end in a quote request, a call or an email.

---

## 3. What is wrong with the current hero

See `01_home_above-the-fold.png` and the three `03_hero_slide` files.

| Problem | Evidence | Why it hurts |
|---|---|---|
| Hero sells products, not the company | Three rotating slides, a pallet truck promo, counterbalance trucks, an order picker | A first time visitor cannot tell that Ekotehnika also rents, services and sells used trucks |
| One generic CTA per slide | Only "Saznajte više" (Learn more) | No quote request, no phone call, nothing that captures a lead |
| Two of three slide CTAs leave the site | Slides 2 and 3 link to linde-mh.rs | Traffic and leads leak to the manufacturer site |
| The three quick links under the hero also leave the site | "Iznajmljivanje viljuškara", "Novi viljuškari", "Optimizacija flote" all go to linde-mh.rs (`05_quick-links.png`) | Same leak, on the most clicked tiles |
| Carousel hides two thirds of the message | Only one slide shows at a time | Most visitors never see slides 2 and 3 |
| Promo price is baked into the image | "AKCIJA" and "1.390 €" are pixels in the PNG | Not readable by screen readers or search, cannot be updated without a designer |
| No trust signal above the fold | No mention of 1997, official Linde status or national service coverage | The strongest reasons to choose them are hidden on the About page |
| Phone numbers are scattered | Five different numbers appear across the site, two to three in the top bar | Visitors do not know which number to call |

---

## 4. Goal and how to judge it

- A stranger can say what Ekotehnika does within five seconds of landing. Sales, rental, service and used trucks, all Linde.
- The primary CTA, a sales phone link and the trust strip are all visible at 1440 by 900 without scrolling.
- Every CTA stays on ekotehnika.rs or is a phone link. Nothing in the hero links to linde-mh.rs.
- Each motion variant makes the services clearer or draws the eye to the CTA. Motion for decoration only is a fail.

---

## 5. Brand tokens

Taken from the live site's CSS on 8 October 2026. Match them exactly. Do not invent new colours.

### Colour

| Token | Hex | Use on site |
|---|---|---|
| Linde red | `#aa0020` | Primary buttons, kicker text, active states, the red quick link tile |
| Dark red | `#990e1f` | Hover and pressed red |
| Toned red | `#cc132a` | Top bar phone chip, accents |
| Primary 700 | `#94001d` | Deeper red |
| Primary 900 | `#700016` | Darkest red, top bar email chip |
| Carousel red | `#ba1926` | Carousel accents |
| Ink | `#222222` | Headlines and body text |
| Text grey | `#4a595c` | Secondary text |
| Toned text grey | `#5e7175` | Tertiary text |
| Light grey | `#eeeff3` | Hero copy panel background, tiles |
| Shade grey | `#e6e7eb` | Dividers, panels |
| Hover light grey | `#f5f6fa` | Hover on light tiles |
| White | `#ffffff` | Page background |

Approximate contrast, checked by formula. Linde red on white is about 7.7 to 1. White on Linde red is the same. Text grey on white is about 7.3 to 1. All pass AA for body text.

### Type

| Role | Live site | Size at 1024 wide | Weight |
|---|---|---|---|
| Headline | DaxWebPro-Medi | 36px, line height 50px, letter spacing 0.5px. Larger at 1440, about 52px | 700 |
| Kicker above headline | DaxWebPro-Medi, Linde red | 18px | 400 |
| Body | DaxWebPro | 16px to 18px | 400 |
| Button | DaxWebPro-Medi | 16px | 700 |

Dax is a licensed Linde corporate font. Do not download it or embed it. Put `DaxWebPro` first in the font stack so it renders where installed, then fall back to Fira Sans from Google Fonts, which covers Serbian Latin letters (č, ć, š, ž, đ).

### Shape and imagery

- Buttons have a 5px radius, 15px padding, Linde red fill, white text, a 0.2s colour transition.
- Panels and tiles are square cornered. No shadows on tiles. Flat light grey panels on white.
- Photography is real Linde trucks in real warehouses, bright, red trucks against grey concrete. No illustrations, no stock people posing, no gradients.
- Two logos sit side by side at top left. The Linde Material Handling red box, then the EKOTEHNIKA wordmark. Use the image files below, never redraw them.

### Asset URLs

Hotlink these for the mock.

| Asset | URL |
|---|---|
| Linde MH logo | https://ekotehnika.rs/wp-content/uploads/2025/02/Linde_MH_Logo_RGB.jpg |
| Ekotehnika logo | https://ekotehnika.rs/wp-content/uploads/2025/02/EKOTEHNIKA-WEBSITE-LOGO-16-9_16x9w320.jpg |
| MT15 C pallet truck promo image | https://ekotehnika.rs/wp-content/uploads/2026/10/Paletar-MT15c-1200-x-675-px-ISPRAVAN.png |
| Counterbalance truck H20 to H35 in a hall | https://ekotehnika.rs/wp-content/uploads/2025/03/ic_truck-H20_H35-1202-H30-site_16x9w1920.jpg |
| N20 order pickers in a warehouse aisle | https://ekotehnika.rs/wp-content/uploads/2025/03/Order_picker-N20-Series_Moving-Warehouse-4540_8304_16x9w1920-1.jpg |

The MT15 C image has "AKCIJA" and the price baked in. Use it only if you crop those out or cover them. The price must appear as live text.

If an image fails to load, use a flat `#e6e7eb` block with the alt text centred. Do not substitute stock photos.

---

## 6. Hero copy

Serbian first, English in brackets for your understanding only. Do not show the English.

**Kicker**
Zvanični Linde partner za Srbiju i Crnu Goru
(Official Linde partner for Serbia and Montenegro)

**Headline**
Linde viljuškari. Prodaja, najam i servis na jednom mestu.
(Linde forklifts. Sales, rental and service in one place.)

**Sub line**
Novi i polovni viljuškari, najam od jednog dana i servis na terenu širom Srbije. Od 1997.
(New and used forklifts, rental from one day and field service across Serbia. Since 1997.)

**Four service pillars**

| Pillar | Serbian line | English | Link |
|---|---|---|---|
| Novi viljuškari | 96 Linde modela, ponuda po vašoj meri | 96 Linde models, quoted to your needs | /viljuskari/ |
| Najam | Od nekoliko sati do godinu dana. Isporuka za 24 sata | From a few hours to a year. Delivery in 24 hours | /iznajmljivanje-viljuskara-cena/ |
| Servis | Redovno održavanje, hitne intervencije, ugovori o punom servisu | Preventive maintenance, emergency callouts, full service contracts | /servis/odrzavanje-i-popravka/ |
| Polovni | Linde Approved Trucks sa garancijom 6 meseci ili 500 radnih sati | Linde Approved Trucks with a 6 month or 500 hour warranty | /polovni-linde-viljuskari/ |

All links are relative to ekotehnika.rs.

**CTAs**

| Role | Label | Target |
|---|---|---|
| Primary button | Zatražite ponudu (Request a quote) | ekotehnika.rs/kontakt/ |
| Secondary, phone | Prodaja +381 63 282-050 | tel link |
| Tertiary, phone | Hitan servis +381 60 300 20 50 (Emergency service) | tel link |

**Promo chip**, small, one line, not the hero's main message
Akcija. Linde MT15 C elektro paletar, 1.390 €
Link to /viljuskari/niskopodizno-vozilo/mt15-c/. The site does not say whether the price includes VAT (PDV). Leave it as shown and do not add "bez PDV" or "sa PDV".

**Trust strip**, along the bottom of the hero

| Item | Serbian |
|---|---|
| Founded | Od 1997. |
| Clients | 1.000+ klijenata |
| Status | Zvanični Linde partner |
| Coverage | Servisna vozila širom Srbije |

These are the company's own claims from its About page. Use them as written. Do not add any other number, award, client name or testimonial.

---

## 7. Layout, one pick

Keep the split the current site uses. Light grey copy panel on the left, photo on the right. It is familiar to returning customers and it is how Linde dealers present. Change what goes inside it.

- Header as today, 133px tall. The hero fills the rest of a 900px viewport, so about 767px including the trust strip.
- Left column, about 5 of 12 columns, `#eeeff3` background. Kicker, headline, sub line, primary button with the sales phone link beside it, then the four service pillars as a row of tabs or compact tiles.
- Right column, about 7 of 12 columns. One photo that changes with the selected pillar. The promo chip sits on the photo's top right corner, in Linde red, as live text.
- Bottom of the hero, full width. The trust strip with four items and the emergency service phone at the far right.
- No carousel arrows, no slide tabs, no autoplay.

**What this layout refuses.** An auto rotating carousel, because it hides most of the message and visitors ignore it. A full bleed video, because it is heavy and off brand. A dark hero, because Linde's look is light. Any extra section below the hero, because that is out of scope.

---

## 8. Three motion variants

All three use the layout in section 7. They differ only in motion. Pick timings close to what is written. Animate only `transform`, `opacity` and SVG `stroke-dashoffset`. No layout shift.

### V1. Service selector

Interactive. Motion follows what the visitor chooses.

- The four pillars form a real tablist. Hover, focus or click selects one.
- A 3px Linde red indicator under the active pillar slides to the new one with `translateX`, 240ms, `cubic-bezier(0.2, 0, 0, 1)`.
- The photo crossfades to the matching image, opacity over 280ms. Use the counterbalance image for Novi, the order picker aisle for Najam, a service or workshop crop for Servis if one of the three works, and the MT15 C image cropped clean for Polovni. If no fitting image exists, reuse one and say so in your notes.
- The sub line swaps to the pillar's line from section 6. Old text fades and moves up 6px, new text fades in from 6px below, 180ms each.
- The primary button label adapts. "Zatražite ponudu za najam", "Zakažite servis" (Book a service), and so on. Same target.
- Once, two seconds after load, the indicator nudges 8px toward the second pillar and back, 400ms, to hint that the row is interactive. Never repeat it.

Why it works. The visitor learns all four services by touching them, and the CTA always matches the service they are reading about.

### V2. Mast lift

A one time entrance that borrows the motion of a forklift mast.

- A vertical Linde red bar, 4px wide, grows from the bottom to the top of the left panel's text block with `scaleY` from 0 to 1, 450ms, ease out.
- The kicker, then each headline line, then the sub line rise into place as if lifted on forks. Each moves 24px up and fades in, 380ms, 70ms stagger, `cubic-bezier(0.16, 1, 0.3, 1)`.
- The primary button lands last. It drops 4px into place and settles, 300ms.
- The photo slides in 40px from the right and fades in, 600ms, starting with the headline.
- The four pillars and the trust strip fade in together at the end, 250ms.
- After the entrance, moving the mouse over the photo shifts it at most 8px, eased, as a light depth effect. Off when reduced motion is on.
- Total entrance under 1.4 seconds. Plays once per page load.

Why it works. The motion itself says forklift, lifting and precision, the brand's world, and it ends with the eye on the CTA.

### V3. Floor line

Borrows Linde's BlueSpot and TruckSpot floor projections, which warn pedestrians with a light on the warehouse floor.

- A dashed Linde red line, 2px, draws across the bottom of the hero from left to right using `stroke-dashoffset`, 1.2s, ease in out. It runs just above the trust strip.
- The line passes under the four pillars. As it reaches each one, a 10px red dot scales in from 0 under that pillar and the pillar fades up, 200ms each.
- The line ends under the primary button. The button then gets one soft red glow pulse, a `box-shadow` driven by an opacity animated pseudo element so it stays compositor friendly, 600ms, once.
- The trust strip numbers count up as the line passes them. Only "1.000+" counts, from 0, 800ms. "Od 1997." stays static, counting a year looks wrong.
- The rest of the hero, headline and photo, is visible from the start with no entrance, so the line is the only moving thing.

Why it works. It draws a path through the services in the order a customer meets them, buy, rent, service, used, and finishes on the CTA. It reads as safety tech, which Linde sells.

### For every variant

- With `prefers-reduced-motion`, show the final state at once. No movement at all.
- Hover states on every link and button. Button hover goes to `#990e1f`, 0.2s.
- Visible focus ring on every interactive element, 2px `#222222`, 2px offset.

---

## 9. Conversion rules

- Primary CTA at least 48px tall and visible without scrolling at 1440 by 900.
- No more than two phone numbers in the hero. Sales in the CTA row, emergency service in the trust strip.
- Every link stays on ekotehnika.rs or is a `tel` link.
- Add `data-cta` attributes for later analytics. `quote`, `call-sales`, `call-service`, `promo-mt15c`, and `pillar-novi`, `pillar-najam`, `pillar-servis`, `pillar-polovni`.

---

## 10. Quality floor

- No text under 14px. Body text 16px or more.
- All text is live HTML. No text baked into images.
- Every image has Serbian alt text.
- The pillar row is keyboard operable. Arrow keys move between pillars in V1.
- No console errors. No horizontal scroll at 1440.
- Fonts use font display swap, so text shows at once in the fallback font.

---

## 11. Files in this folder

| File | What it shows |
|---|---|
| `screenshots/01_home_above-the-fold.png` | Current homepage at 1440 by 900, what a visitor sees first |
| `screenshots/02_home_full.png` | Full homepage, for brand context below the hero |
| `screenshots/03_hero_slide-1_mt15c-promo.png` | Hero slide 1, pallet truck promo with baked in price |
| `screenshots/03_hero_slide-2_counterbalance.png` | Hero slide 2, diesel and gas counterbalance trucks |
| `screenshots/03_hero_slide-3_order-picker.png` | Hero slide 3, N20 order pickers |
| `screenshots/04_header-nav.png` | Header with both logos, top contact bar and nav. Rebuild this as is |
| `screenshots/05_quick-links.png` | The three tiles under the hero that link off site |
| `screenshots/06_new-truck-finder.png` | New truck finder, 96 models |
| `screenshots/07_product-mt15c.png` | MT15 C product page |
| `screenshots/08_rental.png` | Rental page |
| `screenshots/09_service.png` | Service page |
| `screenshots/10_used-approved-trucks.png` | Used trucks, Linde Approved Trucks |
| `screenshots/11_safety-innovations.png` | Safety tech, including BlueSpot and TruckSpot for V3 |
| `screenshots/12_contact.png` | Contact page and form, where the primary CTA lands |

---

## 12. When you are done

- Open `index.html` in a browser at 1440 by 900 and play each variant.
- Take one screenshot of each variant's final state, plus one mid animation frame for V2 and V3.
- Write three short notes, one per variant. What it does, what it costs in load or complexity, and which one you would ship and why.
- List anything you had to guess, such as an image you reused or a crop you could not get clean.
