# Design system

Tokens, type, colour and theming, the design-pixel unit, the `Icon` primitive
and the illustration convention. Everything global is in
`src/styles/tokens.css`, `src/styles/global.css` and `src/styles/icon.css`.
There is no CSS framework and no CSS-in-JS.

## 1. Tokens (`src/styles/tokens.css`)

Two layers, and the distinction matters:

- **Value tokens** name a colour straight from the Figma variables and are the
  same in both themes: `--bg #0f0e0d`, `--white-font #fffbf8`,
  `--orange-100 #e5331e`, `--orange-200 #c02816`, `--orange-300 #e9513f`,
  `--color-body #626262`, `--color-nre-body #9d9d9d`, `--surface #1b1b1a`,
  `--surface-2 #2b2928`, `--hairline #313131`, `--glass`, `--glass-border`,
  `--green #15a456`, `--red #a21605`.
- **Role tokens** name a job and are what themes flip. New code should read
  roles only.

| Role | Dark (default) | Light | Job |
|---|---|---|---|
| `--page` | `var(--bg)` | `#fffbf8` | page ground |
| `--panel` | `var(--surface)` | `#f7f0ea` | raised panels |
| `--panel-2` | `var(--surface-2)` | `#ece1d9` | inactive bars, tracks |
| `--line` | `var(--hairline)` | `#e3d6cb` | hairlines |
| `--ink` | `var(--white-font)` | `#1a1512` | headings, nav |
| `--ink-2` | `var(--color-nre-body)` | `#5e5651` | body copy |
| `--ink-muted` | `var(--color-body)` | `#7a716c` | eyebrows, quiet labels |
| `--accent` | `var(--orange-100)` | `#a21605` | brand red |
| `--accent-deep` | `var(--orange-200)` | `#7e0202` | gradient dark stop, pressed |
| `--accent-lift` | `var(--orange-300)` | `#c4361c` | gradient light stop, hover |
| `--accent-soft` | `rgba(229,51,30,.1)` | `rgba(162,22,5,.08)` | tinted hovers |
| `--on-accent` | `#fffbf8` | `#fffbf8` | label on the red; never flips |
| `--pos` / `--neg` | `--green` / `--red` | `#0b6e37` / `#b01309` | price up / down |
| `--veil`, `--veil-line`, `--veil-strong` | white alphas | ink alphas | glass |
| `--art-ink`, `--art-ink-2` | `#fffbf8`, `#9d9d9d` | not flipped | white inside dark artwork |
| `--btn-primary-hover-bg` / `-ink` | `--ink` / `--accent` | `--accent-deep` / `--on-accent` | primary button hover |

Notes on the light palette, from the comments in `tokens.css`:
- `--neg` moves in light because the light brand red `#a21605` is dark
  mode's `--red`; loss and brand must not be the same colour.
- `--ink-muted` in light is 4.63:1 on purpose. Dark's eyebrow grey
  (`#626262` on `#0f0e0d`, 3.16:1) fails AA at 16px and was left as designed.

Other tokens:

| Token | Value |
|---|---|
| `--spacing-xs/sm/md/lg` | 8 / 12 / 16 / 24px |
| `--page-pad` | `clamp(20px, 5vw, 96px)` |
| `--content-max` | 1440px (Figma content column). `.container--wide` sets 1800px and a 60px max gutter for the hero and About. |
| `--radius-pill` | 400px |
| `--btn-w`, `--btn-h` | 254px, 50px |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)`, for hovers and short state changes |
| `--heading-wrap`, `--body-wrap` | `balance`, `pretty`; applied in `global.css` as `text-wrap-style` so `nowrap` is untouched |

Bands also define **local tokens** (for example `--onb-grad-top` in
`BoxOnboard.css`) for colours that belong to one piece of artwork, and
override them in that file's light blocks.

## 2. Type scale (client approved)

Six sizes for the whole site. Every piece of page typography on both pages
reads one of these tokens; no component sets its own size for a role.

| Role | Token | Size | Face / weight | Line height |
|---|---|---|---|---|
| Display (h1: hero titles, About title) | `--display-size` | fluid, see below | Manrope 500 (`.display`) | 0.9 |
| Section heading | `--h2-size` | 32px, 28px at 720px and below | Manrope 500 | `--heading-leading` 1.2 |
| Card heading | `--h3-size` | 18px | Manrope 500 | `--h3-leading` 1.3 |
| Paragraph | `--body-size` | 18px at every width | Inter Tight 300 | `--body-leading` 1.2 |
| Label | `--label-size` | 16px | Galano Grotesque 500 (eyebrows), 600 (buttons, CTAs) | 1.2 |
| Small | `--small-size` | 14px | per call site | |

Display is `clamp(32px, 3.375cqw, 100px)` by default,
`clamp(52px, 5.2vw, 100px)` at 1180px and below, and
`clamp(28px, 8.7cqw, 52px)` at 720px and below. It is a `cqw` value, so it
resolves against the element's query container (`.hero__stage` on the landing
page, `.ab-col` on About), which keeps both pages' h1s the same size.

Where each role is used:
- **Label**: eyebrows (`.eyebrow`, uppercase, `letter-spacing: 0` per the
  client's spec), buttons (`.btn`), CTAs, the nav and MORE menu, tab labels,
  footer column headings and links.
- **Small**: footer legal line, the hero terms line, FAQ index numbers and
  chips, the comparison table's column heads.
- A card title shares the paragraph's 18px and is told apart by face and
  weight.

Font families (`tokens.css`):

| Token | Stack |
|---|---|
| `--font-display` | Manrope Variable (npm `@fontsource-variable/manrope`) |
| `--font-body` | Inter Tight Variable (npm `@fontsource-variable/inter-tight`) |
| `--font-label` | Galano Grotesque, then Avenir Next, Avenir, Futura, Segoe UI, Roboto, Liberation Sans, DejaVu Sans, system-ui. **Galano files are not in the repo**; see ASSETS.md. The fallback order is chosen for similar widths; Century Gothic is excluded on purpose (too wide). |
| `--font-wordmark` | Darker Grotesque Variable (the "Phorcast" wordmark) |
| `--font-mono` | Deprecated alias of `--font-label` (the label face used to be Geist Mono). If `grep -r font-mono src` finds only `tokens.css`, delete it. |

Numbers that animate use tabular figures: the selector list at the bottom of
`global.css` sets `font-variant-numeric: tabular-nums`. Add any new counter to
that list.

## 3. Light and dark theming

- **State** lives on `<html data-theme="light|dark">`.
- **First paint**: an inline script in `index.html` reads `localStorage`
  key `phorecast-theme`; if absent it follows `prefers-color-scheme`. It also
  points the two `<meta name="theme-color">` tags at the chosen theme.
- **Runtime**: `src/lib/theme.ts` owns the value. An explicit choice (the nav
  toggle, `setTheme`) is stored and outranks the system setting; with nothing
  stored the page follows system changes live.
- **Dark is the default**: `:root` holds dark values and `color-scheme: dark`.

**Why every light block is written twice.** A media query cannot be part of a
selector list, so "light because the system says so and nothing was chosen"
and "light because the user chose it" need two separate blocks:

```css
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) { /* light values */ }
}
:root[data-theme='light'] { /* the same light values */ }
```

In practice the second always applies, because the inline script resolves
`data-theme` before first paint; the first is the fallback for a page where
that script did not run. **The two blocks must stay identical.** The same
pattern appears in `tokens.css` and in most component CSS files
(`grep -rl "prefers-color-scheme: light" src`). When you change
one block, change its twin and diff them.

**Colours read by JavaScript.** Several motion modules read resting colours
with `getComputedStyle` or `tok()` when their timeline is built and hold them
for the life of the loop. That is why a theme change rebuilds every section
(`useThemeEpoch` in `useSectionMotion`, and in `HeroLogo`). Read colours inside
the build function, never at module scope.

`LIGHTMODE.md` at the project root is the full strategy behind all of this;
see [README.md](README.md) in this folder for when you need it.

## 4. The design-pixel unit (`--u`, `--c`, `--p`, `--f`)

Artwork and absolutely placed layouts are written in Figma's own pixel numbers.
A band (or card) declares itself a size container and defines one design pixel
as a fraction of its own width:

```css
.hero__stage { container-type: inline-size; }   /* the query container */
.hero__slide { --u: calc(100cqw / 1800); }       /* 1800 = design width */
.sl2__box    { top: calc(170 * var(--u)); }      /* "170px in Figma" */
```

- The unit tracks the element, not the viewport, so a card scales with its
  column.
- Names in use: `--u` (most bands), `--c` (Built cards, 640 wide), `--p`
  (Steps panel, 886 wide), `--f` (Fan).
- Capped forms stop artwork from growing past 1:1:
  `--u: min(1px, 100cqw / 474)` (bento cards),
  `--u: clamp(0.8px, 100vw / 1600, 1px)` (footer).
- Phone compositions redefine the unit against their own design width inside
  the phone media query (for example `calc(100cqw / 390)`).
- `cqw` resolves against the nearest ancestor with `container-type`. Adding a
  container between a unit and its elements changes what the unit means.

Breakpoints that recur: **720** (phone; also where `--h2-size` drops to 28),
**1180** (hero and About stack to one column), **960** (nav switches to the
phone sheet), **700** (Steps becomes a tablist), **767 / 1279** (HeroLogo
layouts).

## 5. The Icon mask primitive

`src/components/Icon.tsx`, `src/styles/icon.css`.

Most single-colour SVGs are painted as a CSS mask so their colour comes from
`color` (a token, inheritance, `:hover`, a GSAP tween on `color`) instead of
the hex Figma baked in:

```tsx
<Icon src={chevron} w={13.73} h={7.49} />          // Nav.tsx
// renders <span class="icon" aria-hidden="true" style="--icon: url(&quot;...&quot;); width: 13.73px; height: 7.49px">
// .icon { mask-image: var(--icon); mask-size: 100% 100%; background-color: currentColor; }
```

Rules:
- **Only for one flat colour on transparent.** A mask keeps the alpha and
  throws the colour away. Multi-colour files stay `<img>`: the About table's
  tick and cross, the live dot (`LiveDot.tsx` swaps two files by theme
  instead).
- `mask-size: 100% 100%` reproduces the `<img>` stretch the files were
  exported for (`preserveAspectRatio="none"`).
- The URL is quoted in `cssUrl()`. Unquoted, a small SVG inlined by Vite as a
  `data:` URI (which contains `;`) makes the declaration invalid, the custom
  property silently disappears, and the span paints as a solid box.
- `w`/`h` are written inline. To let CSS size the icon, pass
  `style={{ width: undefined, height: undefined }}` (the `cssBox` pattern in
  `Pillars.tsx` and `About.tsx`), or a `var()` as `Footer.tsx` does.

**The gotcha: never `clearProps: 'all'` on an `Icon`.** GSAP's
`clearProps: 'all'` removes the element's whole inline `style`, and that
includes the `--icon` custom property React wrote there. The mask becomes
`none`, `background-color: currentColor` fills the box, and the glyph turns
into a solid rectangle. It happened in `steps/panels/PanelRegister.tsx`: at
rest the bracket was a solid 80 x 183 red block and both card glyphs grey
blocks. Always clear by name (`clearProps: 'transform,opacity'`). The same
applies to any element whose inline style React writes (Built's market nodes
carry their positions inline, for example).

## 6. Illustration text sits outside the type scale

Text drawn inside artwork (bento card art, hero slide illustrations, Steps
panels, Built cards, Familiar's phone, Fan pills, the About product shot) is
part of a picture that scales as one piece. It is sized in the band's design
unit (`calc(N * var(--u))`) and is **not** on the six-size scale. Do not move it
onto the scale, and do not flag it as an inconsistency in reviews: the client's
type-scale sign-off explicitly left illustrations untouched.

Likewise `--art-ink` (white inside dark artwork) does not flip with the theme;
whether an illustration re-tints for light is decided in that section's CSS.

## 7. Other conventions

- **Buttons**: `.btn` plus `.btn--primary` (red fill), `.btn--ghost`,
  `.btn--outline`. Labels are wrapped in `<Roll>` for the rolling hover; the
  hosts that roll are listed in `global.css`.
- **Focus**: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }`.
- **Section seams**: `.glow-fade`, `.glow-fade--top`, `.glow-fade--bottom`
  mask a glow layer so it dissolves at the section edge instead of being cut by
  `overflow: hidden`.
- **Motion language**: see `MOTION.md` at the project root and the header of
  `src/lib/motion.ts`.
