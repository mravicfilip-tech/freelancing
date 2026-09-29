# Tokens

All values live in `assets/css/ml-tokens.css`. This page explains them. Do not change values; scope an override if a page needs a variant.

## Color

| Token | Hex | Role |
| --- | --- | --- |
| `--ml-night` | #070C15 | Primary dark ground. Page background by default. |
| `--ml-navy` | #0E1A2B | Text on light. Panels and buttons on light. |
| `--ml-panel` | #0B1320 | Cards and form surfaces on dark. |
| `--ml-off` | #F4F5F7 | Light ground. |
| `--ml-amber` | #FFA000 | Gradient start. |
| `--ml-flame` | #FF5A14 | Gradient mid. Accents, hover glow, numerals. |
| `--ml-signal` | #E8101E | Gradient end. Emphasis only. |
| `--ml-silver` | #D4D8DE | Wordmark on dark, dividers on dark. |
| `--ml-muted-dark` | #9AA6B8 | Body text on dark. |
| `--ml-muted-light` | #4A5566 | Body text on light. |
| `--ml-flame-text` | #C2410C | Orange for small text on white. Passes 4.5:1. |

Theme scopes: put `data-theme="dark"` or `data-theme="light"` on `<body>` or any section. They set `--ml-bg`, `--ml-fg`, `--ml-fg-muted`, `--ml-surface`, `--ml-border`, `--ml-divider`, `--ml-accent-text`. Use those semantic tokens in page CSS, not the raw hexes.

## Ignition gradient
`--ml-ignition`: 35deg, Amber 0%, Flame 55%, Signal 100%. Runs bottom-left to top-right like the bars. Never reversed, never vertical, never a page wash. `--ml-ignition-h` is the horizontal version for text and thin strips.

Ratio on a page: about 60 Night, 28 Off-white, 12 Ignition.

## Type
- Display and reading: Montserrat. 800 for headlines, 700 for card titles, 500 to 600 for labels, 400 for body.
- Michroma: section numerals and short caps labels only. Never a sentence. The wordmark is an SVG, never typed.
- Scale (rem): xs 0.75, sm 0.875, md 1.0625 (body), lg 1.25, xl 1.75, 2xl 2.5, 3xl 3.5, 4xl 4.5, 5xl 6.5.
- Tracking: labels 0.32em uppercase, tagline 0.42em uppercase. Headlines sit at -0.02em.
- Line height: headlines 1.02 to 1.06, body 1.55.

## Spacing
8pt grid. `--ml-s1` 8px through `--ml-s8` 128px. Sections use `--ml-s7` (96px) top and bottom on desktop, `--ml-s6` on mobile. Container 1200px, narrow container 760px.

## Radius
Bars 6px. Inputs and small tiles 14px. Cards and panels 22px. Buttons are pills.

## Elevation and light
Cards on light: `--ml-shadow`. Primary button hover: `--ml-glow-flame`. The icon in a hero gets a drop-shadow glow via `.ml-bars--glow`. Nothing else glows.

## Motion
160ms for hovers, 420ms for reveals, easing `cubic-bezier(0.2, 0.7, 0.2, 1)`. Respect `prefers-reduced-motion`.
