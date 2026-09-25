# Testing and verification

There is no unit or end-to-end test suite. Changes are verified with the
static checks below, a visual-regression script, and a manual pass in a
browser.

## 1. Static checks

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit`, strict mode, `noUnusedLocals`, `noUnusedParameters` (`tsconfig.json`) |
| `npm run lint` | ESLint flat config (`eslint.config.js`): `@eslint/js` and `typescript-eslint` recommended, `react-hooks` recommended-latest, `react-refresh`. Covers `src`, `scripts` and the config files |
| `npm run build` | Typecheck, then `vite build` into `dist/` |
| `npm run check` | Typecheck, lint and `vite build` in one go. Run it before every commit and deploy |

At handover `npm run check` passes and `npm run lint` reports 0 errors and
0 warnings. Keep it that way: a lint warning is cheaper to fix the day it
appears.

Expected output that is not a failure:
- Eight `didn't resolve at build time` warnings for the Galano Grotesque files
  (see ASSETS.md section 5).
- Vite's "Some chunks are larger than 500 kB" warning for the main bundle
  (about 804 KB, 264 KB gzipped).

## 2. Visual regression: `scripts/pixel-diff.mjs`

Compares two running builds section by section and exits 0 with
`PIXEL-IDENTICAL` when nothing a person could see has changed. Use it to prove
that a refactor, a comment pass or a dependency bump changed nothing on screen.

```
node scripts/pixel-diff.mjs <url-a> <url-b> [dark|light] [width]
```

Typical run, baseline commit against your working tree:

```
git worktree add ../base <commit>
cp -a node_modules ../base/                # copy, do not symlink (see below)
(cd ../base && npm run build && npx vite preview --port 4900) &
npm run build && npx vite preview --port 4901 &
node scripts/pixel-diff.mjs http://localhost:4900 http://localhost:4901
node scripts/pixel-diff.mjs http://localhost:4900/about http://localhost:4901/about light
```

It runs with reduced motion (so the settled design is captured), device scale
factor 1, a fixed scroll sequence, and WebGL off (so the hero mark is the
static fallback). Same URL against itself is byte-identical, so any non-zero
result is a real difference. `>24` counts pixels differing by more than 24/255
on a channel; a few dozen on glyph edges is representation noise, anything with
an area is a regression. Check both themes and at least 1600 and 390 wide.

**Copy `node_modules` into a worktree, do not symlink it.** Vite follows a
symlink to its real path in the other checkout, and the two trees then share
one dependency pre-bundle cache (`node_modules/.vite`), so one tree's build can
serve the other's modules and the comparison is no longer between two builds.

## 3. Screenshots: `scripts/screenshot.mjs`

```
node scripts/screenshot.mjs [url] [out.png] [--width=1920] [--height=1080]
                            [--theme=dark|light] [--full] [--el=<selector>] [--still]
```

Needs a running server (`npm run dev`, or `npm run build && npm run preview`).
`--still` emulates reduced motion so the settled design is captured; use it
with `--full`, otherwise sections below the fold are still in their hidden
pending state (see below).

## 4. Playwright notes

The scripts use `playwright-core` (a dev dependency), which ships no browser of
its own. Both scripts launch `process.env.CHROMIUM_PATH` if it is set, and
otherwise the Chromium that `npx playwright-core install chromium` downloads
(run it once).

- **WebGL.** Headless Chromium on a machine without a GPU needs
  `--use-gl=swiftshader` to draw the 3D mark. `screenshot.mjs` launches with
  `--no-sandbox` only, so add the flag to its `args` if the mark comes out as
  the static fallback. Do not pass `--disable-webgl` unless you want that
  fallback (`pixel-diff.mjs` passes it on purpose, for determinism).
- **`data-motion="pending"` means scroll first.** Each band hides its animated
  parts until it has scrolled into view and its entrance has run. A
  full-page screenshot taken straight after load shows empty bands below the
  fold. Either emulate reduced motion (`reducedMotion: 'reduce'` in the page
  options; everything is revealed at once), or scroll each section into view
  and wait for `[data-motion-done="1"]` on it before shooting.
- **The 3D mark builds late.** It waits for the hero's `motion:ready` beat and
  an idle callback. `.heroLogo[data-mode]` reads `pending`, `webgl` or
  `fallback`; wait for it to leave `pending`.
- **The hero autoplays.** Open `/?slide=N` for a given slide, and press the
  pause control (`.hero__play`) if it must hold still.
- **Fonts.** Wait for `document.fonts.ready`. Without the Galano files,
  labels render in the fallback stack; on Linux that is Liberation Sans or
  DejaVu Sans, which is what measurements in this repo were taken on.
- **Theme.** Set `colorScheme: 'light' | 'dark'` in the page options, or put
  `phorecast-theme` in `localStorage` before load.

## 5. Manual pass

Before handing a change back:

- Widths: 360, 390, 720 and 721, 1180 and 1181, 1440, 1920. The hero changes
  layout at 720/721 and 1180/1181, the nav at 960, Steps at 700.
- Both themes, switching live with the nav toggle after the page has settled
  (every section rebuilds; loops must come back in the new colours).
- Reduced motion on (DevTools, Rendering panel): everything visible, the hero
  does not rotate and has no pause control, Steps does not advance.
- `/about`, including a direct load of `/about` and Back/Forward between pages.
- `/blog`: the category filters, a card through to its post, "On this page"
  links, the breadcrumb, a direct load of a post URL, an unknown slug
  (`/blog/nope` shows "Post not found"), and that every page change lands at
  the top.
- Keyboard: Tab through the nav, MORE menu (arrows, Escape), phone sheet,
  hero pager and play control, Steps tabs, FAQ accordion.
- WebGL off (`chrome://flags` or `--disable-webgl`): the static mark appears
  in the hero and the FAQ.
- If you touched the About conviction band, jump into the middle of it
  (reload scrolled halfway, and use Back from another page) and check the fill
  still runs.
