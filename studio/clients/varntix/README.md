# varntix

Copy of the brand rules template. `node studio/scripts/registry.mjs add varntix` makes this folder for a
new client. Fill in each section, then delete the hint lines. The `/uireview` critic reads Brand,
Rules that never bend, Accessibility, Widths and Reference, so keep those headings.

## Brand

From the Figma file, read on 2026-10-07. Not yet confirmed by Filip.

| Token | Hex | Where it shows |
|---|---|---|
| black | `#000000` | Page ground, dark theme |
| grey 800 | `#373737` | Swatch pair with grey 500 |
| grey 500 | `#7D7D7D` | Muted text |
| white | `#FFFFFF` | Text on dark, light ground |
| green | `#7DCD85` | Positive figures, the holdings arc |
| green deep | `#182119` | Pair to green |
| blue light | `#53A7FF` | Swatch pair with blue |
| blue | `#4374FA` | Primary button |
| gold | `#DAC197` | Accent |

Type. Noto Sans on the dashboard, from the Dashboard/Body 14 style. Website family, Filip to add.

Logo treatment and clear space, Filip to add.

## Rules that never bend

Hint. One bullet per rule the client has made non negotiable, with where it came from. Examples
are a locked component API, a font that cannot be embedded, a hostname that must never ship in a
bundle, a colour that is reserved for one job.

## Accessibility

Hint. The bar for this client, normally WCAG 2.2 AA, plus any known failures in their existing
product and any fixes already agreed.

## Reference

Figma https://www.figma.com/design/rzv5g0IB5v0RKTBwWjWxI4/Varntix, pages Website and Dashboard.

## Widths

Filip to add. The file draws desktop at 1920 and phone at 440.

## Run

Hint. The folder in this repo that holds the client's code, the install, build and start commands,
the local base URL, the routes to shoot as `name=/path`, and where previews are hosted. Note any
URL switch that freezes motion, since moving pixels read as a regression in a shot diff.
