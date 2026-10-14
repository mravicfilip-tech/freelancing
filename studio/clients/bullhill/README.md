# bullhill

BullHill, a crew that digs the trenches and lays the ducts that fibre optic cable is pulled through
later. A friend of Filip's. The job is a one page company website that shows their work and photos,
says who they are and makes contact easy. Brand values below are read from the four logo SVGs Filip
sent on 14 October 2026, kept in `brand/`.

## Brand

Colour tokens. The logo uses these three and nothing else. Do not invent new colours.

| Token | Hex | Use |
|---|---|---|
| bull-red | `#D00B11` | "Bull" in the wordmark, the breaker tooth, the one accent colour |
| black | `#000000` | Ground on the dark lockup, mark and "Hill" on the white lockup |
| white | `#FFFFFF` | Ground on the light lockup, mark and "Hill" on the dark lockup |

Logo. An excavator breaking ground over two hill lines, with the BullHill wordmark under it. Four
lockups, use the files and never redraw them.

| File | Ground | Mark | Bull | Hill | Tooth |
|---|---|---|---|---|---|
| `brand/logo-on-black.svg` | black | white | red | white | red |
| `brand/logo-on-white.svg` | white | black | red | black | red |
| `brand/logo-on-red-black-bull.svg` | red | white | black | white | black |
| `brand/logo-on-red-white-bull.svg` | red | black | white | black | white |

The SVGs are 1000 by 1000 squares with a filled ground rect. The artwork sits inside roughly x 78 to
922 and y 264 to 737, so a header or favicon use needs a cropped viewBox, not the square file.

Type. The wordmark is a heavy grotesque with tight joins. Its family is not on file yet, ask Filip
before choosing the site type.

Imagery. Their own photos of their own machines and routes only. No stock photos.

## Rules that never bend

- Brand colours are the three tokens above, from the logo files Filip sent on 14 October 2026.
- Logo artwork is used from `brand/`, never redrawn or recoloured outside the four lockups.

## Accessibility

WCAG 2.2 AA. bull-red on black measures 3.74 to 1, so red text on black is for large type only, 24px
or 18.66px bold and up. bull-red on white measures 5.62 to 1 and passes for body text. White text on
a bull-red fill passes at 5.62 to 1.

## Reference

None on file. Filip is sending references.

## Widths

1440

## Run

Folder `bullhill-site/`, not created yet. Nothing is built before Filip accepts the section plan in
`briefs/website/plan.md` and the direction.
