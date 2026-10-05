# <client>

Copy of the brand rules template. `node studio/scripts/registry.mjs add <client>` makes this folder for a
new client. Fill in each section, then delete the hint lines. The `/uireview` critic reads Brand,
Rules that never bend, Accessibility, Widths and Reference, so keep those headings.

## Brand

Hint. Palette as tokens with hex values, the type families and weights, the logo treatment and
clear space, the shadow and radius language, anything the brand never uses. Name each token once
so a builder and a reviewer can both quote it.

## Rules that never bend

Hint. One bullet per rule the client has made non negotiable, with where it came from. Examples
are a locked component API, a font that cannot be embedded, a hostname that must never ship in a
bundle, a colour that is reserved for one job.

## Accessibility

Hint. The bar for this client, normally WCAG 2.2 AA, plus any known failures in their existing
product and any fixes already agreed.

## Reference

Hint. The live site or product to match, the date it was captured, and where the captures are
kept. A replica build captures the reference screen by screen before building. With no reference
on file, write "none on file".

## Widths

Hint. The widths that shots and `/uireview` cover, written as one line such as `1440`. Name a phone
width only when the brief asks for phone layouts. With this section empty, reviews are desktop
only at 1440.

## Run

Hint. The folder in this repo that holds the client's code, the install, build and start commands,
the local base URL, the routes to shoot as `name=/path`, and where previews are hosted. Note any
URL switch that freezes motion, since moving pixels read as a regression in a shot diff.
