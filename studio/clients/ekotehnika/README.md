# ekotehnika

Ekotehnika viljuškari d.o.o., Linde Material Handling dealer for Serbia and Montenegro, Vrčin.
Brand values below are copied from `briefs/hero-rebuild/BRIEF.md` section 5, taken from the live
site's CSS on 8 October 2026.

## Brand

Colour tokens. Do not invent new colours.

| Token | Hex | Use |
|---|---|---|
| linde-red | `#aa0020` | Primary buttons, kicker text, active states |
| dark-red | `#990e1f` | Hover and pressed red |
| toned-red | `#cc132a` | Top bar phone chip, accents |
| primary-700 | `#94001d` | Deeper red |
| primary-900 | `#700016` | Darkest red, top bar email chip |
| carousel-red | `#ba1926` | Carousel accents |
| ink | `#222222` | Headlines and body text |
| text-grey | `#4a595c` | Secondary text |
| toned-text-grey | `#5e7175` | Tertiary text |
| light-grey | `#eeeff3` | Hero copy panel, tiles |
| shade-grey | `#e6e7eb` | Dividers, panels, image fallback block |
| hover-light-grey | `#f5f6fa` | Hover on light tiles |
| white | `#ffffff` | Page background |

Type. `DaxWebPro` first in the stack, then Fira Sans from Google Fonts with font display swap.
Headline DaxWebPro-Medi 700, about 52px at 1440. Kicker 18px in linde-red. Body 16px to 18px.
Button 16px 700.

Shape. Buttons 5px radius, 15px padding, linde-red fill, white text, 0.2s colour transition.
Panels and tiles square cornered, flat, no shadows.

Imagery. Real Linde trucks in real warehouses, bright, red trucks against grey concrete. No
illustrations, no posed stock people, no gradients.

Logo. Linde Material Handling red box, then the EKOTEHNIKA wordmark, side by side at top left.
Use the image files, never redraw them.

## Rules that never bend

- Dax is a licensed Linde font. Never download or embed it. From the hero brief.
- No link in the hero goes to linde-mh.rs. Every CTA stays on ekotehnika.rs or is a `tel` link.
- No text baked into images. The MT15 C promo price is live text.
- No numbers, awards, client names or testimonials beyond the company's own claims in the brief.
- No full bleed video, no auto rotating carousel. The brief's light only rule was opened by Filip on 2026-10-08, any token may be a ground in the hero exploration, see taste.md.

## Accessibility

WCAG 2.2 AA. No text under 14px, body 16px or more, Serbian alt text on every image, visible focus
ring 2px `#222222` with 2px offset, `prefers-reduced-motion` shows the final state.
Known gap. toned-text-grey `#5e7175` on light-grey `#eeeff3` measures 4.46 to 1, under AA for body
text. Use text-grey there.

## Reference

Live site ekotehnika.rs, captured 8 October 2026 at 1440 by 900. Captures are in
`briefs/hero-rebuild/screenshots/`.

## Widths

1440

## Run

- Folder `ekotehnika-hero/`, its own React and Vite app, separate from the Remittix app at the repo root. Node 22 or newer.
- Install `npm install`. Dev server `npm run dev` on http://localhost:5173. Production build `npm run build`, then `npm run preview` on http://localhost:4173.
- Variants at `/?v=2`, `/?v=4` and `/?v=5`, keys 2, 4 and 5 switch between them. 1 and 3 were dropped. `/?gate=1` shows the forklift model gate.
- Routes to shoot `v2=/?v=2,v4=/?v=4,v5=/?v=5`. WebGL renders in software in the cloud container, wait about 6000ms per shot.
- Preview hosted on Vercel, project `ekotehnika-hero`, https://ekotehnika-hero.vercel.app.
- Reduced motion in the browser freezes all motion and drops the scroll pin.
