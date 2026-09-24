# Known issues and open items

Grouped by who has to act. Each item names the file to start from. Items
marked *measured* were reproduced in headless Chromium at handover; the rest
are carried over from QA and should be re-checked before work starts.

## 1. Open client questions

These need an answer from the client before any code changes.

**1.1 The token slide contradicts the FAQ.** Hero slide 4 says
"INTRODUCING THE PHORCAST TOKEN" with an "Explore the Token" button
(`hero/Hero.tsx`, `SLIDES[3]`), and the About comparison table ticks "Own
Native Token" for Phorcast (`about/About.tsx`, `BRANDS`). FAQ item 7
(`faq/Faq.tsx`) says a token is on the roadmap with "No date or details yet".

**1.2 Product claims in the new copy conflict with the FAQ.**

| Claim | Where | Conflicts with |
|---|---|---|
| "No KYC. No documents. No waiting." / "No mandatory KYC." / "No KYC Account Opening" | `bento/boxes/BoxOnboard.tsx`, `steps/Steps.tsx` step 1, `about/About.tsx` `CRITERIA` | Steps step 2 offers card, Apple Pay, Google Pay and bank transfer, which normally require KYC; FAQ 3 allows verification on large withdrawals; FAQ 4 and 5 describe crypto deposits only |
| "Instant withdrawals" | `pillars/Pillars.tsx`, third card eyebrow | FAQ 6: "can take up to 24 hours"; its chips say "Up to 24 hours" |
| "in 60 Seconds" | `bento/boxes/BoxOnboard.tsx` title | FAQ 4: "Under two minutes" |
| "Your Funds Stay Yours", "self-custody", "non-custodial" | `bento/boxes/BoxCustody.tsx`, `built/Built.tsx` (`COLUMNS[1]`), `index.html` meta description | FAQ 4 to 6 describe a deposit address, a credited balance and withdrawals held for security review, which reads as custodial |

**1.3 Artwork no longer matches the new headlines.**
- Hero slide 2, "Your Sports Knowledge Has a Market": the art
  (`hero/slides/SlideAccount.tsx`) is the earlier account and price-card
  cluster with a "Trade executed" toast.
- Hero slide 4, the token slide: the art (`hero/slides/SlideFuture.tsx`) is a
  market network diagram (Sport and Elections tags, a BTC coin, the 3D mark).
- Steps step 3, "Make Your First Forecast": the panel
  (`steps/panels/PanelTrade.tsx`) is a price chart.

New artwork needs design input; the slots and their motion can stay.

**1.4 The bonus countdown is not real.** `BonusCountdown` in
`hero/slides/SlideBonus.tsx` starts at a fixed `02` days `14` hours `38`
minutes and `SlideBonus.motion.ts` ticks one minute off every 6 seconds for
effect. It needs a real end date (and a decision on what shows after it) before
it can go live. Once there is a date, compute the values from it and keep the
roll animation for the change.

**1.5 Leftover "trade" wording.** The copy moved from trading to forecasting,
but these remain:
- Artwork labels: "Trade executed" (`hero/slides/SlideAccount.tsx`), "You trade
  with" and its `aria-label` (`hero/slides/SlideBonus.tsx`).
- FAQ (`faq/Faq.tsx`), five lines: Q1 answer "built for traders", Q2 "What
  markets can I trade", Q3 answer "start trading", Q7 answer "active traders",
  and the rail lede "What you can trade".
- Tab title `Phorcast | The Future of Trading` and the meta description
  "non-custodial trading" (`index.html`).

The footer strapline "Trade the outcome, not the asset." and the About copy
are the client's own words and were left as supplied.

**1.6 Which "bar" did the client mean?** Early feedback asked to remove a bar
that was "too big, touches other boxes". The market-snapshot row under the hero
pager (AAPL, TSLA, BTC cards) was removed on that basis. The client's
annotation may instead point at the pager line itself (the prev, track, next
control in `hero/Position.tsx`). Confirm.

**1.7 Brand spelling in the footer design.** The client's footer screenshot
spells the brand "Phorecast" (and the domain phorecast.io). Everything on the
site, and the Figma file, says "Phorcast"; the footer keeps "Phorcast"
(`footer/Footer.tsx` header comment). The repository folder, the npm package
name and the `localStorage` key use the "phorecast" spelling; none of those is
visible to users.

**1.8 Placeholder links.** 20 links marked `TODO(client)` and three unmarked
dead anchors (Login, Sign Up, About "Get Started"). Full list in
[CONTENT.md](CONTENT.md#6-every-placeholder-link).

**1.9 Galano Grotesque files.** Not supplied yet; labels render in fallback
fonts. See [ASSETS.md](ASSETS.md#5-fonts).

## 2. Layout nits (pre-existing)

| Issue | Width | Start from |
|---|---|---|
| Bento A's "Start Forecasting" link overlaps the phone illustration's outline. *Measured*: the link's box intersects `.onb__phone` at 360, 390 and 414. | phones | `bento/boxes/BoxOnboard.css` (phone block) |
| "Your Funds Stay Yours" title has about 3px clipped (from QA; not reproduced by a box measurement, so check visually). | phones | `bento/boxes/BoxCustody.css` |
| Hero slide 4's artwork touches the copy. *Measured*: the illustration's stage (`.sl4__stage`) starts 32 to 42px above the bottom of the copy at 360 to 414. | phones | `hero/slides/SlideFuture.css` (phone block) |
| Bento D's "Explore Markets" link sits on the tile field. *Measured*: it overlaps the orbit field and comes within 0.6 to 8px of the nearest tile. | 768 to 1440 | `bento/boxes/BoxMarkets.css` |
| The four hero slides' bottoms line up only at 390px. | phones other than 390 | `hero/Hero.css` and each slide's phone block |
| Height cliff at 720/721px. *Measured* at 844px tall: the hero is 1147px at 720 and 1476px at 721. | 720/721 | `hero/Hero.css` (`@media (max-width: 720px)` against the 721 to 1180 layout) |

## 3. Accessibility

- **Contrast on the orange card.** Bento A's white "Start Forecasting" link
  (`--on-accent`) sits on the lower part of a gradient running to `#ff632a`
  and `#f8a361` (`--onb-grad-*` in `BoxOnboard.css`): about 2.5:1, below AA.
  Needs a design decision (darker link, darker stop, or a backing).
- **Dark eyebrow grey** `--ink-muted` in dark is 3.16:1 on the page, as
  designed; light mode was raised to 4.63:1. Documented in `tokens.css`.
- **Steps auto-advances without a pause control.** It moves every 6 seconds
  for as long as it is on the page (`steps/Steps.tsx`, `DWELL_MS`); only
  reduced motion stops it. The hero carousel has a pause button for WCAG 2.2.2;
  Steps may need the same.
- **Dead anchors** `#login` and `#signup` are announced as links that go
  nowhere.

## 4. Behaviour to know about

- **The 3D logo tilts toward the pointer.** Kept on purpose: the client asked
  to keep it. `MOTION.md`'s "no tilt toward the cursor" rule applies to the
  illustrations and does not override this. Tilt is off on touch devices
  (`HeroLogo/LogoScene.ts`, strength in `HeroLogo/config.ts`).
- **`scroll-behavior: smooth` on `html` (`styles/global.css`) is a
  ScrollTrigger hazard.** GSAP advises against it. It turns scroll anchoring
  corrections into animated excursions, which the About pin has to defend
  against (next item). It stays because in-page anchors rely on it; if you
  remove it, re-test the About conviction band and every `#` link.
- **The About conviction band is a pinned ScrollTrigger** with a
  scroll-anchoring workaround (`overflow-anchor: none` on `<html>` for two
  frames while the pin spacer is inserted) and a latch that waits for the
  scroll to settle. Read `about/About.conv.motion.ts` in full before touching
  the band, its height or anything above it on the About page.
- **Entrance hide lists must match the motion modules.** Each band's CSS hides
  a list of selectors while `data-motion="pending"`; if you rename or add an
  animated element, update both. See ARCHITECTURE.md section 5.
- **Never `clearProps: 'all'`** on an `<Icon>` or any element React writes
  inline styles on. See DESIGN-SYSTEM.md section 5.
- **Reduced motion is read once** for section entrances (`REDUCED` in
  `lib/motion.ts`); changing the OS setting mid-session takes effect on reload.
- **Bundle size.** The main chunk is about 800 KB (about 265 KB gzipped) and
  triggers Vite's size warning. three.js and the logo scene are already a
  separate lazy chunk; the main chunk is the app, GSAP, React and the small
  SVGs Vite inlines as `data:` URIs.

## 5. Placeholder content

Every empty link renders as a real, focusable link whose click is cancelled,
so the markup is final and only the target string changes. Nothing on the site
is lorem ipsum; the remaining placeholders are the links in 1.8, the static
countdown in 1.4, and the fallback label font in 1.9.
