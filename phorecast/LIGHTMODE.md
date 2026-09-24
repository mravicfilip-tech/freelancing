# Light mode reference

How the light theme works, the rules every light block follows, and the
decisions each section made. Source comments cite this file by section number
(for example "LIGHTMODE.md 6.2"), so the numbering is stable. For a shorter
overview see `docs/DESIGN-SYSTEM.md` section 3.

The design exists only in dark in Figma. Light is derived from it: the same
layout, geometry and motion, with colour chosen to keep the dark design's
legibility and meaning on paper.

---

## 1. Theming model and tokens

### 1.1 Value tokens and role tokens

`src/styles/tokens.css` has two layers.

- **Value tokens** (`--bg`, `--white-font`, `--orange-100`, `--color-body`,
  `--surface`, `--green`, `--red`, ...) are the Figma variables. They never
  change between themes.
- **Role tokens** (`--page`, `--panel`, `--panel-2`, `--line`, `--ink`,
  `--ink-2`, `--ink-muted`, `--accent`, `--accent-deep`, `--accent-lift`,
  `--accent-soft`, `--on-accent`, `--pos`, `--neg`, `--veil`, `--veil-line`,
  `--art-ink`, `--art-ink-2`, `--btn-primary-hover-*`) name a job. In `:root`
  each is defined as a value token, so dark is exactly the Figma palette; the
  light blocks redefine the roles only.

A value cannot be flipped in place because one value often does several jobs.
`--white-font` is page ink, the label on the red button, and white inside dark
artwork. Flipping it would put a near-black label on the red button (2.29:1).
So:

- **`--on-accent`** is the label on a brand-red plate. It never flips: it is
  read against `--accent`, which is dark in both themes.
- **`--art-ink` / `--art-ink-2`** are white and grey *inside* a dark
  illustration. They do not flip; whether an illustration re-tints is decided
  per section (6.3).
- Everything that sits on the page reads `--ink`, `--ink-2` or `--ink-muted`.

New CSS should read role tokens or a section-local token, never a value token
or a literal that means "page" or "text".

### 1.2 The light palette

Light reproduces dark's **contrast hierarchy**, not its luminance: each role is
matched to its dark contrast ratio against the page.

| Role | Dark | vs page | Light | vs page | Note |
|---|---|---|---|---|---|
| `--page` | `#0f0e0d` | | `#fffbf8` | | Dark's own ink, reused as paper |
| `--panel` | `#1b1b1a` | 1.12 | `#f7f0ea` | 1.10 | Raised by tint, not shadow, in both themes |
| `--panel-2` | `#2b2928` | 1.33 | `#ece1d9` | 1.25 | Tracks, inactive bars |
| `--line` | `#313131` | | `#e3d6cb` | | Hairlines |
| `--ink` | `#fffbf8` | 18.74 | `#1a1512` | 17.59 | Headings, nav |
| `--ink-2` | `#9d9d9d` | 7.11 | `#5e5651` | 6.97 | Body copy |
| `--ink-muted` | `#626262` | 3.16 | `#7a716c` | 4.63 | Eyebrows; see below |
| `--accent` | `#e5331e` | 4.43 | `#a21605` | 7.69 | Brand red |
| `--accent-deep` | `#c02816` | | `#7e0202` | | Gradient dark stop, pressed |
| `--accent-lift` | `#e9513f` | 5.25 | `#c4361c` | 5.24 | Hover, gradient light stop |
| `--on-accent` | `#fffbf8` | 4.23 on red | `#fffbf8` | 7.69 on red | Never flips |
| `--pos` | `#15a456` | 5.95 | `#0b6e37` | 6.18 | `#15a456` on paper is 3.15:1 |
| `--neg` | `#a21605` | 2.44 | `#b01309` | 6.93 | See 1.3 |
| `--veil` | white 4% | | ink 4.5% | | Glass |
| `--veil-line` | white 12% | | ink 14% | | Glass edge |

**The eyebrow is the one deliberate divergence.** Dark's `--ink-muted`
(`#626262` on `#0f0e0d`) is 3.16:1, below WCAG AA for 16px text. Light does not
reproduce that failure: `#7a716c` is 4.63:1 and still visibly quieter than body
copy. Dark is left as designed. Sections whose eyebrows sit on a lit field set
their own label ink (the About page does, in `About.css`).

**A dark near-miss left alone.** The primary button in dark is `#fffbf8` on
`#e5331e`, 4.23:1 at 16px/600. In light it is 7.69:1. Changing the dark button
is a separate design decision.

### 1.3 Brand red and loss red

`#a21605` is `--red` in dark: the price-down colour. In light it becomes the
brand `--accent`. Loss and brand must not be the same colour on a trading
page, so in light `--neg` moves to `#b01309` (6.93:1), close enough to read as
the same family and far enough to read as a different thing. Artwork gradients
that used `--red` as a stop use a literal instead (`--onb-grad-top` in
`BoxOnboard.css`), so they do not follow the loss colour.

### 1.4 Selecting the theme, first paint, and the doubled blocks

- **State** is `data-theme="light" | "dark"` on `<html>`.
- **First paint**: a blocking inline script in `index.html` reads
  `localStorage['phorecast-theme']`; if absent it follows
  `prefers-color-scheme`. It must stay inline, in `<head>`, and wrapped in
  `try` (Safari private mode throws on `localStorage`).
- **Runtime**: `src/lib/theme.ts`. An explicit choice from the nav toggle is
  stored and wins; with nothing stored, a `matchMedia` listener follows system
  changes live. The two `<meta name="theme-color">` tags are switched by hand,
  because their `media` attribute cannot follow an explicit choice.
- **`color-scheme`** is `dark` on `:root` and `light` in the light blocks, so
  the scrollbar and native UI follow the theme.

**Why every light block is written twice.** A media query cannot be part of a
selector list, so "light because the system prefers it and nothing was chosen"
and "light because it was chosen" need separate blocks:

```css
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) { /* light values */ }
}
:root[data-theme='light'] { /* the same light values */ }
```

In practice the second always applies, because the inline script sets
`data-theme` before first paint; the first is the fallback for a page where
that script did not run. **The two blocks must stay identical.** Do not replace
the duplication with a custom-property indirection: a property that resolves
differently under a media query and an attribute is easy to get subtly wrong.
Section files use the same pattern with their own selector
(`:root[data-theme='light'] .hero`, and so on).

### 1.5 Motion and theme changes

Motion modules read resting and lit colours when their timeline is built, and
hold them for the life of the loop. A loop built in dark and left running
after a switch would settle to dark colours on paper. So a theme change
**rebuilds**: `useThemeEpoch()` (`src/lib/theme.ts`) changes only on an actual
theme change and is a dependency of `useSectionMotion`, of `HeroLogo` and of the
bento card modules. Entrances replay on a switch; that is expected.

### 1.6 Adding a light value

1. Give the colour a job: a role token if the page already has that job,
   otherwise a section-local token (`--fam-foot`, `--mk-surface`) declared with
   its dark value.
2. Use the token at the call site, and check the dark render is unchanged
   (`scripts/pixel-diff.mjs` in dark).
3. Add the light value to **both** light blocks of that file.
4. If a motion module paints the colour, read it with `tok('--name', fallback)`
   inside the build (4.3).
5. Check contrast against the ground it is actually painted on (section 5).

---

## 2. Artwork

### 2.1 Colour is applied at the call site

Files in `src/assets/` are Figma exports and are not recoloured in place: many
are shared, and editing one changes dark everywhere it is used. Theming is done
by CSS at the call site, or by adding a separate `-light` file owned by the
section that uses it.

### 2.2 Named colours are baked paint too

Figma exports some colours as names (`fill="white"`, `stroke="white"`,
`stop-color="white"`) rather than hex. A search for `fill="#` misses them. A
white arrow or white gridline baked this way vanishes on paper unless its
call site handles it.

### 2.3 The classes

Every live SVG falls into one class, and the class decides the mechanism.

| Class | What it is | Mechanism |
|---|---|---|
| **A**, mono neutral glyph | One flat grey or white on transparent | `<Icon>` mask; colour from CSS `color` (`--ink-2`, `--ink-muted`, a local token) |
| **B**, mono brand glyph | One flat brand red (or up/down green/red) | `<Icon>` mask; `color: var(--accent)`, or `--pos` / `--neg` for price arrows |
| **L**, locked third-party mark | Tesla, NVIDIA, ECB, NFL, Bitcoin, index and exchange wordmarks, their plates | Never recoloured. Where a mark was drawn for a light plate it keeps that plate in both themes; where it was drawn light for a dark plate, the plate stays dark. **Change the plate, not the mark.** |
| **F**, gradient illustration | Multi-stop gradients, often fading from the dark ground to a warm accent | If inlined with `?raw`: CSS overrides the presentation attributes by class or selector (`stop-color`, `stroke`, `fill` are CSS properties and CSS wins), e.g. the Fan arcs' `STOP_ROLE` in `Fan.tsx`, the Steps chart in `PanelTrade.css`. If used as `<img>`: a `-light` twin chosen with `useTheme()` |
| **E**, multi-colour flat illustration | Two to four flat colours | A `-light` twin (e.g. `hero/slide2/trend-ring-light.svg`, `icons/live-dot-light.svg`), or inline and style as F |
| **0**, no baked paint | Only `fill="white"` or nothing | Mask it like A; the named colour never renders |

Notes:
- A mask keeps only alpha, so it flattens multi-colour or gradient art. Only
  A, B and 0 may be `<Icon>`s (`docs/DESIGN-SYSTEM.md` section 5).
- Masked brand glyphs follow `--accent`, so one token rethemes every red glyph.
  Some Figma files bake `#f03725` (the artwork red) instead of `#e5331e`; once
  masked, the baked hex no longer matters.
- Inlined SVGs have their ids prefixed per instance. Theme by changing
  colours, never the id or element structure, which the motion modules query.
- Current `-light` twins: `hero/slide2/` (connectors, charts, trend arrows and
  ring, card grid), `hero/slide3/` (bracket, dashed), `hero/slide4/dashed-path`,
  and `icons/live-dot`. A twin is a hand-authored colour and can drift from any
  future Figma light design; prefer CSS where it can express the change.
- `icons/live-dot-light.svg` bakes the light `--accent` (`#a21605`). If the
  light accent changes, update the file.

---

## 3. Colour literals in CSS

Most section CSS keeps its colours in section-local tokens at the top of the
file, with light values in the file's two light blocks. When you meet a
literal, classify it before changing it:

- **Theme-dependent**: glows, grounds, glass, hairlines, hovers. Needs a light
  value.
- **Artwork-internal**: colours inside a device mock-up or illustration.
  Changes only if that section re-tints its artwork (6.3).
- **Fixed**: shadows (black shadows work on paper) and mask gradients (only
  alpha is read, the colour is meaningless).

**White-alpha is the dark theme's idiom for "raise this slightly"**: glass,
hairlines, hover states. On paper it is invisible. The light equivalent is
ink-alpha (`rgba(26, 21, 18, a)`), with the alpha nudged up because dark ink on
paper reads fainter per unit alpha. `--veil` and `--veil-line` are that pair;
sections define their own for other strengths.

`#000` has several meanings (a mask stop, a shadow, ink on a light card, a
device bezel); read each in context.

---

## 4. Colour in TypeScript

### 4.1 Colours read from CSS

Motion modules read resting colours with `getComputedStyle` (the element's
own `color`, `borderTopColor`, and so on) and lit colours with `tok()`. Both
follow the theme that was live when the section was built, which is why theme
changes rebuild (1.5).

### 4.2 Colours painted by script

Where script paints a colour (an injected SVG overlay, a lit state, a filter),
the value comes from a token read with `tok()`, and the literal in the code is
only the fallback. Injected SVG elements take their paint from CSS
(`currentColor` or a class) where they can. Examples: `--fan-dia-lit`,
`--fan-rim-lit` and `--fan-tile-lit` in `Fan.css`; `--bt-lit` and `--bt-warm`
in `Built.css`, read by `built/loops/bt1.ts`.

### 4.3 How to read a token in a motion module

```ts
import { tok } from '../../lib/theme';
// inside the build or start function, never at module scope:
const lit = tok('--bt-lit', '#ff8f63');
```

`tok(name, fallback)` reads the resolved custom property from the document
element. Call it inside the function that builds the timeline, next to the
other computed-style reads: at module scope it runs before the theme is known
and never re-reads. Keep the dark value as the fallback, so a missing property
degrades to the dark design. A token a module reads with `tok()` has to be
declared where the document element can see it (on `:root`, or in the light
blocks' `:root` selectors), not only on the section element.

---

## 5. Measuring contrast

- Measure against the ground the colour is **actually painted on**, not
  against `--page`: a label on a lit glow, a chip on a card, a tile on a
  plate.
- For anything semi-transparent (glass, an SVG with an `opacity` attribute, a
  blurred glow), match the **rendered** result, not the hex. Take a screenshot
  (`scripts/screenshot.mjs --theme=light --still`) and read the composited
  pixels, then compare that ratio with dark's.
- Where dark's contrast cannot be reached on paper (a ring drawn at 30% opacity
  cannot be as strong on cream as on black), match the element's **position
  within its possible range**: the same fraction of the way from invisible to
  the strongest possible value. `SlideFuture.css` does this for the orbit
  rings.
- Keep dark untouched while doing light work: `scripts/pixel-diff.mjs` in dark
  should report `PIXEL-IDENTICAL`.

---

## 6. Section decisions

### 6.1 The glows

The hero, bento, Familiar, Pillars, Built and footer grounds are stacks of
large blurred discs: a sunrise over a dark horizon. On paper, a saturated
disc is a stain, so recolouring the stops does not translate the idea.

What light does, in every glow:
- **Geometry is unchanged**: same discs, positions, radii, blur, opacities and
  paint order.
- **The page stop is the page.** The outer disc's first stop is `var(--page)`
  in both themes, so it dissolves into whatever the ground is.
- **The luminance ramp inverts; the spatial ramp does not.** In dark the disc
  painted last is the palest, because the core of a light source is its
  brightest part. Nothing on paper can be brighter than the page, so a pale
  core would read as a hole. The order is kept and the ramp reversed: the core
  is the deepest tint, the outer falloff the faintest. Warmth still peaks where
  light peaked.
- **Paper carries the glow at about half dark's weight**: a blush, not a stain.
- No `mix-blend-mode`: several bands use `isolation: isolate`, which would make
  `multiply` a no-op.
- The hero's `.hero__horizon` is `var(--page)`, so it flips on its own: the
  paper itself cuts the blush. The hero's halftone keeps its `soft-light`
  blend and turns its colour around, so it settles into paper rather than
  lifting.

This is a different idea from the dark sunrise ("warm paper with a blush"),
chosen deliberately.

### 6.2 The Markets card inverts

In dark, bento card D (`bento/boxes/BoxMarkets.*`) is the one light surface on
the page, and that contrast is its point. Left pale on paper it would vanish.
So in light the card **inverts**: `--mk-surface` becomes the page's ink,
`--mk-ink` the page's paper, `--mk-ink-2` `#9d9d9d`, `--mk-accent` the dark
theme's `--orange-100` (the light `--accent` is too dark on a dark card), and
dark tiles lift a step so they still read as chips.

What does **not** move: the tile plates, rings, edges and tooltip. The plates
carry locked third-party marks drawn for a light plate (2.3, class L). All of
this depends on the card reading its own `--mk-*` tokens rather than page
tokens; if the card ever reads `--ink` directly, it risks black on black.

### 6.3 Device mock-ups and diagrams

Four illustrations are product screens or panels drawn in the product's dark
UI. Each made its own decision:

| Illustration | Light decision |
|---|---|
| Hero slide 2 (`hero/slides/SlideAccount.css`) | **Re-tinted.** The app has a light mode, so the cards turn light through the `--sl2-*` tokens. Plates of `--accent`, `--pos` or `--neg` are dark in both themes, so what sits on them keeps `--on-accent`. |
| Steps panels (`steps/Steps.css`, `steps/panels/*.css`) | **Re-tinted.** They are diagrams on a raised surface, not screenshots, and three dark plates would dominate a light page. `--art-ink` is deliberately not used there. |
| Familiar handset and its two floating prediction cards (`familiar/Familiar.css`) | **Stays dark** as a deliberate inset: the `--fam-app-*` tokens are never redefined in light, so every "lit means brighter" beat inside the phone still works. The page chrome around it (glow, glass cards, strip) flips. |
| Hero slide 4 (`hero/slides/SlideFuture.css`) | Diagram re-tinted: orbit rings matched on rendered weight (5), glass badges settle instead of lifting, all baked brand reds masked to `--accent`. |

When re-tinting, keep "lit" meaning *further from the page* (6.5).

### 6.4 The 3D mark is re-blended, not recoloured

The `lined` treatment (`HeroLogo/treatments/lined.ts`) draws the mark as
emitted light with additive blending over a transparent canvas. Additive
light over paper saturates to paper, so the mark would vanish. In light the
treatment switches medium at build: normal "over" blending, a single core pass
in ink (`LINED.lightInk` in `HeroLogo/config.ts`, colour read from `--accent`,
fallback `#a21605`), and no glow pass. A theme switch rebuilds the scene. The
pixel-diff script runs without WebGL, so check the mark by eye in both
themes, in the hero and in the FAQ.

### 6.5 Meaning that must survive

- **Surfaces whose colour is their meaning keep it.** Bento card A
  (`bento/boxes/BoxOnboard.css`) is a saturated red-to-peach plate in both
  themes; its glass pills stay white glass and its copy uses `--on-accent`,
  read against the plate, not the page. Plates of `--accent`, `--pos` and
  `--neg` are dark in both themes, so labels on them stay `--on-accent`.
- **Up is green, down is red.** On paper `#00c950` is 2.15:1 and `#15a456`
  3.15:1, so page-level price moves use `--pos` / `--neg`. Inside a dark
  device inset (6.3) the app's own pair stays.
- **Brand and loss stay distinct** (1.3).
- **"Lit" means brighter in dark, and must mean "further from the page" in
  light.** Dark lights things by brightening them: `brightness()` filters,
  pale spark heads, white rims and glass, warmer sub-heads, text-shadow glows.
  Kept as-is on paper, each beat brightens toward the page and stops being
  visible while the motion still "works". Every lit value is therefore a token
  pair (rest and lit) and light supplies a pair pointing the other way (for
  example, the Fan spark head is dark on paper). Lifts inside dark artwork
  keep their direction: the Fan's centre tile is a dark photograph in both
  themes and clips its contents, so its glass, bar, photograph lift and
  ignition (`--fan-tile-lit`) stay as in dark, and only its rim, which meets
  the paper, flips (`Fan.css` light block).

---

## 7. Gotchas

- **Edit both light blocks.** A value added to one block only works for either
  system-preference visitors or explicit-choice visitors, never both. Diff the
  two blocks after editing.
- **Read colours inside the build**, never at module scope (4.3).
- **Never `clearProps: 'all'`** on an `<Icon>`: it removes the inline `--icon`
  and the glyph becomes a solid box.
- **Masks flatten.** Do not convert a multi-colour or gradient file to
  `<Icon>`.
- **Check the dark render first.** A light change that moves dark is a
  regression; `scripts/pixel-diff.mjs` in dark catches it.
- **What screenshots cannot see**: the WebGL mark (pixel-diff disables WebGL),
  and loops that settle to the wrong colour after a live theme switch. Switch
  theme in the browser after the page has settled and watch each loop through
  one cycle.
