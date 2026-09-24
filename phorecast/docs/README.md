# Documentation index

Start with [../HANDOVER.md](../HANDOVER.md). Then, by topic:

| Document | Read it when |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | You need to know how the app is wired: shell, router, page and section order, file anatomy of a band, `src/lib`, entrance gating, reduced motion, the 3D logo, the hero carousel. |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | You change a colour, a size, a font or a breakpoint; add an icon; or touch light mode. Covers tokens, the approved type scale, theming, the design-pixel unit and the `Icon` mask gotcha. |
| [CONTENT.md](CONTENT.md) | You change copy or point a button somewhere. Every band's copy location, the CTA and sitemap config, the FAQ, and the full list of placeholder links. |
| [ASSETS.md](ASSETS.md) | You add or replace artwork, need a Figma node, or receive the Galano Grotesque font files. |
| [DEPLOY.md](DEPLOY.md) | You ship. `vercel.json`, `scripts/deploy.sh`, the account guard, the alias step, and moving the site to your own Vercel account. |
| [TESTING.md](TESTING.md) | You need to prove a change: typecheck, lint, build, pixel diff, screenshots, Playwright notes, manual pass. |
| [KNOWN-ISSUES.md](KNOWN-ISSUES.md) | Before planning work: open client questions, layout nits, accessibility, behaviour to know about. |

## The two reference documents at the project root

### [`MOTION.md`](../MOTION.md): the motion direction

The rules every entrance and loop follows, first written after the client
rejected an early pass as "too fast, too jumpy, not premium" and since updated
to match the code. Its core rule is "one object arrives, is allowed to land,
then the rest follow". It gives pacing, easing, travel and loop guidance; the
accent / support / context hierarchy; the pointer rule (no hover or pointer
tracking on artwork, with the 3D logo's tilt as the one approved exception);
where ScrollTrigger is used; and the invariants: the settled design is the
approved design, animated parts are hidden only while script is running, never
`clearProps: 'all'`, reduced motion shows everything. Read it before designing
new motion so the site keeps one language.

### [`LIGHTMODE.md`](../LIGHTMODE.md): the light-mode reference (about 20 KB)

How the light theme works and why it looks the way it does: value tokens
versus role tokens and the full light palette with contrast ratios (section 1),
theme selection, first paint and the doubled light blocks (1.4), why a theme
switch rebuilds motion (1.5), and a step-by-step for adding a light value
(1.6); how artwork is themed, by class: masked glyphs following `color`,
locked third-party marks, gradients restyled from CSS, and `-light` twins
(2.3); colour literals in CSS and TypeScript and how motion modules read
tokens with `tok()` (3, 4.3); how to measure contrast on rendered pixels (5);
the per-section decisions, including the glows, the inverted Markets card,
which device mock-ups re-tint, and the re-blended 3D mark (6); and the
gotchas (7). Read it before changing a colour in light mode, adding an SVG, or
painting a colour from script. Many source comments cite its sections by
number.
