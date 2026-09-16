# Phorecast — landing page

Vite + React 19 + TypeScript, built from the Phorecast Figma file
(`aczG8te17zRGoK5wvirB92`). No CSS framework: plain CSS with design tokens in
`src/styles/tokens.css`.

```
npm install
npm run dev        # http://localhost:5173, reloads on local edits
npm run dev:sync   # the same, and pulls new commits from the branch as they land
npm run build      # typecheck + production build -> dist/
npm run preview    # serve dist/
```

`dev:sync` is for reviewing work pushed from elsewhere: it polls the tracked
branch every 15s (`SYNC_SECONDS` to change that), fast-forwards, reinstalls when
the lockfile moves, and lets Vite hot-reload the page. It never touches a dirty
checkout, so your own uncommitted edits are safe.

Node 22 or newer.

## Sections

| Component | Figma node | What it is |
|---|---|---|
| `components/hero` | 244:1030, 313:12332, 280:4184, 289:5879 | Four-slide hero carousel |
| `components/bento` | 244:1325 | "Why Traders Move to Phorecast" bento grid |
| `components/fan` | 270:6297 | Decorative arc band with category pills |
| `components/steps` | 280:4547, 251:2055, 280:4816 | "Open an account in 3 simple steps" slider |
| `components/built` | 255:3449 | "Built for the Way You Trade" feature cards |
| `components/faq` | 297:140 | "Answers you can verify" accordion |
| `components/HeroLogo` | — | Animated 3D mark, used by the hero and the FAQ |
| `components/footer` | 302:140 | Footer with the cropped wordmark |

Nodes 255:2705 and 255:2862 are background-glow frames with no content; their
treatment lives in the hero and section glows rather than in a component.

## Conventions

- **Scaling.** Sections that place elements at exact Figma coordinates declare a
  unit custom property (`--u`, `--p`, `--c`, `--f`) equal to one design pixel at
  the current width, so `calc(330 * var(--u))` reads as "330px in the design".
  Containers use `container-type: inline-size` and `cqw` so the unit tracks the
  element rather than the viewport.
- **Glows.** Figma renders several glows through a WebGPU shader stack
  (halftone, lens distortion, Bayer dithering). Those are approximated with
  blurred radial gradients; the hero adds a dot pattern over the sun for grain.
- **Assets.** Every icon and illustration is the exported file from Figma, kept
  under `src/assets/`. Figma's asset URLs expire after about a week, so the
  committed copies are the source of truth.
- **Motion.** The hero autoplays every 7s and pauses on hover or focus; the
  steps slider advances every 6s and stops for good on hover, focus or click.
  Both respect `prefers-reduced-motion`.
- **The animated mark.** `components/HeroLogo` is a Three.js scene ported from
  the `claude/intelligent-sagan-5bxpqc` branch. It loads after the page is idle,
  probes for WebGL and falls back to `logo-outline.svg` when there is none. Five
  treatments exist in `variants.ts`; both placements use `lined`. `placement`
  overrides the breakpoint layout, which is how the same scene serves a full
  hero and the small FAQ rail. The hero instance stays mounted across the
  carousel and cross-fades, so its WebGL context is built once.
- **Section seams.** Glows are clipped by their section's `overflow: hidden`,
  which leaves a hard line where two sections meet. The `glow-fade` utility in
  `global.css` masks each glow layer so it dissolves into the next section.

## Review helpers

`?slide=1..4` opens the hero on a given slide and pauses autoplay.

```
node scripts/screenshot.mjs <url> <out.png> [w] [h] [fullPage]
node scripts/shot-el.mjs <url> <selector> <out.png> [w]
node scripts/shot-steps.mjs      # panels 2 and 3 of the steps slider
node scripts/shot-mobile.mjs     # 390px overflow report + section shots
node scripts/capture-all.mjs     # every section at 1920, for diffing against Figma
node scripts/probe.mjs           # measured geometry of the Familiar Trading band
node scripts/assets-probe.mjs    # rendered vs natural size of each exported asset
```

To check a section against its frame, capture it and stack the two images:

```
node scripts/capture-all.mjs
python3 -c "
from PIL import Image
a, b = Image.open('figma.png'), Image.open('/tmp/mine-bento.png')
W = 1500
r = lambda i: i.resize((W, round(i.height * W / i.width)), Image.LANCZOS)
a, b = r(a.convert('RGB')), r(b.convert('RGB'))
c = Image.new('RGB', (W, a.height + b.height + 16), (40, 40, 40))
c.paste(a, (0, 0)); c.paste(b, (0, a.height + 16)); c.save('cmp.png')"
```

## Deploying to Vercel

`vercel.json` sets the framework, output directory, SPA rewrite and long cache
headers for hashed assets. Import the repo at vercel.com/new and pick this
branch, or run `npx vercel` for a preview and `npx vercel --prod` to ship.
