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

## The two design-history documents at the project root

### [`MOTION.md`](../MOTION.md): the motion direction

The standard every entrance and loop was built to, written after the client
rejected a first pass as "too fast, too jumpy, not premium". Its core rule is
"one object arrives, is allowed to land, then the rest follow", with pacing,
easing, distance and loop tables, the accent / support / context hierarchy, and
a list of what made the first pass fail. Read it before designing new motion
so the site keeps one language. Some of its operational details are out of
date and the code wins where they disagree: the site now uses the
ScrollTrigger plugin (the 3D logo's scroll turn and the About conviction pin);
entrances start from a CSS `visibility: hidden` pending state, released by
script, rather than from a visible baseline; the 3D logo's pointer tilt is kept
at the client's request despite the "no tilt toward the cursor" rule; and the
verification scripts and the motion lab page it names have been removed.

### [`LIGHTMODE.md`](../LIGHTMODE.md): the light-mode strategy (58 KB)

The analysis written before light mode was built: why it was structural rather
than a palette swap, the split of tokens into value and role tokens (section
1.1), the light palette and its contrast reasoning (1.2, 1.3), how the theme is
applied before first paint (1.4), why a theme change must rebuild every motion
module (1.5), the classification of every SVG into mask-able, locked,
gradient and multi-colour classes (2.3), hardcoded colours by section (3, 4),
and where the dark design's meaning is at risk on paper (6). Sections 5 (the
snapshot regression gate) and 7 (the implementation work plan) are history: the
`theme-snapshot` / `theme-diff` scripts they describe are gone, and
`scripts/pixel-diff.mjs` is the current check. You do not need to read it to
work on the site day to day. Open it when you add a new SVG and need to decide
between `<img>`, `<Icon>` and a `-light` twin; when a colour misbehaves in
light mode; when a loop shows dark colours after a theme switch; or when a
source comment cites "LIGHTMODE.md" with a section number, which many do.
