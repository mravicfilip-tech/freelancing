# Remittix presale dashboard — developer handover

Everything under `src/dashboard/` is the presale dashboard. The rest of `src/`
is the marketing landing page (see `README.md` and `DESIGN.md`), which shares
the build but not the code.

## Run, build, deploy

```
npm install
npm run dev           # http://localhost:5173  (add /dashboard, /earn, …)
npm run dev:live      # dev server that pulls the branch every 8s
npm run build         # tsc --noEmit && vite build → dist/
npm run preview       # serve dist/ on :4173
VERCEL_TOKEN=… bash scripts/deploy.sh   # vercel --prod, then alias rtxdash.vercel.app
```

Node 22+. Vercel needs nothing beyond `vercel.json` (SPA rewrite, hashed
assets cached for a year). Production is https://rtxdash.vercel.app; on that
host the root path is the dashboard.

Every page is code-split with `React.lazy` in `src/App.tsx`, so the dashboard
never downloads the landing page's three.js, and the sign-in page is the only
dashboard route that does (its WebGL panel). GSAP loads with Mystery box and
Claim only.

## Routes (`src/App.tsx`)

Routing is by pathname (no router library). `?view=<name>` works as an alias
for previews. `?theme=dark|light` forces a theme.

| Path | Component | Notes |
|---|---|---|
| `/dashboard` (or `/` on rtxdash.vercel.app) | `Dashboard.tsx` | Presale home: stats, buy, stage ladder, flash sale, referrals, live orders |
| `/auth`, `/login`, `/register` | `auth/AuthPage.tsx` | Demo account is prefilled (`auth/session.ts`) |
| `/earn` | `earn/EarnPage.tsx` | Coming soon: plan simulator, notify-at-launch email |
| `/markets` | `markets/MarketsGate.tsx` | Gateway to remittixmarkets.io with a ticking terminal |
| `/transactions` | `markets/MarketsPage.tsx` | The wallet's purchase history ("My transactions") |
| `/payfi` | `payfi/PayFiPage.tsx` | Transfer calculator that ends in the beta request |
| `/referrals` | `referrals/ReferralsPage.tsx` | Totals, link, payout wallet, activity |
| `/updates` | `updates/UpdatesPage.tsx` | Feature banner and the list |
| `/updates/:id` | `updates/ArticlePage.tsx` | One update; unknown id shows an empty state |
| `/mystery` | `mystery/MysteryPage.tsx` | Box opener with the canvas effects |
| `/claim` | `claim/ClaimPage.tsx` | Three-step whitelist wizard |
| `/settings`, `/profile` | `settings/SettingsPage.tsx` | Profile, password, 2FA, receiving wallet |

Navigation lives in `Sidebar.tsx` (desktop rail; `ROUTE` and `META` are the
single source for labels, routes and badges), `MobileNav.tsx` (phone pill bar
and the More panel), and `Topbar.tsx` (title, live pill, theme, log out, and
the phone brand bar).

## Review flags

| Flag | Effect |
|---|---|
| `?empty=1` | Renders the page as a wallet with no data sees it (home, transactions, referrals, updates, mystery) |
| `?theme=light` | Forces the theme for a screenshot |
| `prefers-reduced-motion` | Every animation and the price ticker stop; forms and wizards jump straight through |

## Where the data comes from (all mock)

There is no backend. Each module reads its figures from one place so a real
API replaces a file, not a component.

| Module | What |
|---|---|
| `dashboard/data.ts` | Presale stage ladder, tokens and USD rates, user, wallet, holdings, referral totals, live orders |
| `dashboard/useDashboardData.ts` | The home's async loader (900 ms latency so the skeleton is real) |
| `markets/data.ts`, `useTransactions.ts` | Purchase history |
| `markets/feed.ts` | Seeded random-walk prices for the terminal and pair list |
| `referrals/data.ts` | Activity rows and totals |
| `updates/data.ts` | Updates and their bodies |
| `mystery/data.ts` | Prizes, odds, boxes, seeded claims |
| `payfi/corridors.ts` | Payout corridors, fees, ETAs |
| `earn/EarnPage.tsx` (ASSETS) | Assets at launch |

### localStorage keys

| Key | Written by | Holds |
|---|---|---|
| `rtx-session` | `auth/session.ts` | Signed-in email (demo) |
| `remittix.dash.theme`, `remittix.dash.rail` | `theme.ts` via `store.ts` | Theme and collapsed rail |
| `rtx-payfi-beta` | `products/requests.ts` | PayFi beta requests, per account |
| `rtx-earn-notify` | `products/requests.ts` | Earn launch notify list |
| `rtx-referral-wallet` | `referrals/wallet.ts` | Saved payout wallet and network |
| `rtx-claim` | `claim/store.ts` | The filed claim request (page always restarts at step one) |

Wallet connection in Claim is simulated: picking a provider walks a status
sequence and lands on the presale wallet from `data.ts`. `claim/wallets.tsx`
is where a real connector (MetaMask, WalletConnect, Trust) would plug in.

## Design system

`dashboard/dashboard.css` is the system: the `.dash[data-theme]` token layer
(`--d-*`), cards, chips, fields, tables, the rail, the phone bar and sheet,
empty states, skeletons, and the validation pattern. Page sheets
(`products/products.css`, `mystery/mystery.css`, `claim/claim.css`, …) only add
what their page needs and never redefine a token.

Shared parts worth knowing:

- `Button`, `Figure`, `Switch`, `Pager`, `Progress`, `EmptyState` (with the
  line-art set), `TokenSelect`, `settings/fields.tsx` (`TextField`,
  `PasswordField`, `goToField`), `settings/saved.tsx` (`Saved`, `useSaved`),
  `products/RequestForm.tsx` (email capture with invalid, duplicate, error and
  received states), `referrals/NetworkSelect.tsx` and
  `payfi/CorridorSelect.tsx` (the full-width menu with the chevron chip).
- Validation, one way everywhere: the field a message is about gets
  `data-invalid` (red ring), `goToField(id)` scrolls to and focuses it, and the
  message is a `.set-error` pill above the form's action.
- Tables stack on a phone through one scheme in `dashboard.css`: the first
  cell and `.is-key` on line one, `.is-a`, `.is-b`, `.is-c` on line two,
  unmapped cells hidden. New tables only need those classes.
- Phone chrome: `.tabbar` is the floating pill (Presale, Earn, Markets, Claim,
  More), `.sheet` the More panel (head and foot pinned, body scrolls), `.mbar`
  the brand bar in the topbar.

## Motion

- Mystery box: `mystery/arc.ts` is a 2D-canvas port of the Unicorn Studio
  "lightning border" shader, one canvas per `FxRow`, throttled to 30 fps.
  `Opener.tsx` runs the GSAP timeline for the reel; the chest is
  `MysteryChest.tsx` built from `components/FigmaHero/chest.svg`.
- Claim: stepper rail fill, step transitions, connecting and submitting
  sequences, and the Done reveal are GSAP timelines inside `gsap.context`, so
  StrictMode's double mount cannot leave elements at opacity 0.
- Markets terminal: `setInterval` every 2.6 s under `useFeed`, skipped under
  reduced motion.

## Verification scripts

`scripts/browser.mjs` exports `startPreview()`, `launch()` and `BASE` for
Playwright against `dist/` (it rebuilds when `src/` is newer). Ad-hoc scripts
during development walked every route at 390 px and 1600 px, normal and
`?empty=1`, and checked scroll width, empty states, console errors and each
form's failure path; the last run was clean on all fourteen routes at both
widths.

## Known gaps and next steps

- Everything is mock: no API, no wallet bridge, no auth service. The seams are
  the data modules and storage helpers above.
- The landing page's hero logs a deprecation for `THREE.Clock` and a WebGL
  extension notice; both are harmless and outside the dashboard.
- The PayFi and Earn email captures dedupe per browser only.
- Referral payout wallet validation is per network regex; Tron and Solana are
  base58 length checks, not checksums.
- `remittix-site.vercel.app` and `remittix-hero.vercel.app` aliases are held by
  another project; only `rtxdash.vercel.app` is aliased by `deploy.sh`.
- Fonts are bundled through `@fontsource-variable`; the dashboard uses Onest
  for text and NewBlack for figures (`--d-display`).
