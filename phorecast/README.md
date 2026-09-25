# Phorcast website

Marketing site for Phorcast: a landing page (`/`), an About page (`/about`),
both ending in the same FAQ and footer, and a blog (`/blog`, `/blog/<slug>`). Vite 8, React 19 and TypeScript, plain
CSS with design tokens, GSAP for motion and three.js for the animated logo.
Built from the Figma file `aczG8te17zRGoK5wvirB92`.

Live at https://phorcast-markets.vercel.app.

**New to the project? Read [HANDOVER.md](HANDOVER.md) first.**

## Quickstart

Node 22 or newer (`.nvmrc`).

```
npm ci
npm run dev        # http://localhost:5173
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run dev:sync` | The same, and fast-forwards from the tracked remote branch every 15s (`SYNC_SECONDS`); leaves a dirty checkout alone |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src`, `scripts` and the config files |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run check` | Typecheck, lint and build: run before committing |
| `npm run preview` | Serve `dist/` |
| `node scripts/screenshot.mjs` | Screenshot a page, the full page or one element, in either theme |
| `node scripts/pixel-diff.mjs` | Section-by-section visual diff of two running builds |
| `./scripts/deploy.sh` | Deploy to Vercel production with the account check and alias re-point |

Review URL: `/?slide=N` (1 to 4) opens the hero on that slide.

## Folder map

```
index.html              entry; inline script sets the theme before first paint
vercel.json             build settings, SPA rewrite, asset cache headers
eslint.config.js        lint config
scripts/                deploy, dev-sync, screenshot, pixel-diff
public/favicon.svg
src/
  main.tsx              bootstraps fonts, theme, global CSS, <App/>
  App.tsx               the pages and their section order
  lib/
    router.ts           the client router (/, /about, /blog, /blog/<slug>)
    motion.ts           useSectionMotion (scroll-gated entrances) and helpers
    theme.ts            light/dark store, useTheme, useThemeEpoch
    cta.ts              where every landing-page button points
    sitemap.ts          footer columns, MORE menu, social URLs
  styles/
    tokens.css          colours, type scale, spacing: the single source
    global.css          reset, utilities, buttons, hover roll
    fonts.css           Galano Grotesque @font-face (files pending)
    icon.css            the .icon mask class
  components/
    Nav, Logo, Icon, LiveDot, Roll, ThemeToggle     shared pieces
    HeroLogo/           three.js mark with static fallback
    hero/               carousel, pager, slides/ (one illustration per slide)
    bento/              four cards (boxes/) and their lazy motion (motion/)
    familiar/  pillars/  fan/  steps/  built/       landing bands
    faq/  footer/       on both pages
    about/              the About page, one CSS and motion file per band
    blog/               the blog index and post pages
  content/
    blog.ts             the blog's posts, as data
  assets/<band>/        exported artwork, one folder per band
docs/                   developer documentation (below)
MOTION.md               motion direction: the rules entrances and loops follow
LIGHTMODE.md            light-mode reference: theming model, tokens, section decisions
```

A band is usually `X.tsx` (markup and copy), `X.css` (layout, colour, light
blocks), `X.motion.ts` (entrance) and sometimes `X.loop.ts` (ambient loop).

## Documentation

| | |
|---|---|
| [HANDOVER.md](HANDOVER.md) | Start here: state, open items, first-day checklist, feedback history |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Shell, routing, sections, motion gating, 3D logo, carousel |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, type scale, theming, design-pixel unit, `Icon` |
| [docs/CONTENT.md](docs/CONTENT.md) | Where copy and links live; every placeholder link |
| [docs/ASSETS.md](docs/ASSETS.md) | Asset folders, Figma node map, export rules, fonts |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel, `deploy.sh`, moving to your own account |
| [docs/TESTING.md](docs/TESTING.md) | Checks, pixel diff, Playwright notes, manual pass |
| [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) | Open questions, layout nits, gotchas |
| [docs/README.md](docs/README.md) | Index, with summaries of `MOTION.md` and `LIGHTMODE.md` |
