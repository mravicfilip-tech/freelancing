# remittix

Brand rules for Remittix. Facts here come from `DESIGN.md` and `README.md` at the repo root. Lines
marked "Filip to add" are not on file yet.

## Brand

Palette, from the token table in `DESIGN.md`.

| Token | Hex | Job |
|---|---|---|
| bg | `#EDEFF1` | Page and hero ground, with its dot grid |
| ink | `#111214` | Headline, primary button, wordmark |
| body | `#5B636B` | Paragraph text. Replaced `#8A8F98`, which failed contrast at 18px |
| globe | `#7C858D` | The globe dots |
| hairline | `#C4C8CD` | Orbit rings, rules, stage border |
| indigo | `#4B4BF7` | Spent once per direction, the primary action or the coin pulse |
| lime | `#D9F24E` | Corner marks and the live countdown dot only |

Type. One self-hosted variable family per hero direction. Instrument Sans for Ledger, Bricolage
Grotesque for Orbit, Schibsted Grotesk for Stage. Which direction is the accepted one, Filip to add.

Logo treatment and clear space, Filip to add.

## Rules that never bend

- No pointer parallax and no per-section entrances. The globe turning and the coins moving are the
  only motion. From the client reference in `DESIGN.md`.
- No eyebrow label, no single accented headline word, no arrow glyph in buttons, no big-number stat
  row. Numbers live inside sentences. Removed at the client's request, from `DESIGN.md`.
- The `#EDEFF1` ground with its dot grid, the ink black and the lime corner marks stay. They are
  brand, not defaults. From `DESIGN.md`.

## Accessibility

WCAG 2.2 AA. Known fix already agreed, body text moved from `#8A8F98` to `#5B636B` for contrast.
`prefers-reduced-motion` shows one static frame with no loop, parallax or drift.

## Widths

1920, 1440, 390

## Reference

The client likes a mid-grey dotted globe with tight orbits carrying real coin logos, from
`DESIGN.md`. No live site or capture on file, Filip to add.

## Run

- Code lives at the repo root, `src/`, `public/` and `scripts/`.
- `npm ci`, then `npm run build`, then `npx vite preview --port 4173`. Base URL
  `http://localhost:4173`.
- Routes to shoot `home=/,static=/?planet=static`. The globe moves, so compare regressions on
  `static`. Two shots of an unchanged build still differ by about 0.8% there, inside the globe, so
  read a diff of that size as noise. Other switches are `?globe=halftone|matte|continents`, `?hero=1|2|3` and
  `?planet=off`.
- Previews are on Vercel, one per push. Preview project name, Filip to add.
