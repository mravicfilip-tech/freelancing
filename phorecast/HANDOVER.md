# Phorcast website: developer handover

Start here. This page tells you what the site is, how to run it, what is
finished, what is open, and where to look. The detail is in [`docs/`](docs/README.md).

## What the site is

The marketing site for Phorcast, a prediction-market platform. It is a static
single-page app with two routes:

| Route | Content |
|---|---|
| `/` | Landing page: hero carousel (4 slides), Bento, Familiar, Pillars, Fan, Steps, Built, FAQ, footer |
| `/about` | About page: hero, Choose an event, About Phorcast, Cast your conviction, comparison table, primer cards, FAQ, footer |

Both pages carry the same FAQ and footer. Any other path renders the landing
page. The site has a dark theme (default) and a light theme; it follows the
system setting until the visitor picks one with the toggle in the nav.

- **Live:** https://phorcast-markets.vercel.app
- **Design:** Figma file `aczG8te17zRGoK5wvirB92` (node map in
  [docs/ASSETS.md](docs/ASSETS.md#3-figma))

## Tech stack

| | |
|---|---|
| Build | Vite 8, TypeScript 5.9 (strict) |
| UI | React 19, function components, no state library |
| Styling | Plain CSS per component, design tokens as custom properties in `src/styles/tokens.css`. No framework, no CSS-in-JS |
| Motion | GSAP 3.15 and ScrollTrigger |
| 3D | three.js 0.185, only for the animated logo (lazy-loaded, static SVG fallback) |
| Routing | Hand-rolled, `src/lib/router.ts` (two routes) |
| Fonts | Manrope, Inter Tight, Darker Grotesque from `@fontsource-variable`; Galano Grotesque self-hosted (files not yet supplied) |
| Tooling | ESLint (flat config), `playwright-core` for screenshot and pixel-diff scripts |
| Hosting | Vercel, static output, deployed with `scripts/deploy.sh` |
| Runtime | Node 22 or newer (`.nvmrc`) |

No backend, no API calls, no analytics, no environment variables.

## Quickstart (5 minutes)

```
nvm use                 # Node 22
npm ci
npm run dev             # http://localhost:5173
```

Then open `/` and `/about`, switch theme with the nav toggle, and try
`/?slide=3` (opens the hero on slide 3).

```
npm run check           # typecheck + lint + production build: run before every commit
npm run build           # typecheck + build to dist/
npm run preview         # serve dist/
```

Expected noise: eight build warnings and matching browser errors for the
missing Galano Grotesque files, and a Vite chunk-size warning. Neither is a
failure. See [docs/TESTING.md](docs/TESTING.md).

## State of the project

Both pages are built to the approved design in both themes, from 360px phones
to 1920px and wider, with entrance animations, ambient loops, reduced-motion
support and a WebGL fallback. The site is live. The last client feedback round
(13 items, below) is complete and deployed.

What remains is mostly **waiting on the client**: link targets, the licensed
label font, and answers on copy that contradicts itself. There is also a short
list of pre-existing layout nits and one contrast issue.

### Finished

- Landing page (eight bands) and About page (six bands), shared FAQ and footer.
- Light and dark themes, set before first paint, switchable live.
- Unified type scale, approved by the client (six sizes; see
  [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md#2-type-scale-client-approved)).
- Hero carousel: 7s autoplay, pause button, holds off screen and under keyboard focus.
- Footer sitemap in the client's order; MORE menu reduced to About; all four
  social links live.
- Placeholder-link system: every missing page is one string in `src/lib/cta.ts`
  or `src/lib/sitemap.ts`.
- Reduced-motion handling throughout; static logo when WebGL is missing or slow.
- Deploy script with an account guard and alias re-pointing.

### Open

| Item | Needs | Details |
|---|---|---|
| 20 placeholder links, plus Login, Sign Up and About "Get Started" | Client: target URLs | [CONTENT.md](docs/CONTENT.md#6-every-placeholder-link) |
| Galano Grotesque webfonts (8 files) | Client: licensed files | [ASSETS.md](docs/ASSETS.md#5-fonts) |
| Token slide vs FAQ 7 ("no date or details yet") | Client: answer | [KNOWN-ISSUES 1.1](docs/KNOWN-ISSUES.md#1-open-client-questions) |
| Product claims vs FAQ: KYC, withdrawal speed, onboarding time, custody | Client: answer | KNOWN-ISSUES 1.2 |
| Hero slides 2 and 4 and Steps step 3 artwork vs new headlines | Client and design | KNOWN-ISSUES 1.3 |
| Bonus countdown is static | Client: real end date | KNOWN-ISSUES 1.4 |
| Leftover "trade" wording (art labels, five FAQ lines, tab title) | Client: wording | KNOWN-ISSUES 1.5 |
| Which "bar" the early feedback meant | Client: confirm | KNOWN-ISSUES 1.6 |
| "Phorecast" spelling in the footer design | Client: confirm | KNOWN-ISSUES 1.7 |
| Six layout nits (phones, 768 to 1440, 720/721) | Developer | [KNOWN-ISSUES 2](docs/KNOWN-ISSUES.md#2-layout-nits-pre-existing) |
| White link on the orange bento card, about 2.5:1 | Design and developer | [KNOWN-ISSUES 3](docs/KNOWN-ISSUES.md#3-accessibility) |
| Lint findings in `src`, if `npm run lint` still reports any | Developer | [TESTING.md](docs/TESTING.md) |

## Where to look for what

| To... | Go to |
|---|---|
| Change copy | The band's `.tsx`; map in [docs/CONTENT.md](docs/CONTENT.md) |
| Point a button at a page | `src/lib/cta.ts` |
| Add or fill a footer / nav / MORE link | `src/lib/sitemap.ts` |
| Change a colour, size or font | `src/styles/tokens.css`; [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) |
| Fix something in light mode only | The file's two light blocks (keep them identical) |
| Change an entrance animation | `src/components/<band>/<Band>.motion.ts`; house rules in `MOTION.md` |
| Change an ambient loop | `<Band>.loop.ts`, `built/loops/`, `bento/motion/`, `hero/slides/*.motion.ts` |
| Change the hero carousel | `src/components/hero/Hero.tsx`, `Position.tsx` |
| Change the 3D logo | `src/components/HeroLogo/` (`config.ts` for tuning) |
| Replace artwork or find a Figma node | `src/assets/<band>/`; [docs/ASSETS.md](docs/ASSETS.md) |
| Deploy | [docs/DEPLOY.md](docs/DEPLOY.md) |
| Check nothing changed visually | `scripts/pixel-diff.mjs`; [docs/TESTING.md](docs/TESTING.md) |

Full index with summaries of `MOTION.md` and `LIGHTMODE.md`:
[docs/README.md](docs/README.md).

## First-day checklist

- [ ] Node 22, `npm ci`, `npm run dev`. Load `/` and `/about` in both themes.
- [ ] Run `npm run check` and note the baseline (warnings above are expected).
- [ ] Turn on reduced motion (DevTools, Rendering) and reload: everything
      visible, carousel still, no pause button.
- [ ] Read [ARCHITECTURE.md](docs/ARCHITECTURE.md) sections 5 and 8 (entrance
      gating, hero carousel) before editing any animation.
- [ ] Read the `Icon` gotcha in
      [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md#5-the-icon-mask-primitive).
- [ ] Read [KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) in full.
- [ ] Install a Chromium for `playwright-core` (`npx playwright-core install chromium`)
      and take one screenshot with `scripts/screenshot.mjs`.
- [ ] Set up deployment to your own Vercel project as in
      [DEPLOY.md](docs/DEPLOY.md#3-deploying-from-your-own-vercel-account),
      without removing the account check.
- [ ] Collect from the client: Galano Grotesque files, link targets, and
      answers to the open questions.

## Client feedback history

The last round of feedback, condensed. "Project lead" marks items raised
internally rather than by the client. All items are live.

| # | Feedback | From | Outcome |
|---|---|---|---|
| 1 | Banner should rotate automatically | Client | Hover no longer pauses the hero (it had stopped it entirely under a resting cursor). Play/pause button added. |
| 2 | Remove the bar that is too big and touches other boxes | Client | Market-snapshot row (AAPL, TSLA, BTC cards) under the pager removed. **Open**: the annotation may point at the pager line instead; confirm. |
| 3 | About, "How Trading Prediction Markets Work?" card: paragraph should start at the top | Client | Body now starts 11px under the card title (was 68px). |
| 4 | Social icons: X, TikTok, Discord, Telegram | Client | All four linked. |
| 5 | Update homepage copy from the client's text document | Client | 79 strings checked, zero mismatches. Hero titles scaled to clear the artwork at every width. **Open**: questions raised by the new copy, see KNOWN-ISSUES 1.1 to 1.5. |
| 6 | Font sizes, weights and spacing inconsistent on both pages | Client | Resolved by #12. |
| 7 | Remove Contacts; new strapline under the footer logo | Client | Done. |
| 8 | Organise the sitemap | Client | Footer shows the client's list only, four per column; eight extra pages removed; empty links where no page exists yet. |
| 9 | All paragraph text the same size and font, 14 or 16px | Client | Superseded by #12: 18px everywhere, both pages. |
| 10 | Remove em dashes from sentences | Client | Ten fixed; none left in the copy. |
| 11 | No bold sentences on About | Project lead | Done. |
| 12 | Unify font sizes: paragraphs 18px, one size per heading level, both pages, illustrations untouched | Project lead | Paragraph 18, card heading 18, section heading 32 (28 on phones), label 16 (menus included), small 14. Checked in both themes. The FAQ title at 1920 and the About statement stay at the section-heading size by decision. |
| 13 | MORE menu too big: About only | Project lead | Desktop and phone. Footer keeps the full sitemap. No drop shadow, pure white panel in light. |
