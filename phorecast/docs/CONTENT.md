# Content: where every piece of copy lives

All copy is in the components as string literals or arrays; there is no CMS and
no content file. Links are centralised in two config files, `src/lib/cta.ts`
and `src/lib/sitemap.ts`. Copy was checked against the client's "website text"
document during the last feedback round (79 strings, no mismatches).

## 1. Page-level

| What | Where |
|---|---|
| Tab title `Phorcast \| The Future of Trading` | `index.html` `<title>` |
| Meta description | `index.html` `<meta name="description">` |
| Nav labels (Home, Markets, Leaderboard, More, Login, Sign Up) | `src/components/Nav.tsx` (`LINKS`, and the Login / Sign Up anchors) |
| Wordmark "Phorcast" | `src/components/Logo.tsx` |

## 2. Landing page bands

| Band | File | What is there |
|---|---|---|
| Hero | `src/components/hero/Hero.tsx`, `SLIDES` | Per slide: eyebrow, title (`\n` = line break), lede, CTA label, CTA key, optional terms line |
| Hero slide 2 art | `hero/slides/SlideAccount.tsx` | Illustration labels (price cards, "Trade executed" toast) |
| Hero slide 3 art and countdown | `hero/slides/SlideBonus.tsx` | Deposit/bonus illustration labels; `COUNTDOWN` values `02` / `14` / `38` and the "OFFER ENDS IN" label |
| Hero slide 4 art | `hero/slides/SlideFuture.tsx` | Network diagram labels (Sport, Elections tags) |
| Bento header | `bento/Bento.tsx` | "Why Forecasters Choose Phorcast" and its sub line |
| Bento card A | `bento/boxes/BoxOnboard.tsx` | "Make Your First Forecast in 60 Seconds", "No KYC. No documents. No waiting.", CTA "Start Forecasting" |
| Bento card B | `bento/boxes/BoxCustody.tsx` | "Your Funds Stay Yours", CTA "See How It Works" |
| Bento card C | `bento/boxes/BoxBonus.tsx` | "Your First Deposit, Doubled", CTA "Claim Your Bonus" |
| Bento card D | `bento/boxes/BoxMarkets.tsx` | "Forecast Global Markets in One Place", CTA "Explore Markets" |
| Familiar | `familiar/Familiar.tsx` | Eyebrow, "Every Outcome. One Place.", "Your View Has a Market", CTA; phone mock-up labels |
| Pillars | `pillars/Pillars.tsx`, `CARDS` and `ROWS` | Three cards (0.05% fees, Seconds, Instant withdrawals) and four pills (Fast Access, Full Control, Intuitive Markets, Transparent Settlement) |
| Fan | `fan/Fan.tsx` | Title, sub line; six category pills (Crypto, Sport, Finance, Geopolitics, Tech, Elections) with positions |
| Steps | `steps/Steps.tsx`, `STEPS` | Per step: tab label, title, body. Panel art text in `steps/panels/Panel{Register,Fund,Trade}.tsx` |
| Built | `built/Built.tsx`, `COLUMNS` | Header, two columns (title, body, CTA label, CTA key); card art text in the same file (`CardOne`, `CardTwo`) |
| FAQ | `faq/Faq.tsx` | See section 5 |
| Footer | `footer/Footer.tsx` | Strapline ("Trade the outcome, not the asset. ..."), copyright, disclaimer. Columns come from `sitemap.ts` |

## 3. About page (`src/components/about/About.tsx`)

| Band | Where in the file |
|---|---|
| Hero | `AboutHero`: title, lede, "Get Started" button |
| Choose an event | `CARDS`: three cards (title, body lines, image crop) |
| About Phorcast | `Brand`: two paragraphs |
| Cast your conviction | `Conviction`: the statement (the part after "We were founded" is in `.ab-conv__rest`) and the goal line |
| Comparison table | `CRITERIA` (five rows) and `BRANDS` (five venues, each with a yes/no array in row order) |
| Primer cards | `Primer`: "How Trading Prediction Markets Work?" list and the worked "Example" |

The About page renders the same `<Faq/>` and `<Footer/>` as the landing page.

## 4. Link configuration

### CTA targets (`src/lib/cta.ts`)

Every button and arrow link inside a landing band reads its target by key
through `ctaProps(key)`. Pointing a button at a real page is one edit here.

| Key | Button | Target today |
|---|---|---|
| `heroMarkets` | Hero slide 1, "Explore Markets" | `''` TODO(client) |
| `heroSports` | Hero slide 2, "Explore Sports Markets" | `''` TODO(client) |
| `heroBonus` | Hero slide 3, "Claim Your Bonus" | `''` TODO(client) |
| `heroToken` | Hero slide 4, "Explore the Token" | `''` TODO(client) |
| `bentoStart` | Bento A, "Start Forecasting" | `''` TODO(client) |
| `bentoBonus` | Bento C, "Claim Your Bonus" | `''` TODO(client) |
| `bentoHow` | Bento B, "See How It Works" | `#how` (the Steps band) |
| `bentoMarkets` | Bento D, "Explore Markets" | `''` TODO(client) |
| `familiarMarkets` | Familiar, "Explore Markets" | `''` TODO(client) |
| `builtFirstMarket` | Built left, "Find Your First Market" | `''` TODO(client) |
| `builtFinancial` | Built right, "Explore Financial Markets" | `''` TODO(client) |

### Sitemap, footer and MORE menu (`src/lib/sitemap.ts`)

`SITEMAP` is the footer's three link columns, in the client's order. The nav
bar's Markets and Leaderboard read their hrefs from it with `page(label)`, so
filling an entry fills every surface that shows it.

| Column | Links (target) |
|---|---|
| Product | Markets (`''`), Leaderboard (`''`), Trading Hours (`''`), FAQs (`#faq`) |
| Company | About (`/about`), Partner Program (`''`), Blog (`''`), Brand Kit (`''`) |
| Legal | Terms of Service (`''`), Privacy Policy (`''`), Cookies (`''`), Contact (`''`) |

`MORE_MENU = [page('About')]` is what the nav's MORE opens, on the desktop bar
and in the phone sheet. To add an entry, add `page('<label>')`; the label must
exist in `SITEMAP` or `page()` throws at load.

Href kinds: `'/about'` is a route; `'#faq'` is a landing-page section and is
rewritten to `'/#faq'` from other pages; `''` is a placeholder.

**How placeholders behave.** `linkProps` renders `''` as a real, focusable link
with its label, and cancels its click and middle click (`stayPut`), so it
neither reloads the page nor jumps to the top. Filling one in is a string
change; no markup changes.

### Social links (live)

`SOCIAL_URLS` in `src/lib/sitemap.ts`, rendered by `footer/Footer.tsx` in
this order, opening in a new tab:

| Network | URL |
|---|---|
| X | https://x.com/PhorcastHQ |
| TikTok | https://www.tiktok.com/@phorcast |
| Discord | https://discord.gg/phorcast |
| Telegram | https://t.me/phorcast |

## 5. FAQ (`src/components/faq/Faq.tsx`)

`ITEMS` holds seven question/answer pairs. Item 6 (withdrawals) also carries
`chips`: two label/value chips and a "verify" chip with the seal icon. The
accordion opens item 6 by default (`useState(5)`). The rail copy ("Frequently
asked", "Answers before you start" and the lede) is in the same file.

| # | Question |
|---|---|
| 1 | What is Phorcast? |
| 2 | What markets can I trade on Phorcast? |
| 3 | Do I need to KYC to open an account? |
| 4 | How quickly can I get started? |
| 5 | What is the minimum deposit? |
| 6 | How long do withdrawals take? |
| 7 | Do you plan to launch a Phorcast token? |

Several answers conflict with newer marketing copy; see KNOWN-ISSUES.md.

## 6. Every placeholder link

Find them with:

```
grep -rn "TODO(client)" src                  # the markers
grep -n "''" src/lib/cta.ts src/lib/sitemap.ts   # the empty targets themselves
grep -rn 'href="#login"\|href="#signup"' src     # unmarked dead anchors
```

**Marked `TODO(client)` (empty string, click cancelled):**

- `src/lib/cta.ts`: `heroMarkets`, `heroSports`, `heroBonus`, `heroToken`,
  `bentoStart`, `bentoBonus`, `bentoMarkets`, `familiarMarkets`,
  `builtFirstMarket`, `builtFinancial` (10).
- `src/lib/sitemap.ts`: Markets, Leaderboard, Trading Hours, Partner Program,
  Blog, Brand Kit, Terms of Service, Privacy Policy, Cookies, Contact (10).
  Markets and Leaderboard also appear in the nav bar.

**Not marked, and not handled by the placeholder system:** these are bare
hash links to ids that do not exist. A click adds the hash to the URL and does
nothing else.

- `src/components/Nav.tsx`: Login (`#login`) and Sign Up (`#signup`), on the
  desktop bar and in the phone sheet.
- `src/components/about/About.tsx`: the About hero's "Get Started"
  (`#signup`).

Move these into `sitemap.ts` or `cta.ts` when the app URLs are known.
