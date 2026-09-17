# Light mode — implementation strategy

Analysis only. No source file was changed to produce this document.

Measured against `claude/sweet-volta-5i0ubl` at the time of writing: 266 SVG files
(264 under `src/assets`, plus `HeroLogo/logo-outline.svg` and `public/favicon.svg`),
221 of them actually referenced from source, 45 dead. 243 literal colour
declarations in CSS against 207 token references. 17 TypeScript modules carrying
literal hex or `rgb()`.

---

## 0. The shape of the job, in one paragraph

This is not a palette swap. Three things make it structural:

1. **Colour is not in the token layer.** `tokens.css` holds 14 colours; the
   sections hold 229 more as literals. Roughly 47% of the rendered colour comes
   from a token. Editing `tokens.css` alone moves less than half the page.
2. **The tokens that do exist are overloaded.** `--white-font` is used 67 times
   for four different jobs — page ink, the label on the red button, the white
   fill of the Markets card, and literal white inside dark artwork. It cannot be
   flipped in place; flipping it turns the primary button's label near-black on
   red (2.3:1) and paints the Markets card black.
3. **Light is not the negative of dark; it is the opposite *direction*.** In this
   design, energy means *brighter*: `brightness(2.4)` on the fan diamonds,
   `brightness(1.5)` on the tile photograph, `#ffc0a4` spark heads on black
   arcs, `#ff8f63` lit strokes over `#e5331e` rings, white-alpha glass over dark
   ground. On paper, brighter is *less*. Every one of those beats has to invert
   its direction while keeping its timing, its geometry and its easing. This is
   the single idea the whole plan turns on, and it is why the answer is never a
   filter.

Everything below follows from those three.

---

## 1. The token layer

### 1.1 The problem before the palette: role vs. value

`tokens.css` names values (`--white-font`, `--orange-100`), not roles. A theme
can only flip a role. The first move is therefore a **pure alias pass**, in
`tokens.css` only, that introduces role tokens defined as the existing values:

```css
:root {
  /* existing value tokens stay exactly as they are — nothing below changes
     a single rendered pixel in dark mode. */
  --ink:          var(--white-font);   /* text that must contrast with the page */
  --ink-2:        var(--color-nre-body);
  --ink-muted:    var(--color-body);
  --accent:       var(--orange-100);   /* the brand red, as text or as fill  */
  --accent-deep:  var(--orange-200);
  --accent-lift:  var(--orange-300);
  --on-accent:    #fffbf8;             /* NEVER flips: the label on red       */
  --art-ink:      #fffbf8;             /* white inside dark artwork           */
  --art-ink-2:    #9d9d9d;
  --pos:          var(--green);
  --neg:          var(--red);
  --page:         var(--bg);
  --panel:        var(--surface);
  --panel-2:      var(--surface-2);
  --line:         var(--hairline);
  --veil:         var(--glass);
  --veil-line:    var(--glass-border);
}
```

The section agents then migrate their own file's call sites from value token to
role token as part of their section work. **No cross-file contention, and the
alias pass itself diffs `IDENTICAL` by construction.**

Why `--on-accent` is separate: `global.css:105` is
`.btn--primary { background: var(--orange-100); color: var(--white-font) }`. In
light mode the background becomes `#a21605` and the label must stay `#fffbf8`
(7.69:1). If it followed `--ink` it would become `#1a1512` on `#a21605` — 2.29:1,
unreadable, on the primary call to action of a financial product.

Why `--art-ink` is separate: `Familiar.css:86` is the phone screen
(`background: #151618; color: var(--white-font)`). Whether that white flips
depends on whether the phone screen itself is re-tinted (§6.3), which is a
per-section decision, not a global one.

### 1.2 The light palette

Derived from `#A21605` and from the dark tokens' own contrast ratios, so light
mode reproduces dark mode's *legibility hierarchy* rather than its luminance.

| Role | Dark | Ratio (dark) | **Light** | **Ratio (light)** | Note |
|---|---|---|---|---|---|
| `--page` | `#0f0e0d` | — | **`#fffbf8`** | — | The dark theme's own ink, reused as paper. Warm, and already in the brand. |
| `--panel` | `#1b1b1a` | 1.12 vs page | **`#f7f0ea`** | 1.10 vs page | Raised panels read by tint, not by shadow — same grammar as dark. |
| `--panel-2` | `#2b2928` | 1.33 vs page | **`#ece1d9`** | 1.25 vs page | Inactive bars, tracks. |
| `--line` | `#313131` | 1.48 vs page | **`#e3d6cb`** | 1.38 vs page | Hairline. A stronger `#d9c9bc` (1.57) is available where 1.38 disappears. |
| `--ink` | `#fffbf8` | **18.74:1** | **`#1a1512`** | **17.59:1** | Headings, nav, section titles. Near-parity. |
| `--ink-2` | `#9d9d9d` | **7.11:1** | **`#5e5651`** | **6.97:1** | Body copy. Deliberately matched to within 0.15. |
| `--ink-muted` | `#626262` | **3.16:1** | **`#7a716c`** | **4.63:1** | Eyebrows. **Deliberate divergence — see below.** |
| `--accent` | `#e5331e` | 4.43:1 | **`#a21605`** | **7.69:1** | Given. Stronger as text than the dark accent is. |
| `--accent-deep` | `#c02816` | 3.27:1 | **`#7e0202`** | **10.76:1** | Gradient dark stop; already in the glows. |
| `--accent-lift` | `#e9513f` | 5.25:1 | **`#c4361c`** | **5.24:1** | Hover, gradient light stop. |
| `--on-accent` | `#fffbf8` | 4.23:1 on `#e5331e` | **`#fffbf8`** | **7.69:1** on `#a21605` | Does not flip. |
| `--pos` | `#15a456` | 5.95:1 | **`#0b6e37`** | **6.18:1** | `#15a456` on paper is 3.15:1 and `#00c950` is **2.15:1** — both fail. |
| `--neg` | `#a21605` | 2.44:1 | **`#b01309`** | **6.93:1** | Must differ from `--accent` in light; see §1.3. |
| `--veil` | `rgba(255,255,255,.04)` | — | **`rgba(26,21,18,.045)`** | — | Glass goes from lifting to settling. |
| `--veil-line` | `rgba(255,255,255,.12)` | — | **`rgba(26,21,18,.14)`** | — | Alpha nudged up: dark ink on paper is less visible per unit alpha. |

Reference points on `--panel` (`#f7f0ea`): `--ink` 16.04:1, `--ink-2` 6.36:1,
`--accent` 7.01:1. On `--panel-2` (`#ece1d9`): `--ink` 14.09:1, `--ink-2` 5.58:1.

**The one deliberate divergence.** The dark eyebrow (`--color-body #626262` on
`#0f0e0d`) is **3.16:1** — it fails WCAG AA for 16px text today. Reproducing that
failure in light would be a choice to ship a known defect twice. The recommended
`#7a716c` (4.63:1) keeps the eyebrow visibly quieter than body copy while
passing. If the designer insists on matched *weight* rather than matched
legibility, `#8c827c` gives 3.64:1 — still better than dark, still a fail. Take
the decision explicitly; do not let it be made by a find-and-replace.

**The pre-existing near-miss to leave alone.** `.btn--primary` in dark is
`#fffbf8` on `#e5331e` = **4.23:1** at 16px/600 — under AA. Light mode's
equivalent is 7.69:1. Do not "fix" the dark button while doing this work; that
is a dark-mode regression by the letter of the gate, and it is a separate
decision.

### 1.3 The `--red` collision

`--red` is already `#a21605` in the dark tokens — it is `.ticker__pill--down`
(a price going down), `.fam__mkt-foot--red`, and the top stop of the Onboard
card's gradient. In light mode `#A21605` becomes the *brand* red. Loss and brand
would then be the same colour on a trading page.

Split them: `--accent: #a21605` (brand) and `--neg: #b01309` (loss). They are
close but distinguishable, and `--neg` is only ever used as a fill behind
`--on-accent` or as a small delta figure. Flag this to the designer — it is the
one place where the given value forces a decision rather than settles one.

### 1.4 Selection, application and first paint

**Declaration.** In `tokens.css`, after the existing `:root` block:

```css
/* The system preference is the default, and only when nothing was chosen. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* light values */ }
}
/* An explicit choice wins at any system setting. */
:root[data-theme="light"] { /* the same light values */ }
```

Write the light values once in a `@layer`-free shared block or accept the
duplication; do not try to be clever with a custom-property indirection, because
a custom property that resolves differently per media query still cascades once
and is easy to get wrong under `@media` + attribute together.

**`color-scheme`.** Add `color-scheme: dark` to the dark `:root` and
`color-scheme: light` to the light one, so scrollbars, form controls and the
canvas fallback follow. **Note that adding `color-scheme: dark` changes how dark
mode renders the scrollbar today** — it is a real (small, intended) dark-mode
change that `theme-snapshot.mjs` cannot see. Call it out to the user rather than
letting it appear as a surprise.

**Persistence.** `localStorage['phorecast-theme']`, values `'light' | 'dark'`,
absent meaning "follow the system". A `matchMedia('(prefers-color-scheme: light)')`
listener updates the document only while the key is absent.

**No flash.** A blocking inline script in `<head>` of `index.html`, before the
stylesheet and before `<div id="root">`:

```html
<script>
  try {
    var t = localStorage.getItem('phorecast-theme');
    if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
  } catch (e) { document.documentElement.dataset.theme = 'dark'; }
</script>
```

It must be inline (no `src`), it must be in `<head>`, and it must be wrapped in
`try` — Safari private mode throws on `localStorage`. Because `main.tsx` already
writes `document.documentElement.dataset.js`, this follows an established
pattern in the file.

`<meta name="theme-color" content="#0f0e0d">` gains a light sibling:

```html
<meta name="theme-color" content="#0f0e0d" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#fffbf8" media="(prefers-color-scheme: light)">
```

and the toggle updates the matching tag imperatively, since `media` alone cannot
follow an explicit override.

**The switcher.** A `<button>` in `Nav.tsx`'s `.nav__actions`, plus a copy in
`.nav__sheet-actions` for the mobile sheet. `aria-pressed` is wrong here (it is
not a toggle of one state), so use a plain button with an accessible label that
names the *destination* ("Switch to light mode") and `aria-live="polite"` on
nothing — announce via the label change only. Two spans in a `.roll` reuse the
existing hover language for free.

### 1.5 Re-initialising motion on a theme change — the largest runtime hazard

`useSectionMotion` (`src/lib/motion.ts`) builds a section **once** and guards
rebuilds with `el.dataset.motionBuilt`. Six modules read their cool-down targets
from `getComputedStyle` **at build time** (§4.1). If the theme flips after a
section has built, those modules will keep cooling *to dark-mode colours on a
light page* — the fan pills would settle back to near-black on paper, the
Familiar cards to `rgba(255,255,255,.11)` over paper, forever.

Three options, in order of preference:

1. **Theme epoch dependency (recommended).** A module-level subscribable counter
   in a new `src/lib/theme.ts`; `useSectionMotion` takes it as a `useLayoutEffect`
   dependency. The existing cleanup path (`ctx.revert()`, `delete motionBuilt`,
   `rehide()`) already does exactly the right thing — it is the same
   mount → cleanup → mount cycle StrictMode runs on every load today, so it is
   the best-tested path in the file. Entrances replay on a theme switch, which
   is honest: the user asked for a different page.
   *Risk to dark mode:* the epoch must not change when the theme does not. Guard
   the setter on an actual value change.
2. **`key={theme}` on `<main>` and `<Footer>` in `App.tsx`.** Same visible
   result, does not touch `lib/motion.ts` at all, but throws away the whole React
   tree including the Three.js scene, which then re-initialises.
3. **`location.reload()` on switch.** Zero risk, zero code in the motion layer,
   and genuinely defensible for a landing page. Keep this in your pocket: if the
   epoch approach shows any instability against the gate, fall back to it rather
   than debugging the motion layer under time pressure.

Whichever is chosen, `lib/motion.ts` is the highest-blast-radius file in the
repo. It belongs to the spine agent (§7, Agent 0) and to nobody else.

---

## 2. The SVG assets

### 2.1 Correcting the count

The brief's figure — 219 of 264 carrying baked `fill="#…"` or `stroke="#…"` — is
right as far as it goes, and it **undercounts by 19**. Figma also exports named
colours:

```
fill="none"          264 occurrences
stop-color="white"   163
fill="white"          90
stroke="white"        71
fill="black"           5
stroke="black"         1
```

19 files bake `white`/`black` as a *name* and carry no hex at all. A grep for
`fill="#` will walk straight past them, and they are not minor: `bento/arrow-white.svg`
(a white arrow that vanishes on paper), `steps/s3-grid-short.svg` and
`s3-grid-tall.svg` (white gridlines), `bento/cursor.svg`, `icons/apple.svg`,
`familiar/bank.svg`, `familiar/filter.svg`, `hero/btc-glyph.svg`,
`steps/mark-ribs.svg`, `steps/mark-slices.svg`, plus 9 more.

**Real figure: 238 of 264 carry baked paint.** Exactly one file
(`bento/onboard/logo-watermark.svg`) has none.

Of the 264, **45 are not referenced from any source file** — dead exports
(`pillars/chain-1..8.svg`, `pillars/pill3-1..4.svg`, ten `hero/*` leftovers,
nine `bento/*`, five `familiar/*`, `fan/fan-upper-b.svg`, `icons/plus-tag.svg`).
**Do not theme them.** Deleting them is out of scope here but worth a follow-up;
for this job they simply come off the work estimate. That leaves **221 live
assets**, and those are what the classes below count.

### 2.2 The rule that makes this parallelisable

> **No agent edits an existing file under `src/assets/`.**

Every live asset is shared or potentially shared, and an edit to one is a
dark-mode change in every section that uses it. All colour control is exercised
*at the call site* — by CSS, or by a per-instance transform of an inlined string.
New light-variant files are permitted and are owned by the section that adds
them. This one rule removes all asset contention between agents and makes
"dark mode cannot regress" true by construction for 409 KB of artwork.

### 2.3 The classes

| Class | Count | Mechanism | Risk to motion |
|---|---:|---|---|
| **A — mono neutral glyph** | 76 | CSS `mask-image` + `background: currentColor` | Low, but not nil |
| **B — mono brand glyph** | 53 | CSS `mask-image` + `background: currentColor` | Low, but not nil |
| **L — locked third-party mark** | 39 | Leave alone; adjust the plate under it | None |
| **F — gradient illustration** | 24 | Inline via `?raw`, prefixed ids, per-theme stop map | **High** |
| **E — multi-colour flat illustration** | 15 | Inline via `?raw` **or** light-variant file | Medium |
| **0 — no baked paint** | 14 | Already inherits; nothing to do | None |
| *(dead)* | 45 | Nothing | — |

*(A + B = 129; A and B split only by hue, and share one mechanism.)*

---

#### Class A — mono neutral glyph · **76 files**

One flat colour, unsaturated. The colour histogram is nearly a token list
already: `#9d9d9d` ×17, `#fffbf8` ×17, `#a6a6a6` ×16, `#b5b5b5` ×6, `#d9d9d9` ×6,
`#4b4b4b` ×4, `#cacaca` ×2, `#626262` ×2, and seven singletons.

Representative: `fan/icon-crypto.svg` … `icon-tech.svg` (8), `social/x.svg`,
`social/discord.svg`, `social/telegram.svg`, `social/tiktok.svg`,
`bento/custody/icon-stocks.svg` and its seven siblings, `pillars/pill-1.svg`,
`hero/toast-bolt.svg`, `hero/slide4/circle-lg.svg`, `steps/s1-envelope.svg`,
`icons/chevron-down.svg`.

**Mechanism: `mask-image`.** The file stays on disk, stays a separate cached
HTTP request, and the element's colour becomes ordinary CSS:

```css
.icon {
  display: block;
  -webkit-mask-image: var(--icon);  mask-image: var(--icon);
  -webkit-mask-size: 100% 100%;     mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;   mask-repeat: no-repeat;
  background: currentColor;
}
```

`mask-size: 100% 100%` — not `contain` — because every one of these files carries
`preserveAspectRatio="none"`, so the `<img>` they replace stretches to its box
today. `100% 100%` reproduces that exactly; `contain` would letterbox and move
geometry.

Default `mask-mode` is `match-source`, which for an SVG image source is alpha.
These files draw glyph-on-transparent, so the alpha channel *is* the silhouette.
Verified on `fan/icon-crypto.svg`, `social/x.svg`, `steps/s1-envelope.svg`.

**Costs, honestly.** (i) A markup change per call site — 129 of them across
classes A and B. (ii) Any internal multi-tone detail is lost, which is precisely
why classes E and F are excluded. (iii) Ship the `-webkit-` prefixes; Safari
still needs them.

**Call-site shape.** Keep the geometry contract in one place rather than
open-coding a span 129 times:

```tsx
// src/components/Icon.tsx
export function Icon({ src, w, h, className = '' }: {...}) {
  return <span aria-hidden="true" className={`icon ${className}`}
    style={{ '--icon': `url(${src})`, width: w, height: h } as CSSProperties} />;
}
```

`<img src={x} alt="" width={20} height={20} />` → `<Icon src={x} w={20} h={20} />`.
Mechanical, reviewable, and the width/height translation is the only place a
geometry regression can hide — which is exactly what the gate is good at.

**The two call sites that must convert first.** `Footer.css:50-54` and
`Fan.loop.ts:131-132` are the existing `brightness(0) invert(1)` hacks. They are
the proof cases: conversion deletes the filter entirely, `Fan.loop.ts`'s pill
icons become `color`-driven like their labels, and the comment at
`Fan.loop.ts:123-130` that predicts this ("When the icons are inlined this
becomes `fill: currentColor` and the filter goes") gets to come true.

**Risk to motion.** Two real ones.
- `Fan.loop.ts:565-576` tweens `filter` on those `<img>` elements. Once masked,
  the tween target changes from `filter` to `color`, which changes the *shape* of
  the timeline, not just a value. The fan agent owns both files, so this is a
  single coherent edit — but it is the one class-A conversion that is not
  cosmetic.
- `Footer.css:54` tweens the filter on `:focus-visible`. Same treatment.

Everything else in class A is an `<img>` nothing animates.

---

#### Class B — mono brand glyph · **53 files**

Same mechanism, saturated colour. `#e5331e` ×34 dominates; then `#f03725` ×3,
`#00c950` ×3, `#5eac24` ×2, `#e7000b` ×2, `#e82127` ×2, and singletons
(`#ff632a`, `#662514`, `#511715`, `#ff4900`, `#db2510`, `#f7ce45`).

Representative: `bento/arrow-orange.svg`, `bento/pie-1..3.svg`,
`built/node-ring-a..c.svg`, `built/ring-mid.svg`, `built/you-dot.svg`,
`faq/seal.svg`, `steps/s1-logo.svg`, `steps/s2-node.svg`,
`hero/slide3/gift-1..5.svg`, `pillars/mark-orange.svg`, `fan/tile-logo.svg`.

Masked, these become `color: var(--accent)` and follow `#e5331e → #a21605` for
free. That is 34 files themed by one token.

**Three sub-cases that are not brand red and must not be swept up:**
- `#00c950`, `#5eac24`, `#2bb673` (5 files: `familiar/batt-tip.svg`,
  `familiar/loc.svg`, `familiar/trend-b.svg`, `hero/slide2/delta-up.svg`,
  `hero/trend-up.svg`, `hero/slide2/trend-arrow-nfl.svg`) are **up/positive**.
  They map to `--pos`, not `--accent`. On paper `#00c950` is 2.15:1 — a price
  rise nobody can read.
- `#e7000b`, `#e82127`, `#db2510` are **down/negative** → `--neg`.
- `#f7ce45` (`steps/s1-batt-tip.svg`) is a battery-charging indicator inside a
  phone mock — artwork, not brand. Ties to §6.3.

**Risk to motion.** `bonus.ts`, `funds.ts`, `markets.ts` and `bt1.ts` animate
transform/opacity on these, never colour. Converting to a mask changes the
element's tag; check `querySelector` selectors that assume `img`. A grep for
`querySelectorAll<HTMLElement>('img')` finds `Fan.loop.ts:471` — it is the only
one, and it is inside the fan agent's own file.

---

#### Class L — locked third-party mark · **39 files**

Real-world marks whose colours are not ours to change: Tesla `#e82127`,
NVIDIA `#76b900`, the ECB roundel `#003399`/`#ffed00`, the NFL shield
`#013369`/`#d50a0a`, Kansas City Chiefs `#e31837`, Bitcoin `#f7931a`, the
Nikkei, S&P 500, DAX and Apple wordmarks, plus the neutral exchange tiles
(`bento/tile-*.svg`, `steps/s3-apple.svg`, `s3-sp500.svg`, `s3-tesla.svg`).

**Mechanism: leave the file alone.** Where a mark is drawn in a near-black
(`#0c0c0c` on `tile-nikkei.svg`, `tile-solana.svg`, `tile-sp500.svg`,
`tile-tesla.svg`) it already sits on a white plate — `.mk__tile--light
{ background: #e6e6e6 }`, `.mk__tile--solana { background: #fff }` — and needs
nothing at all in light mode. Where a mark is drawn light for a dark plate
(`hero/slide3/nikkei.svg` and `sp500.svg` at `#9d9d9d`, `steps/s3-apple.svg` at
`#4b4b4b`), **change the plate, not the mark**: keep a dark chip under it. Two
call sites, both cheap.

`familiar/ecb.svg` and `hero/slide2/nfl-logo.svg` bake `#fffbf8` inside the mark
itself and cannot be moved either way. They live inside the phone screen and the
slide-2 card; whatever §6.3 decides for those containers decides for these.

**Risk to motion: none.** Nothing animates a third-party mark's colour.

---

#### Class F — gradient illustration · **24 files, the hard class**

Multi-stop gradients, often `userSpaceOnUse`, often several per file.

| File | Stops | Notes |
|---|---|---|
| `fan/fan-upper.svg`, `fan/fan-lower.svg` | `#d5d2d0` `#f03725` `#f9f0e8` | 4 gradient ids each, **already inlined** |
| `steps/s3-chart.svg` | 7 colours, 3 ids | already inlined by `PanelTrade.tsx` |
| `hero/slide3/stacks.svg` | 3 colours | already inlined by `SlideBonus.tsx` |
| `bento/grid.svg`, `bento/markets/grid.svg`, `bento/bonus/grid.svg`, `hero/slide2/card-grid.svg` | 22–24 ids each | field grids |
| `hero/chart-xau.svg`, `hero/slide2/chart-xau.svg`, `hero/slide2/chart-nfl.svg` | fade-to-ground area fills | the ground colour is baked in |
| `hero/bracket.svg`, `hero/slide3/bracket.svg`, `hero/slide3/dashed.svg`, `hero/slide2/connector-left/right.svg` | `#1b1b1a → #ffc194` | fade from surface to peach |
| `steps/glow.svg`, `steps/s1-connector.svg`, `steps/s2-lines.svg` | mixed | |
| `built/line.svg`, `built/link-main.svg` | `#1d1c1b → #e5331e` | |
| `bento/bonus/marker.svg`, `bento/custody/wallet-disc.svg` | | |
| `hero/slide4/dashed-path.svg`, `icons/trend-up.svg` | | |

Look at what those stops *are*: eight of them fade **from the dark ground colour**
(`#1b1b1a`, `#1d1c1b`, `#1a120d`, `#1a1918`, `#19100e`) **to a warm accent**. They
are not decorations that happen to be dark — the dark ground is a *stop in the
gradient*, chosen so the artwork dissolves into the page. On paper those become a
dark smear over cream. `mask-image` cannot help: a mask flattens a gradient to
its alpha and throws the colour away.

**Mechanism: inline via `?raw`, with a per-theme stop map.** The pattern is
already in the repo three times — `Fan.tsx:88-105`, `SlideBonus.tsx:7`,
`PanelTrade.tsx:17` — and `Fan.tsx`'s comment block is the definitive write-up of
the id-collision trap this project has already been bitten by:

> "Duplicate ids all resolve to whichever came first, and these gradients are
> `userSpaceOnUse` with per-path coordinates, so the collision does not merely
> repeat one fade — it re-aims the fade of fifteen arcs onto a sixteenth's
> geometry, silently and without an error anywhere."

So: **every inline instance must prefix every `id="…"` and every `url(#…)`**,
exactly as `Fan.tsx:88-92` does, and spaces must be stripped from ids. Copy that
function; do not re-derive it.

For colour, transform the string once per theme at module scope and pick at
render time:

```ts
const MAP_LIGHT: Record<string, string> = { '#1b1b1a': '#f7f0ea', '#e5331e': '#a21605', ... };
const light = Object.entries(MAP_LIGHT).reduce(
  (s, [from, to]) => s.replaceAll(from, to).replaceAll(from.toUpperCase(), to), raw);
```

Both cases matter: Figma exports `stop-color="#E5331E"` uppercase in some files
and lowercase in others.

**Costs.** (i) Weight: the 221 live assets are **409 KB** on disk, 334 KB of it
in the mono classes. Inlining the mono classes would move a third of a megabyte
out of lazily-fetched, individually-cached image requests and into the critical
JS bundle. That is the decisive argument for masking A and B rather than
inlining everything. Class F is only ~75 KB and much of it is already inlined.
(ii) Two copies of each F string at module scope, so ~150 KB of strings if every
F file is inlined in both themes — build the inactive theme's copy lazily, or
accept it.

**Risk to motion: high, and specifically here.**
- `Fan.motion.ts` / `Fan.loop.ts` select `.fan__spark` twins that `Fan.tsx:95`
  emits by regex over the raw string, and `Fan.loop.ts` walks every `<path>` for
  `getTotalLength()`. Any change to the inlining pipeline changes what those
  selectors see. The fan's sixteen arcs plus twins are **120 SVG elements** in
  the snapshot.
- `PanelTrade.tsx:180-210` builds a `<clipPath>` and injects a head circle into
  the inlined `s3-chart.svg`'s element graph, then drives `stroke-dashoffset`.
  The id prefix must not break its `url(#…)` reference.
- `SlideBonus.tsx` inlines `stacks.svg` for the same reason.

The rule for all three: **change the colour map, never the id/element pipeline.**

---

#### Class E — multi-colour flat illustration · **15 files**

Two to four flat colours, no gradients. `built/node-disc.svg`,
`node-disc-soft.svg`, `node-lock.svg`, `ring-disc.svg` (all `#1d1c1b` + `#e5331e`
— a dark disc with a brand ring); `bento/custody/node-dot.svg`;
`bento/bonus/wallet-badge.svg`; `steps/s2-tile1.svg`, `steps/s3-target.svg`
(`#1b1b1a` + `#4b4b4b`); `hero/slide2/pill-disc.svg`, `trend-ring.svg`;
`icons/live-dot.svg`; `bento/markets/fx-pair-usd.svg`, `fx-pair-alt.svg`;
`bento/node-dot.svg`; `hero/slide3/stacks.svg`.

Two routes, and the choice is per-file:

- **Inline + colour map** where the file is small and used once or twice
  (`built/node-*.svg`, `steps/s2-tile1.svg`). Cheap, no new asset.
- **A light-variant file** (`built/node-disc-light.svg`) where the light version
  is a genuine re-draw rather than a substitution — which is true wherever the
  dark colour is a *hole* (`built/ring-disc.svg`'s `#22201d` centre reads as
  "empty" on black and as "filled" on paper).

Nine of the fifteen are the `#1x1x1x` + `#e5331e` family, so one shared map
covers most of the class.

**On a parallel light asset set generally.** The brief is right that it is
truthful and right that it doubles the count, and there is a third cost worth
stating: **the Figma file has no light design**, so someone authors those colours
by hand, and they will drift from whatever Figma eventually produces. Confine it
to class E and to the handful of F files where a map genuinely cannot express the
change — a bounded, nameable list — rather than adopting it as the house
mechanism.

---

#### Class 0 — no baked paint · **14 files**

`bento/onboard/logo-watermark.svg` (truly none) plus 13 that bake only
`fill="white"` / `stroke="white"` — the files §2.1 says a hex grep misses.

For a mono file, `fill="white"` is *easier* than a hex: mask it (class A
mechanism, the alpha is the silhouette) and the named colour never renders. The
only reason to call them out separately is that **they will not appear in any
inventory built from `fill="#`**, and an agent working from such an inventory
will ship `bento/arrow-white.svg` as a white arrow on cream paper.

---

## 3. Hardcoded colour in CSS, by section

243 literal declarations across 27 stylesheets (14 of them inside `tokens.css`).
Classified **T** = theme-dependent (must change), **A** = artwork-internal
(changes only if §6.3 re-tints that illustration), **F** = genuinely fixed.

| File | Count | Notable literals | Verdict |
|---|---:|---|---|
| `familiar/Familiar.css` | 35 | `#7e0202` `#b43725` `#ec7850` `#fbd6ca` `#fff8f0` (glows, L23-33); `#000` `#151618` `#1c1d20` `#1a1b1e` `#232427` (phone, L79-118); `#10281d` `#2a1416` `#00a63e` `#e7000b` (chips, L132-133, 182-183); `rgba(255,255,255,.04/.08/.10/.12/.18/.28)` ×7 | Glows **T**; phone **A**; chips **A** (semantic pairs inside the app); white-alpha **T** |
| `hero/slides/SlideAccount.css` | 25 | 12 local `--sl2-*` vars (L41-52) already factored; `#fb2c36` `#ff6467` `#27272a` `#2c2c2f` `#6a2626` `#1d1c1b` `#ffad00` | **A** — this slide is a product screenshot. Re-theme by editing the twelve `--sl2-*` values only; the rest follow. Best-factored file in the repo. |
| `steps/panels/PanelFund.css` | 19 | `#1d1c1b` tiles; `#f55e22 → #2d1208` bar gradient (L122); five stacked `rgba(0,0,0,…)` shadows (L152-156); `rgba(255,73,7,.3)` / `rgba(149,43,4,.3)` glow (L147-150) | **A** — device panel. Shadows **F** (black shadows work on paper). |
| `bento/Bento.css` | 19 | `#0f0e0d→#7e0202` `#d1541c` `#f99e57` glows (L71-76); `rgba(12,12,12,.3)` card (L88); `#0e0e0d`+`#323232` bonus card (L161); `#000` ink (L112,170); `#e6e6e6` `#fff` `#d9d9d9` tiles (L179-189); `rgba(255,251,248,.92)` (L217) | Glows **T**; card grounds **T**; `#000`/`#fff` tiles **A** (they are the *light* card, §6.2) |
| `built/Built.css` | 18 | three radial glows `#f9bfaa #ec7850 #b43725 #7e0202` (L7,55,60); `#eeeeed` label; `#f03725` blurred bars (L84,120) | **T**, all of it — §6.1 |
| `steps/panels/PanelRegister.css` | 17 | `#1d1c1b` cards; `#323232` `#4b4b4b` `#626262` skeleton bars; `#cacaca` `#b5b5b5` labels; `#fff` caret | **A** — device panel |
| `footer/Footer.css` | 12 | `#0f0e0d→#8c0303` `#b43725` `#ec7850` `#fbd6ca` glows (L10-13); `rgba(255,255,255,.06/.10/.12/.24)` ×6; `rgba(255,255,255,.12)` wordmark (L87) | **T**, all of it |
| `pillars/Pillars.css` | 10 | four glows (L45-48); `rgba(255,255,255,.02/.06/.12/.20)` rows (L63,96-101) | **T**, all of it |
| `hero/Hero.css` | 7 | `#0f0e0d→#7e0202` `#c23a26` `#f15034` `#ec7850` `#fbd6ca` glows; `rgba(250,203,185,.9)` halftone dots (L61) | **T** — §6.1. Halftone uses `mix-blend-mode: soft-light`, which behaves differently over paper. |
| `steps/Steps.css` | 7 | `#f69179` rail; `#211f1e` hover (L84); `#141312` `#1a1918` `#2c2b2a` panel grounds; `rgba(255,255,255,.12)` | **T** |
| `bento/boxes/BoxMarkets.css` | 7 | `--mk-ink: #000`, `--mk-tile-light: #e6e6e6`, `--mk-tile-dark: #313131`, `--mk-edge: rgba(0,0,0,.09)`, `#fff` ×3, `#d9d9d9` | **A**, and the crux of §6.2. Already factored into four local vars — re-theme those. |
| `steps/panels/PanelTrade.css` | 6 | `#161514` `#3d3d3d` `#1b1b1a` `#fff` | **A** |
| `bento/boxes/BoxOnboard.css` | 6 | `var(--red)→#ff632a→#f8a361` gradient (L29); `rgba(255,255,255,.16)`, `rgba(238,238,238,.49)` pills; `rgba(242,109,74,.58)` (L134) | **A** — the red card works in both themes; only its white-alpha pills need attention |
| `faq/Faq.css` | 5 | `#141312` row; `rgba(0,0,0,.35)` shadow; `rgba(255,255,255,.10)`; `rgba(229,51,30,.24)` / `rgba(178,52,37,.4)` chip | **T** |
| `bento/boxes/BoxBonus.css` | 3 | `#e6e6e6`, `rgba(0,0,0,.09)`, `#1d1c1b` | **A** |
| `hero/Position.css` | 3 | `#3a3837` hover; `rgba(255,251,248,.3)` ×2 | **T** |
| `hero/slides/SlideBonus.css` | 3 | `rgba(255,255,255,.05)` | **T** |
| `fan/Fan.css` | 2 | `#000` tile (L74); `rgba(255,255,255,.39/.13)` pill borders | **T** |
| `bento/boxes/BoxCustody.css` | 1 | `#2f110c` | **A** |
| `hero/StackDiagram.css` | 1 | `rgba(139,139,139,.19)` | **T** |
| `hero/TickerCard.css` | 1 | `rgba(0,0,0,.65)` shadow | **F** |
| `hero/slides/SlideFuture.css` | 1 | `rgba(255,255,255,.13)` | **T** |
| `global.css` | 1 | `#000` in the `glow-fade` mask gradients | **F** — a mask's colour is meaningless, only its alpha is read. Do not "theme" these. |

### The dominant pattern: white-alpha

**`rgba(255, 255, 255, α)` appears ~30 times** across Familiar (7), Footer (6),
Pillars (5), Steps (2), Fan (2), Bento (2), Faq (1), BoxOnboard (2), SlideBonus
(1), SlideFuture (1), SlideAccount (2), PanelRegister (1), PanelFund (1). It is
the dark theme's entire idiom for "raise this slightly" — glass, hairlines,
hover states, the cropped footer wordmark.

On paper, white-alpha is invisible. Each one needs a token
(`--veil`, `--veil-line`, and a `--veil-strong` for the `.39`/`.28` cases) that
resolves to white-alpha in dark and to ink-alpha in light. This is the single
highest-count, lowest-risk edit in the whole job, and it is the reason
`--glass` / `--glass-border` exist but are used **twice** in the entire codebase
(`hero/TickerCard.css:9-10`).

### `#000` needs reading case by case

Five distinct meanings: a mask stop (`global.css`, meaningless — **F**), a
shadow (`TickerCard.css:56`, `Faq.css:28` — **F**), the ink of the light Markets
card (`Bento.css:112,170`, `BoxMarkets.css:39,51` — **A**), the phone bezel
(`Familiar.css:79` — **A**), and the fan tile's plate (`Fan.css:74` — **T**).

---

## 4. Hardcoded colour in TypeScript

17 files. Ten are motion modules; the rest are geometry tables and injected
`setAttribute` paint.

### 4.1 What already reads from computed style — and therefore follows a theme for free

| File:line | Reads | Follows theme? |
|---|---|---|
| `fan/Fan.loop.ts:463-469` | `pillBg`, `pillFg`, `pillOp`, `tileBorder`, `glassBg`, `subFg` | **Yes** |
| `built/loops/bt1.ts:332-335` | `youRest`, `noteRest` (`color`) | **Yes** |
| `built/loops/bt2.ts:150,159` | `cool` (label `color`), `lockCool` | **Yes** |
| `familiar/Familiar.loop.ts:167-180` | `valueRest`, `pctRest`, `ecbFootRest`, `cardBgRest`, `cardEdgeRest`, `pillBg`, `pillFg`, `tabOnRest`, `tabOffRest`, `predYesRest` | **Yes** |
| `familiar/Familiar.loop.ts:310` | `chipRest` (per-beat, not build-time) | **Yes** |
| `bento/motion/onboard.ts:32` | `readBorder` → `borderTopColor` | **Yes** |
| `bento/motion/funds.ts:147,170` | `borderTopColor` of each chip | **Yes** |
| `bento/motion/bonus.ts:158` | `borderTopColor` of the pill | **Yes** |
| `steps/panels/PanelFund.tsx:155` | `restBorder` per tile | **Yes** |
| `hero/slides/SlideAccount.motion.ts:97` | `priceInk` (`color`) | **Yes** |

**Every one of these is a build-time read**, which is exactly why §1.5 matters:
they follow a theme that was set *before the section built*, and freeze against
one set after. There is no third option — the loops cannot be made to re-read
without a rebuild.

`bento/motion/markets.ts:75` and `bonus.ts:69` read `opacity` and `transform`,
not colour; unaffected.

### 4.2 What hardcodes colour — every occurrence, with its remedy

**`src/components/fan/Fan.loop.ts`**
| Line | Value | Role | Remedy |
|---|---|---|---|
| 119 | `PILL_LIT_BG = '#e5331e'` | lit pill fill | `--accent` via `getPropertyValue('--accent')` on `document.documentElement` |
| 120 | `PILL_LIT_FG = '#fffbf8'` | lit pill label | `--on-accent` (does not flip) |
| 131-132 | `PILL_ICON_REST/LIT` filters | icon lift | **Deleted** once the icons are masked (§2.3, class A) |
| 360 | `rgba(255,251,248,0)…rgba(255,243,234,.95)…` bar gradient | the light bar | Token pair `--fan-bar-a/b`; on paper the bar must *darken*, not brighten |
| 567 | `borderColor: 'rgba(255,244,236,.9)'` | tile rim lit | `--fan-rim-lit` |
| 576 | `backgroundColor: 'rgba(255,239,227,.32)'` | glass lit | `--fan-glass-lit` |
| 608 | `color: 'rgb(201,194,189)'` | sub-head warm | `--fan-sub-lit`; in light this is *darker* than rest, not lighter |
| — | `filter: 'brightness(2.4)'` on diamonds (L~540), `brightness(1.5)` on `tileArt` | luminance lift | **Direction flip.** On paper use `brightness(.78) saturate(1.3)` or drive `opacity`/`scale` instead. Read the multiplier from a CSS custom property. |

**`src/components/fan/Fan.tsx`**
| Line | Value | Remedy |
|---|---|---|
| 27-30 | 12 diamond colours (`#e5331e` ×6, `#fffbf8` ×4, `#5b5b5a`, `#7c7c7c`) | Emit `class`, not an inline fill; colour in `Fan.css`. Table becomes `[x, y, 'accent' \| 'ink' \| 'mute']`. |
| 97 | `stroke="#ffc0a4"` in `sparkTwin` | The spark head. Must become a **dark** head on paper. Read from a CSS custom property at module init, or emit `stroke="currentColor"` on `.fan__spark` and set `color` in CSS — cleanest, since the twin has no other paint. |

**`src/components/familiar/Familiar.loop.ts`** (lines 57-66)
`UP '#00c950'` → `--pos`; `DOWN '#e7000b'` → `--neg`; `CHIP_YES_LIT '#17482e'`,
`CHIP_NO_LIT '#4a1f23'`, `PRED_YES_LIT '#17482e'` → artwork tokens on the phone
(`--app-yes-lit` / `--app-no-lit`); `ECB_FOOT_LIT '#242422'` → `--app-foot-lit`;
`CARD_BG_LIT 'rgba(255,255,255,.11)'` and `CARD_EDGE_LIT 'rgba(255,255,255,.34)'`
→ **the white-alpha problem inside a loop**; `PILL_ON_BG '#e5331e'` → `--accent`;
`PILL_ON_FG '#fffbf8'` → `--on-accent`.

**`src/components/bento/motion/funds.ts`** — L82 `ring.setAttribute('stroke', '#ff632a')`,
L89 `wire … '#f26246'`, L95 `head.setAttribute('fill', '#ff8a5c')`. These paint an
SVG overlay built in JS. Give the injected `<svg>` a class and use
`stroke="currentColor"` / `fill="currentColor"` with `color` from CSS — the
element is created here, so nothing external depends on the attribute.
L146/169 `borderColor: 'rgba(255,138,92,.75)'` and L180 `textShadow:
'0 0 12px rgba(255,251,248,.9)'` → tokens; the text-shadow is a glow and must
invert direction or be dropped in light.

**`src/components/bento/motion/bonus.ts`** — L84 `head.setAttribute('fill', '#ffd0b8')`
→ `currentColor`. L157 `borderColor: 'rgba(255,138,92,.75)'` → token.

**`src/components/bento/motion/onboard.ts`** — L90 `borderColor: 'rgba(255,251,248,.95)'`,
L98-99 `textShadow: '0 0 16px rgba(255,251,248,.9)'` → tokens + direction flip.
Note the card underneath is the red gradient, so these may legitimately stay.

**`src/components/bento/motion/markets.ts`** — L32-33 are a comment recording a
past bug, not code. No live literal. **Leave it alone**; it documents why
`settled.set(el, …opacity)` at L75 exists.

**`src/components/built/loops/bt1.ts`** — L106 `LIT = '#ff8f63'` (lit stroke over
the `#e5331e` ring); L112 `WARM = 'rgb(222,214,208)'` (what the two `#9d9d9d`
lines warm to). Both are *brighter than rest*. In light both must be *darker
than rest*: read from `--bt-lit` / `--bt-warm`.

**`src/components/built/loops/bt2.ts`** — L94 `BEAD_BG = '#e9513f'` → `--accent-lift`;
L97 `LIT = '#fffbf8'` → **direction flip**, `--bt-lit-ink`; L99 `SEALED = '#e5331e'`
→ `--accent`.

**`src/components/hero/slides/SlideAccount.motion.ts:86`** —
`return next >= priceValue ? '#00c950' : '#e7000b'`. A price tick colour, inside
the product screenshot. → `--app-pos` / `--app-neg`, which follow §6.3.

**`src/components/hero/entrance.ts:171`** — `color: next > value ? '#4ade80' : '#f87171'`.
Note these are *different* greens/reds from every other up/down pair in the repo
(Tailwind's green-400/red-400). Unify onto `--pos`/`--neg` while you are here, or
at minimum route through a token.

**`src/components/steps/panels/PanelRegister.tsx`** — L111
`borderColor: 'rgba(229,51,30,.22)'`, L131 `'rgb(229,51,30)'`. Both are
`--accent` at two alphas → `color-mix(in srgb, var(--accent) 22%, transparent)`.

**`src/components/steps/panels/PanelTrade.tsx:203`** —
`head.setAttribute('fill', '#ffd0c6')` → `currentColor` on the injected circle.

**`src/components/steps/panels/PanelFund.tsx:222`** —
`borderColor: 'rgba(255,128,96,.55)'` → token.

**`src/components/bento/boxes/BoxMarkets.tsx`** — L103 `DOW.background = '#2c2c2c'`,
L115-121 seven tile backgrounds `#853b1e … #a74620`. These are **artwork data
tables**, not motion. They belong to the light Markets card (§6.2); if that card
flips to dark they need a parallel table. Keep them as a named constant per
theme rather than scattering conditionals.

**`src/components/bento/boxes/BoxBonus.tsx:67-70`** — an inline `<linearGradient>`
in JSX ending at `#1C1B1A`, i.e. fading into the dark card. **Theme-dependent**,
and easy to miss because it is JSX, not a `.svg` file.

**`src/components/bento/boxes/BoxOnboard.tsx:26`** — a comment about `#511715`
vs `#662514`. Not code.

### 4.3 The recommended reading mechanism

Do not thread a React theme value into the motion modules — they are imperative,
they run inside `gsap.context`, and several are called from `useSectionMotion`'s
`idle` hook with only an element. Instead:

```ts
// src/lib/theme.ts
const root = document.documentElement;
export const tok = (name: string, fallback = '') =>
  getComputedStyle(root).getPropertyValue(name).trim() || fallback;
```

Call it **inside** the module's `start()`/build function, next to the existing
`getComputedStyle` rest reads — never at module scope, where it would run before
the inline theme script in a server-rendered or pre-rendered context and would
never re-read on a theme change. The existing files already have exactly the
right place to put it: `Fan.loop.ts:462-469`, `bt1.ts:332-335`,
`Familiar.loop.ts:167-180`.

Keep the current constants as the fallback argument. A missing custom property
then yields today's dark value, which is the safest possible failure mode for
the regression gate.

---

## 5. The regression gate

### 5.1 It works, and it is deterministic

Verified in this session against the running dev server: two consecutive dark
snapshots over 3 widths × 9 sections × **4,119 elements** diff to
`IDENTICAL — no geometry or colour differs at any width.` Per-section element
counts (identical at all three widths): hero 447, fan 163, footer 151, bento 171,
familiar 118, faq 92, steps 88, built 80, pillars 63.

### 5.2 Two properties of it that change how you must use it

**It compares by array index, not by identity.** `theme-diff.mjs:28-38` walks
`sa.els[i]` against `sb.els[i]`. **Inserting any element into a section shifts
every index after it and reports thousands of false differences.** The theme
switcher lives in `Nav.tsx`, which renders *inside* `.hero` (`Hero.tsx:201`) —
the section with 447 elements and the least headroom. Therefore:

> The dark baseline must be captured **after** the switcher lands, not before.

That is the load-bearing constraint on the agent ordering in §7.

**A mask conversion is not a no-op under the gate.** Replacing
`<img src>` with `<span class="icon">` keeps the geometry identical but changes
computed `backgroundColor` from `rgba(0, 0, 0, 0)` to an actual colour — which is
in `PROPS`. The diff will report colour differences for every converted icon even
when dark mode is pixel-identical.

So the gate has two tiers, and they should be stated to every agent:

- **Hard gate, never negotiable:** `geometry` must be **0**. `theme-diff.mjs:34,48`
  already separates and shouts about it.
- **Soft gate:** every reported colour difference must be individually named and
  justified in the agent's report. `IDENTICAL` is required from any agent that
  converts no icons.

After each agent lands and its colour diffs are accepted, **re-baseline** so the
next agent measures against a clean `IDENTICAL`.

### 5.3 What the fingerprint cannot see

`PROPS` (`theme-snapshot.mjs:28-30`) is a good list. These are the gaps, and
several sit directly on this job's critical path:

1. **`fill` and `stroke` are not recorded.** Inline SVG children *are* in the
   element list — the fan alone contributes ~120 of them — but the only
   properties captured are HTML ones. **Every class-F change is invisible to the
   gate.** This is the biggest hole. Adding `fill`, `stroke`, `stopColor` to
   `PROPS` is a four-word edit and roughly doubles the gate's usefulness for this
   specific job. Doing so invalidates existing baselines, so do it in Agent 0.
2. **`<img src>` is not recorded.** Swap an asset for a light variant in the
   wrong branch and the gate passes.
3. **`filter` is excluded on purpose** (`theme-snapshot.mjs:26-27`) — but filter
   is exactly how `Footer.css:50` and `Fan.loop.ts:131` carry *colour* today.
   Their conversions are unverifiable by the gate.
4. **`maskImage` / `WebkitMaskImage` are not recorded**, so the entire class A/B
   mechanism is unchecked except via `backgroundColor`.
5. **Pseudo-elements are not walked.** `getComputedStyle(el, '::before')` is never
   called. The hero's halftone (`Hero.css:55-64`), the Built card rails, and
   ~10 other decorative layers live there.
6. **WebGL is disabled** (`--disable-webgl`, line 34). The hero mark and the FAQ
   mark are literally invisible to the gate. See §6.4 — that is where a real
   blocker hides.
7. **Hover, focus and open states are never entered.** `.prow:hover`,
   `.btn--primary:hover`, `.faq__row.is-open`, `.step:hover`,
   `.position__rail:hover` — all unmeasured, all theme-dependent.
8. **Scroll-driven and mid-beat states are excluded by design** (reduced motion
   settles everything). `amplitude.mjs` is the companion for motion; run it too.
9. **`color-scheme`, scrollbars and selection colour** are outside the element
   model entirely.
10. **The 600-element cap** (line 57) is not currently binding (max 447) but the
    hero has only 153 elements of headroom, and the switcher plus any masked-icon
    wrappers eat into it silently.

Recommendation: Agent 0 adds `fill`, `stroke`, `maskImage` and the `src`
attribute to the snapshot, re-baselines, and everybody works against the improved
gate. It costs one agent-hour and closes gaps 1, 2 and 4.

---

## 6. Where the dark design's meaning is at risk

### 6.1 The glows are the brand, and they do not survive translation

Six sections carry a stack of hugely blurred radial discs — hero
(`#0f0e0d→#7e0202`, `#c23a26`, `#f15034`, `#ec7850`, `#fbd6ca`), bento, familiar,
pillars, footer, built. They are a *sunrise over a dark horizon*:
`Hero.css:76-88` even names the element `.hero__horizon` and fills it with
`var(--bg)` to cut the glow. The whole composition depends on light emerging from
darkness.

On paper, a blurred `#c23a26` disc at 85% is a stain. The composition cannot be
translated by recolouring the stops.

**Recommendation.** Keep the geometry byte-for-byte — same positions, same radii,
same blur radii, so light and dark agree geometrically and the gate stays quiet
— and change *what the layer does*:

- swap the opaque discs for `mix-blend-mode: multiply` with pale warm tints
  (`#ffd9c9`, `#ffc7b2`, `#f9bfaa`), which tints paper the way ink does rather
  than glowing through it;
- drop the `--core` layer (`Hero.css:44-53`) entirely in light — a hot core has no
  meaning on white;
- `.hero__horizon` must become the *paper* colour, not a dark disc, or it will be
  a grey blob in the middle of the hero.

**Flag for the designer:** this is the one place where light mode is not the same
design in another key. The hero's "sun rising over a dark planet" becomes "warm
paper with a blush". It is a good light-mode idea; it is not the same idea.
It should be shown to the user before nine agents build on it.

### 6.2 The Markets card is already light

`.bcard.box-markets` sets `background: var(--white-font)` and `color: #000`
(`Bento.css:168`, `BoxMarkets.css:38-39`) — a **white card on a dark page**, with
`--mk-tile-light: #e6e6e6` chips, `#fff` token plates, `rgba(0,0,0,.09)` edges,
and a seven-row table of warm tile backgrounds in `BoxMarkets.tsx:115-121`. It is
the only light surface in the whole design, and its contrast *is* its meaning.

In light mode it disappears. Two coherent answers:

- **Flip it to a dark inset panel** — the whole card becomes the dark one on a
  light page, preserving "this card is different". Almost free, because
  `background: var(--white-font)` flipping to `#1a1512` does it automatically —
  but only if `--mk-ink: #000` and the four `--mk-*` locals flip with it, and
  only if that is a *decision* rather than an accident of the token flip.
- **Keep it paper and separate it with a border and a tint** — safer, more
  conventional, loses the "step-change" the dark design has.

Either is defensible. Choosing neither — letting `--white-font` flip and leaving
`--mk-ink: #000` — produces black text on a black card. **This is the single most
likely silent breakage in the job.**

### 6.3 The device mockups: the biggest decision in the brief

Four illustrations are *phone screens or app UIs*, drawn in the product's own
dark theme:

| Where | Evidence |
|---|---|
| Familiar's phone | `Familiar.css:76-118` — `#000` bezel, `#151618` screen, `#1c1d20` search, `#1a1b1e` cards, `#232427` edges |
| Steps panel 1 | `PanelRegister.css` — `#1d1c1b` cards, `#323232`/`#4b4b4b` skeletons |
| Steps panel 2 / 3 | `PanelFund.css`, `PanelTrade.css` — `#1d1c1b`, `#161514`, `#1b1b1a` |
| Hero slide 2 | `SlideAccount.css:41-52` — twelve `--sl2-*` vars, a full product screenshot |

The user has said the illustrations should be **re-tinted, not left as dark
panels**. That means these four get a light *app* UI, which is a design job of
real size: it is drawing the product's light mode, not the marketing page's.

**Two honest sub-flags:**

- `SlideAccount.css` is already factored into twelve local variables, so it is
  the *cheapest* of the four — re-theme twelve values and the whole slide follows.
  Do this one first as the proof that a re-tinted device reads correctly.
- The Steps panels and the Familiar phone are not factored at all; each is 15-35
  scattered literals. Factor them into `--app-*` locals **first**, prove
  `IDENTICAL`, then re-theme. Two steps, not one.

If the re-tint is later judged too expensive, the fallback is a **deliberate dark
inset**: the device stays dark and gains a light-mode frame/shadow that reads as
"a screen, photographed". Do not arrive at that by accident — arrive at it by
decision, and note that it contradicts the brief's stated preference.

### 6.4 The 3D mark cannot be recoloured — it must be re-blended

`HeroLogo`'s default treatment is `lined` (`variants.ts:11`), and
`treatments/lined.ts:96-100` uses `CustomBlending` with `OneFactor` — **additive
RGB** — over a transparent canvas (`LogoScene.ts:133`,
`setClearColor(0x000000, 0)`). Additive light composited over paper saturates to
paper. **The mark will be invisible in light mode, and changing `LINED.color`
will not fix it.**

It needs `blending: NormalBlending` (or `SrcAlphaFactor`) plus a dark stroke
colour for light, and `environment.ts:33` builds an explicit `0x0a0908` dark room
whose reflections are baked into the `glass`, `solid` and `liquid` treatments too.

`theme-snapshot.mjs` launches with `--disable-webgl` and therefore **cannot see
any of this.** It is the one part of the job with a hard technical blocker and no
automated safety net, and it appears in **two** places (`Hero.tsx:193` and
`Faq.tsx:77`). Give it its own agent and its own visual sign-off.

### 6.5 Semantics that must not be lost

- **Up is green, down is red** — and on paper `#00c950` is 2.15:1 and `#15a456`
  is 3.15:1. Both must move to `--pos #0b6e37` (6.18:1). `entrance.ts:171` uses a
  *third* pair (`#4ade80` / `#f87171`) that is even lighter.
- **Brand red and loss red collide at `#A21605`** — §1.3.
- **"Lit" means brighter everywhere in this codebase.** Eight separate places
  (`brightness(2.4)`, `brightness(1.5)`, `#ff8f63` over `#e5331e`, `#ffc0a4`
  spark, `rgba(255,244,236,.9)` rim, `rgba(255,239,227,.32)` glass,
  `rgb(201,194,189)` sub-head, two `textShadow` glows). Every one inverts
  direction. A light mode that keeps them brightens toward white and the beat
  simply stops existing — the motion "works" and nobody can see it. `amplitude.mjs`
  measures movement, not visibility, so this will not be caught automatically
  either.

---

## 7. The agent work split

Ownership is by file. No two agents in the same wave hold the same file, and
**no agent touches `src/assets/`** (§2.2). Each agent's definition of done is:
`geometry = 0` on the dark diff, every colour difference named, plus a visual
check of its own section in both themes.

### Wave 0 — the spine · **1 agent, blocking**

**Agent 0 — Theme spine.** Nothing else can start.

*Owns:* `src/styles/tokens.css`, `src/styles/global.css`, `index.html`,
`src/main.tsx`, `src/App.tsx`, `src/lib/motion.ts`, `src/components/Nav.tsx`,
`src/components/Nav.css`, and creates `src/lib/theme.ts`,
`src/components/ThemeToggle.tsx`, `src/components/ThemeToggle.css`,
`src/components/Icon.tsx`, `src/styles/icon.css`. Also
`scripts/theme-snapshot.mjs`.

*Delivers:* role-token aliases (§1.1); the full light palette under
`[data-theme="light"]` + `prefers-color-scheme` (§1.2); the no-flash inline
script and `theme-color` pair (§1.4); `theme.ts` with `tok()` and the epoch
subscription; the motion re-init hook (§1.5); the switcher in both nav and
sheet; the `Icon` mask primitive and its CSS; `fill`/`stroke`/`maskImage`/`src`
added to the snapshot's `PROPS` (§5.3).

*Gate:* the alias pass alone must diff `IDENTICAL`. Then **capture the new dark
baseline** — the switcher has changed `.hero`'s element count, so every later
agent measures against this one.

*Explicitly not owned:* any section CSS. Agent 0 defines vocabulary; it does not
migrate call sites.

### Wave 1 — the two proof cases · **2 agents, parallel**

Run these before the other seven so the mechanisms are proven on the smallest
surfaces.

| Agent | Owns | Why first |
|---|---|---|
| **1 — Footer** | `footer/Footer.tsx`, `Footer.css`, `Footer.motion.ts` | 151 elements, 5 images, 11 white-alpha declarations, 4 glows, and the `brightness(0) invert(1)` hack at `Footer.css:50-54`. The class-A conversion proof. |
| **2 — Fan** | `fan/Fan.tsx`, `Fan.css`, `Fan.motion.ts`, `Fan.loop.ts` | The hardest single section: the *other* invert hack (`Fan.loop.ts:131`), 120 inline SVG elements, the `?raw` id-prefix pipeline, the spark colour, two `brightness()` lifts, and 6 build-time computed-style reads. The class-F and direction-flip proof. |

Report back before Wave 2 starts. If the `Icon` geometry contract or the
`?raw` colour map needs changing, it is far cheaper to learn it here.

### Wave 2 — the sections · **6 agents, fully parallel**

| Agent | Owns | Size |
|---|---|---|
| **3 — Pillars** | `pillars/*` (3 files) | 63 els, 21 imgs, 11 white-alpha, 4 glows. Smallest. |
| **4 — FAQ** | `faq/*` (3 files) | 92 els, 2 imgs, 9 dark fills. Plus the second `HeroLogo` mount — coordinate with Agent 9. |
| **5 — Familiar** | `familiar/*` (4 files) | 118 els, 35 CSS literals, 10 TS literals, the phone (§6.3). **Heavy.** |
| **6 — Built** | `built/Built.tsx`, `Built.css`, `Built.motion.ts`, `loops/bt1.ts`, `loops/bt2.ts` | 80 els, 26 imgs, 3 radial glows, 7 TS literals across two loops. |
| **7 — Steps** | `steps/*` including all three panels (10 files) | 88 els visible at a time but **three** device panels, 42 CSS literals, 4 TS literals. **Heaviest after hero.** |
| **8 — Hero** | `hero/*` (17 files) *excluding* `HeroLogo` | 447 els, 81 imgs / 59 unique, four slides, 33 inline SVG elements, `SlideAccount.css`'s 12 locals, `entrance.ts:171`. **The largest.** Consider splitting: 8a = `Hero.tsx`/`Hero.css`/`Position`/`TickerCard`/`StackDiagram`/`entrance.ts`; 8b = `hero/slides/*`. They share no files. |

Sequenced separately because another agent is finishing there:

| Agent | Owns | When |
|---|---|---|
| **9 — Bento** | `bento/*` (15 files) | **After** the in-flight `src/components/bento/` work lands. 171 els, 49 imgs, 19+19+7+6+3+1 CSS literals, `BoxMarkets.tsx`'s artwork tables, `BoxBonus.tsx`'s inline gradient, four motion modules. Carries §6.2, the highest-risk single decision. |

### Wave 3 — the two that need their own eyes

| Agent | Owns | Why separate |
|---|---|---|
| **10 — HeroLogo** | `HeroLogo/*` (all 20 files) | §6.4. Blending mode, not colour. No gate coverage. Mounted from both Hero and FAQ, so it must land after 4 and 8 have settled their hosts. |
| **11 — Integration** | Nothing exclusively; reviews everything | Cross-section seams (`global.css`'s `.glow-fade` masks between re-tinted sections), `color-scheme` sign-off, hover/focus/open states (gate-blind, §5.3 item 7), full-page visual review at 1600/1100/720 in both themes, final `theme-diff` and `amplitude.mjs` run. |

### Dependency graph

```
Agent 0 (spine) ──┬── 1 Footer ──┐
                  └── 2 Fan ─────┴──┬── 3 Pillars
                                    ├── 4 FAQ ────────┐
                                    ├── 5 Familiar    │
                                    ├── 6 Built       ├── 10 HeroLogo ── 11 Integration
                                    ├── 7 Steps       │
                                    ├── 8 Hero ───────┘
                                    └── 9 Bento (after in-flight bento work)
```

### The brief every agent gets

1. You do not edit `src/assets/`, `src/styles/tokens.css`, `src/lib/motion.ts`,
   or any file outside your list.
2. Migrate your file's value tokens to role tokens first. Prove `IDENTICAL`.
   Then add light values. Two commits, not one.
3. `geometry` must be 0 on the dark diff. Always. No exceptions.
4. Name every colour difference you cause in dark mode and say why.
5. Where a motion module lifts something by making it brighter, invert the
   direction in light. Read the value through `tok()` at build time, next to the
   existing `getComputedStyle` reads, with today's hardcoded value as the
   fallback.
6. Screenshot your section in both themes at 1600 and 720 and attach both.

---

## 8. Summary of the highest risks

1. **A loop that captured its cool-down colour before the theme changed.** Six
   modules, ten call sites, all build-time reads. Without §1.5 the fan pills
   settle to near-black on paper and stay there. The safe failure mode is a full
   rebuild on theme change; the unsafe one is doing nothing.
2. **`--white-font` flipped in place.** It is four roles in one token. Flipping
   it makes the primary button's label unreadable (2.29:1) and turns the Markets
   card into black-on-black. The alias pass in §1.1 exists solely to prevent this.
3. **Re-baselining at the wrong moment.** `theme-diff.mjs` compares by array
   index; the switcher inserts elements into `.hero`. Baseline before the
   switcher lands and every subsequent diff is noise, which is how a real
   regression gets waved through.

