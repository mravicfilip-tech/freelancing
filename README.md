# Remittix — landing page hero

Vite + React 19 + TypeScript. The hero carries a WebGL dot-matrix planet
(`three` + `gsap`/ScrollTrigger) rendered on a transparent canvas over the
page's `#EDEFF1` dot grid.

```
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + production build → dist/
npm run preview        # serve dist/
```

## Deploy to Vercel

The repo is a plain Vite site, so Vercel needs no configuration beyond the
included `vercel.json` (framework `vite`, output `dist/`, SPA rewrite, long
cache on hashed assets). Either:

- Import the GitHub repo at vercel.com/new, pick this branch, and deploy. Every
  push then gets a preview URL and the production branch gets the main URL.
- Or from a terminal: `npx vercel` (preview) and `npx vercel --prod`.

Node 22 or newer is required (set in `package.json` engines; Vercel's default).

## Globe switcher

The hero ships with three globe treatments and a switcher pinned to the bottom
of the page: Halftone, Matte and Continents. The choice is written to
`?globe=halftone|matte|continents` on the URL, so a link carries it, and to
localStorage, so it sticks for a returning viewer. Presets live in
`src/components/HeroPlanet/variants.ts` under `GLOBES` and `VARIANTS`. To ship
without the switcher, remove `<PlanetSwitcher />` from `src/App.tsx` and set the
default in `config.ts`.

## Hero planet

```
src/components/HeroPlanet/
  index.tsx          mounts the canvas, lazy-loads the scene, reduced-motion / WebGL / breakpoint guards
  PlanetScene.ts     Three.js class: build → layout → start/stop → dispose
  config.ts          every tunable number, with comments
  landMask.ts        procedural equirectangular land/sea mask (simplex + domain warp)
  noise.ts           seeded 3D simplex noise
  CaptureStage.tsx   transparent stage used to export the static fallback
  HeroPlanet.css     canvas placement per breakpoint, fallback image placement
  shaders/
    dots.vert/frag   Fibonacci-sphere points, silhouette fade, entrance stagger
    ring.vert/frag   orbit tubes, faded on the half behind the sphere
    billboard.vert   camera-facing quad (glow plane, node halos)
    glow.frag        dithered radial bloom
```

Tune the look in `config.ts` — point counts, rotation period, ring radii /
inclinations / azimuths / rolls, node periods and colours, glow opacity,
parallax strength, layout fractions. Nothing in the shaders needs editing.

### Behaviour

- Canvas is `position:absolute; inset:0 0 0 45%; pointer-events:none; z-index:0`, `aria-hidden`.
- Entrance timeline runs once after `document.fonts.ready`: glow → sphere scale + dot stagger → rings draw in → nodes.
- Pointer parallax moves the camera (not the planet), listening on the hero, disabled on touch.
- ScrollTrigger drifts the planet down-right by 8% and fades the canvas to 0 as the hero scrolls out.
- The loop pauses when the hero leaves the viewport (`IntersectionObserver`) and on `visibilitychange`.
- Resize goes through a debounced `ResizeObserver` on the hero.
- `prefers-reduced-motion: reduce` → one static frame, no loop / parallax / drift.
- No WebGL → `public/hero-planet-fallback.png` in the same position.
- `< 768px` → the planet moves below the copy at 320px tall, 50% opacity, 6 000 points.
- `dispose()` releases geometries, materials, render lists, the renderer, listeners, observers, tweens and the ScrollTrigger.

### Scripts (need `dist/` — run `npm run build` first)

```
npm run fallback       # re-export public/hero-planet-fallback.png (then rebuild to bundle it)
npm run screenshots    # screenshots/hero-{1920x1080,1440x900,390x844}.png
npm run verify:leak    # mount/unmount the hero 5× and report renderer.info after each dispose
node scripts/verify.mjs  # reduced-motion, no-WebGL, tablet, mobile and scroll checks + screenshots
```

Debug switches on the URL: `?devtools` exposes `window.__heroPlanet` and a
mount/unmount button; `?planet=off` renders the hero without the WebGL layer;
`?planet=static` forces the reduced-motion frame; `?capture=planet` shows the
transparent capture stage; `?hero=1|2|3` previews the three hero layouts from
`DESIGN.md`; `?variant=<name>` previews any preset in `variants.ts`.

### Performance notes

`node scripts/profile-init.mjs` prints the duration of each scene-init phase
(`context`, `mask`, `dots`, `rings`, `compile`, `firstFrame`) over several page
loads. Init is spread across idle callbacks so each phase is its own task;
in headless Chromium here every phase measured 10–60 ms.

Lighthouse in this container runs on SwiftShader (software GL), so shader
compilation and every frame's rasterisation land on the main thread and are
counted as blocking time. Measured desktop scores, three to six runs each:

| build                     | fresh Chrome | pre-warmed Chrome |
|---------------------------|--------------|-------------------|
| `?planet=off` (baseline)  | 100          | 100               |
| with planet               | 76–78        | 87–95             |

The fresh-Chrome gap is a single ~550 ms task: the software GPU process
cold-starting on the first WebGL context. A real browser pays that at
launch, not on page load, and a GPU takes the raster work off the main
thread. Re-check the ≤3-point budget on real hardware with
`npm run build && npm run preview` and `npx lighthouse http://localhost:4173 --preset=desktop`.

## Presale dashboard

`/dashboard` (or `?view=dashboard` on any path) renders the presale dashboard.
It is a separate surface from the landing hero and shares only the brand tokens.

```
src/dashboard/
  Dashboard.tsx      page composition
  Sidebar.tsx        7 links in 2 groups, extended and collapsed
  Topbar.tsx         greeting, stage pill, theme toggle
  store.ts           URL + localStorage state, as heroVariant.ts does it
  theme.ts           the `theme` and `rail` stores
  data.ts            presale figures, token rates, live orders, formatters
  icons.tsx          nav, payment and rank marks, all inline SVG
  dashboard.css      both themes as one token layer
  Figure.tsx         the headline number, with the currency symbol set small
  panels/            StatRow, LevelCard, BuyPanel, StageLadder, FlashSale,
                     Referrals, LiveOrders
```

### Form language

Cards float on the ground rather than being fenced by hairlines: separation
comes from the ground colour plus a soft lift in light, and from a raised
surface in dark. One radius family throughout — 22px cards, 15px insets, pills
for anything interactive. Numerals carry each card, set tabular at -0.045em with
the currency symbol small and raised, so figures line up column to column.

Ink is the selected state in light and lime in dark: the active nav item, the
chosen tab and a hovered ghost button all take the same solid pill. Labels are
sentence case — no tracked-out capitals, and no meta strings strung together
with middle dots.

### Numbers

Two tiers, and nothing between them.

`.fig` is the one figure a card exists to show — the balance, the stage price,
referral earnings. Display face, and the unit set small and muted after the
number rather than as a symbol in front of it, so `1,284.50 USDT` reads the
same wherever it appears.

`.num` is every other readout: the ladder facts, the referrals split, every
numeric cell in the live table. 14px, 600, tabular, `-0.02em`, with the unit
inline at the same size and colour. Add the class rather than restating those
five properties, which is how four different treatments crept in before.

The one exception is `.ladder__n`, the price under each stage bar. It is an
axis label twelve across and cannot be 14px.

### The display face

`NewBlack Typeface` is the design's display face and is a licensed retail font,
so it is not in the repo. `public/fonts/README.md` says where to drop it and how
to convert an `.otf`. Until it lands, `--d-display` falls back to Onest and
nothing breaks — no failed request, since an unused `@font-face` is never
fetched.

### Themes

Dark is the home key and matches the site's `section--dark` treatment: ink
`#111214`, lime `#D9F24E` carrying the accent. Light is the rest of the site:
`#EDEFF1` with the dot grid, white cards, `#C4C8CD` hairlines and indigo
`#4B4BF7` on the actions — lime fails contrast on a light ground, so it is kept
to the live dot. Both palettes live in one token block at the top of
`dashboard.css`; nothing below it hard-codes a colour.

The choice is written to `?theme=dark|light` and to localStorage, as the globe
switcher does, and stamped on `<html data-dash-theme>` so `<body>` carries the
right ground on a short page.

### Navigation

`?rail=extended|collapsed`, persisted the same way. Extended is icon + label in
a row; collapsed is the narrow rail with the icon centred over its label, the
active item in an accent chip. Under 900px the rail is icon-only regardless.

### The stage ladder

A presale's one distinguishing mechanic is that the price ratchets up a cent per
stage, and a flat progress bar throws that away. `StageLadder` draws the stages
either side of the live one as a staircase priced left to right: spent stages
are solid and recede, the live stage fills to how much of it has sold, and the
stages ahead are outlines, because their price is a promise rather than a fact.
It is the one place the design raises its voice; everything around it stays
quiet.

### Figures

Everything in `data.ts` is placeholder presale data. The Buy panel prices a real
contribution from it — token rates, the stage price and the `LAUNCH450` promo
bonus — so swapping in an API means replacing that module, not the components.

```
node scripts/shot-dashboard.mjs   # screenshots both themes and rail states
```
