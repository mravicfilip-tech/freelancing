# Assets, Figma and fonts

## 1. Where assets live

Everything is under `src/assets/`, one folder per band, and is imported by the
component that uses it. `public/` holds only `favicon.svg`.

| Folder | Used by |
|---|---|
| `about/` | About page: three card screenshots, product shot, venue logos, table tick and cross |
| `bento/` (+ `bonus/`, `custody/`, `markets/`, `onboard/`) | Bento grid and its four cards |
| `brand/mark.svg` | The Phorcast mark: `Logo.tsx`, About page |
| `built/` | Built band cards |
| `familiar/` | Familiar band (phone mock-up, cards) |
| `fan/` | Fan band arcs (`fan-upper.svg`, `fan-lower.svg`), pill icons, centre tile |
| `faq/seal.svg` | FAQ verify chip |
| `footer/social/` | X, TikTok, Discord, Telegram glyphs (simple-icons, CC0) |
| `hero/slide2/`, `slide3/`, `slide4/` | Hero slide illustrations |
| `icons/` | Nav chevron, live dot (dark and light) |
| `pillars/` | Pillars band |
| `steps/` | Steps panels |
| `fonts/galano-grotesque/` | Only a README. See section 5. |

The 3D mark's fallback image is `src/components/HeroLogo/logo-outline.svg`,
next to the component rather than in `src/assets/`.

## 2. How assets are used

| Pattern | When | Example |
|---|---|---|
| `import url from './x.svg'` then `<img src={url} alt="">` | Multi-colour artwork, rasters, anything whose own colours must survive | `about/tick.svg`, `about/product-shot.png` |
| `import url from './x.svg'` then `<Icon src={url} w h />` | One flat colour on transparent; the colour comes from CSS `color` | `brand/mark.svg`, `footer/social/*.svg`, most glyphs. See DESIGN-SYSTEM.md section 5 |
| `import markup from './x.svg?raw'` then inlined | The SVG's inner parts are animated or restyled | `fan/fan-upper.svg`, `fan/fan-lower.svg`, `hero/slide3/stacks.svg`, `steps/s3-chart.svg` |
| `*-light.svg` twin, picked with `useTheme()` | Artwork that needs a different drawing in light mode and cannot be a mask | `hero/slide2/connector-left-light.svg`, `icons/live-dot-light.svg` |

Notes:
- Vite inlines small files as `data:` URIs (its default `assetsInlineLimit`,
  4 KB) and fingerprints the rest into `dist/assets/`, which `vercel.json`
  serves with a one-year immutable cache.
- Inlined `?raw` SVGs have their `id`s prefixed per instance (`Fan.tsx`,
  `PanelTrade.tsx`) so two copies on one page cannot collide.
- Large rasters below the fold use `loading="lazy"` and `decoding="async"`
  (About page).

## 3. Figma

File key: **`aczG8te17zRGoK5wvirB92`**
(`https://www.figma.com/design/aczG8te17zRGoK5wvirB92`).

Node ids cited in source comments, by section. Where a band has a phone
composition, both nodes are listed. Bands with no id in source (Pillars, Fan,
FAQ, Footer, landing hero ground) are described in their CSS header by frame
size only; the footer was rebuilt from a client-supplied screenshot, not a
Figma node.

| Section | Node(s) | Cited in |
|---|---|---|
| Hero slide 2 illustration | slide `365:293`, cluster `365:346` ("Stats Container"), connectors `365:294` / `365:295`, event cards `526:1658` / `526:1680`, action bar `538:4465` | `hero/slides/SlideAccount.{tsx,css}` |
| Hero slide 3 illustration and countdown | frame `464:284`, illustration `464:309`, countdown `474:857` | `hero/slides/SlideBonus.{tsx,css}` |
| Hero slide 4 illustration | frame `365:762`, group `365:803`, 3D-mark slot `390:3609` | `hero/slides/SlideFuture.{tsx,css}`, `hero/Hero.tsx` |
| Bento band ground | frame `365:857`, background `365:858`, circle group `487:1729` | `bento/Bento.css` |
| Bento A, onboarding | desktop `365:866`, phone `526:184` | `bento/boxes/BoxOnboard.*` |
| Bento B, funds | desktop `365:925`, phone `526:305` | `bento/boxes/BoxCustody.*`, `bento/motion/funds.ts` |
| Bento C, bonus | desktop `365:988`, phone `526:261` | `bento/boxes/BoxBonus.*`, `bento/motion/bonus.ts` |
| Bento D, markets | desktop `365:1063`, phone `526:394` | `bento/boxes/BoxMarkets.*`, `bento/motion/markets.ts` |
| Familiar | section `538:4601`, device cards `365:1807` + `474:913` | `familiar/*` |
| Steps panel 1, register | `365:1668` | `steps/panels/PanelRegister.css` |
| Steps panel 2, fund | `365:1345` | `steps/panels/PanelFund.*` |
| Steps panel 3, chart | `365:1476` (chart parts `365:1532` to `365:1575`) | `steps/panels/PanelTrade.*` |
| Built, phone cards | card one `526:2503`, card two `526:2656` | `built/*` |
| About page | frame `531:148` (1920 x 3660) | `about/About.tsx`, `about/About.css` |
| About ground | `531:149` background container, `531:151` circle group | `about/About.tsx` |
| About cards | `531:190`, `531:199`, `531:208` | `about/About.tsx` |
| About brand card | field `531:234`, product-shot layers `531:238` to `531:240`, mark `531:231` | `about/About.tsx`, `About.brand.motion.ts` |
| About conviction arcs | `531:158` | `about/About.tsx`, `about/About.css` |
| About table mark | `531:277` | `about/About.tsx` |

For any element not listed, search the component and its CSS for a
`\d{3}:\d+` pattern; most geometry comments name the node they measure.

Figma effects that are WebGPU shaders (halftone, lens distortion, dither on the
glows) have no CSS equivalent and are approximated with blurred gradients. The
About page comments say exactly what was left out.

## 4. Export conventions

- **Export from the node, commit the file.** Figma's asset URLs expire, so the
  committed copies in `src/assets/` are the source of truth.
- **SVG where possible**, PNG or JPG for photographs and effects SVG cannot
  carry. The About rasters are node exports at 1.5x, already clipped to the
  card.
- **Keep Figma's `preserveAspectRatio="none"`** on glyph SVGs; `Icon` relies
  on the file stretching to its box.
- **Single-colour glyphs**: any baked colour is ignored once the file is used
  through `<Icon>`, so it need not match a token. Multi-colour files keep
  their colours and need a `-light` twin if they must change in light mode.
- **Naming**: lower-case kebab-case, in the folder of the band that uses it
  (`hero/slide3/gift-1.svg`). Light variants end in `-light`.
- **Editor settings**: `.editorconfig` leaves SVG line endings and final
  newlines alone so an editor does not rewrite exported files on save.
- **No unreferenced files.** Every file in `src/assets/` is imported
  somewhere (unused ones were removed for handover). Delete a file when its
  last import goes, and check `grep -rn "<name>" src` before adding one that
  may already exist.

## 5. Fonts

| Face | Role | Source |
|---|---|---|
| Manrope Variable | display and headings | npm `@fontsource-variable/manrope`, imported in `src/main.tsx` |
| Inter Tight Variable | paragraphs (300) | npm `@fontsource-variable/inter-tight` |
| Darker Grotesque Variable | the "Phorcast" wordmark | npm `@fontsource-variable/darker-grotesque` |
| **Galano Grotesque** | labels: eyebrows, buttons, nav, tabs, footer links | **self-hosted, files missing** |

**The Galano Grotesque files are not in the repository.** It is a commercial
face from The Northern Block and has to come from the client's licence (not
Google Fonts, not npm, not a font mirror). `src/assets/fonts/galano-grotesque/`
holds only a README. Until the files arrive:

- `src/styles/fonts.css` declares four `@font-face` rules whose URLs do not
  resolve. `vite build` still exits 0 and prints eight "didn't resolve at build
  time" warnings. The browser's requests for them fail (a 404, or on a host
  with a catch-all rewrite, an HTML response the browser refuses to decode).
- `font-display: swap`, so the fallback stack in `--font-label`
  (`tokens.css`) renders immediately: Avenir Next or Avenir on Apple devices,
  Segoe UI on Windows, Roboto on Android, Liberation Sans or DejaVu Sans on
  Linux.

To finish, ask the client for these eight files and drop them in
`src/assets/fonts/galano-grotesque/` with exactly these names. No code or
config change is needed; Vite picks them up on the next build.

| Weight | Used for | Files |
|---|---|---|
| 200 ExtraLight | the bento ring dial number | `GalanoGrotesque-ExtraLight.woff2`, `.woff` |
| 400 Regular | Steps panel micro-copy | `GalanoGrotesque-Regular.woff2`, `.woff` |
| 500 Medium | eyebrows and most labels (the client's spec) | `GalanoGrotesque-Medium.woff2`, `.woff` |
| 600 SemiBold | buttons and CTAs | `GalanoGrotesque-SemiBold.woff2`, `.woff` |

If the licence provides a variable font instead, replace the four rules with
one `@font-face` using `font-weight: 200 600` and
`GalanoGrotesque-Variable.woff2`; the token does not change.

After the files land, re-check label widths at 360 and 390 (several labels are
`nowrap` and were measured on the fallback) and confirm `tabular-nums` works on
the countdown and counters (`global.css`).
