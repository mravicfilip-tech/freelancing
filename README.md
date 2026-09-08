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
