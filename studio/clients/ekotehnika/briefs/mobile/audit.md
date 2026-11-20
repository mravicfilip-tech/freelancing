# Mobile audit, 20 November

Filip, "do app wide check and fix any issues you find on mobile, padding, spacing, incosistencies, poor UX - analyze and identify".

Every shop and service route as a touch phone at 390 by 844 and 360 by 780. Measured with a script for overflow, elements past the
screen, text under 14px, taps under 24px and controls under 44px, then read shot by shot, with the menu, the filters, the sort and both
searches open. The homepage story needs WebGL and was not part of this pass.

## What held

- No page scrolls sideways at 390 or 360 after the fixes. Before them, the shop's chip row ran 4px past the screen.
- One gutter everywhere, 28px from the screen edge, the 16px frame and the 12px cell.
- No text under 14px on any route.
- The phone bar never covers the last line of the footer, 64px of room under it on every page.

## Fixed

1. The shop's chip row went 4px past the screen and its chips were 40px tall. Now it ends at the screen edge, chips 44px.
2. A list's count stood twice on a phone, "89 modela" large under the title and again over the search. The one over the search stays, it follows the filters.
3. A model with no picture showed its name at 32px in a 131px tile, it ran out of the pale field. Now 18px, inside the tile.
4. A two line card name left one word alone, "E16 do E20 / P". Names now break in even halves.
5. The equipment rows and their "more" button on a model page were 24px tap targets. Now 48px, every line in the same place.
6. Kontakt's sliding pictures sat between the numbers and the form and pushed the form 560px down. Hidden on a phone, kept on larger screens.
7. The search placeholders were cut, "Pretražite modele, npr. X20 il". Now "Pretraga, npr. X20 ili slagač" on the shop search and the empty Kontakt field, the list page's own words, and it fits at 360.
8. The browser's clear cross in search fields drew in system blue. Now the site's black cross, 24px.
9. Delovi's title and its line stood 56px apart, every other hero 24px. Now 24px.
10. The footer's address lines stood 44px apart and the copyright lines 80px apart. Each now reads as one block.

## Seen and left as is

- Servis opens on the map, the title starts 600px down. The phone bar's call and "Zakažite servis" sit on the first screen, so the call is never more than a tap away.
- The stepper's "meseci, 4 godine" wraps to two lines beside 48. It reads fine.
- On desktop the footer address has the same 44px line gap, and Kontakt's model field starts its text 4px further in than the fields under it. Both left alone since the ask was mobile.
