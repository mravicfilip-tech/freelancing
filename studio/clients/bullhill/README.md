# bullhill

BullHill, a crew that digs the trenches and lays the ducts that fibre optic cable is pulled through
later. A friend of Filip's. The job is a one page company website that shows their work and photos,
says who they are and makes contact easy. The market is Austria and Germany. The site is English
first with German as the second language (Filip, 14 October 2026). Brand values below are read from
the four logo SVGs Filip sent on 14 October 2026, kept in `brand/`.

## Brand

Colour tokens. The logo uses these three and nothing else. Do not invent new colours.

| Token | Hex | Use |
|---|---|---|
| bull-red | `#D00B11` | "Bull" in the wordmark, the breaker tooth, the one accent colour |
| black | `#000000` | Ground on the dark lockup, mark and "Hill" on the white lockup |
| white | `#FFFFFF` | Ground on the light lockup, mark and "Hill" on the dark lockup |

Neutral greys are tints of black for grounds, lines and secondary text, with no new hue. One derived
shade, bull-red-dark `#A8090E`, is for hover and pressed red only. The site's tokens live in
`bullhill-site/src/shared/tokens.css`.

Logo. An excavator breaking ground over two hill lines, with the BullHill wordmark under it. Four
lockups, use the files and never redraw them.

| File | Ground | Mark | Bull | Hill | Tooth |
|---|---|---|---|---|---|
| `brand/logo-on-black.svg` | black | white | red | white | red |
| `brand/logo-on-white.svg` | white | black | red | black | red |
| `brand/logo-on-red-black-bull.svg` | red | white | black | white | black |
| `brand/logo-on-red-white-bull.svg` | red | black | white | black | white |
| `brand/logo-on-red-all-white.svg` | red | white | white | white | white |

The fifth lockup, all white on red, is Filip's ruling of 14 October 2026 for the closing panel, made from
the red lockup with its black fills turned white. Approved by the brand owner through Filip, "Approved", 14 October 2026.

The SVGs are 1000 by 1000 squares with a filled ground rect. The artwork sits inside roughly x 78 to
922 and y 264 to 737, so a header or favicon use needs a cropped viewBox, not the square file.

Type. The wordmark is a heavy grotesque with tight joins. Its family is not on file yet, ask Filip
before choosing the site type.

Imagery. Their own photos of their own machines and routes only. No stock photos. Until they arrive,
every photo slot is a placeholder that carries the brief for the shot to take (Filip, 14 October 2026).

## Rules that never bend

- Brand colours are the three tokens above, from the logo files Filip sent on 14 October 2026.
- Logo artwork is used from `brand/`, never redrawn or recoloured outside the five lockups above.
- Every page shows the full logo, the excavator mark over the wordmark. The wordmark or the mark alone never stands in for it (Filip, 14 October 2026).

## Accessibility

WCAG 2.2 AA. bull-red on black measures 3.74 to 1, so red text on black is for large type only, 24px
or 18.66px bold and up. bull-red on white measures 5.62 to 1 and passes for body text. White text on
a bull-red fill passes at 5.62 to 1.

## Reference

Three style references from Filip on 14 October 2026, to be matched about 90 percent for style,
section structure, content rhythm and later the motion. One pathway follows each.

- https://www.worldquantfoundry.com/ for pathway 1, Foundry
- https://trymeridian.com/ for pathway 2, Daylight
- https://vaulk.com/ for pathway 3, Underground

Captures at 1440 and 390 from 14 October 2026 are in `briefs/website/refs/`.

## Widths

390, 1440

Phone is the main focus, with a desktop of the same quality (Filip, 14 October 2026).

## Run

- Folder `bullhill-site/`, its own React and Vite app. Node 22 or newer.
- Install `npm install`. Dev server `npm run dev` on http://localhost:5173. Pull and serve the session
  branch with `npm run live`. Production build `npm run build`.
- Pathways at `/?v=1` Foundry, `/?v=2` Daylight and `/?v=3` Underground. Keys 1, 2 and 3 switch.
  German at `&lang=de`.
- Routes to shoot `foundry=/?v=1,daylight=/?v=2,underground=/?v=3`, plus the same with `&lang=de`.
- No preview project yet. Vercel previews are on hold.
