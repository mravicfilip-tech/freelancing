# Builder brief, round 3, five dashboard variants

Filip, 2026-10-19. "Take a chance to uplift the UI and layout of this casino dashboard with our
graphics, take it to the next level. 5 design variants of the dashboard, way way better UI. Just do
1 page for each variant." The references are the ten screens in `../../references/`, described in
`../../references/README.md`. The baseline is the Figma 1 to 1 lobby at commit a824509, route `/lobby`.

Each builder builds one variant, one page, the signed-in dashboard. Five builders run at once, one
folder each. The main thread wires routes, reviews every variant against the others and polishes.

## Setup, run these first

Your worktree starts on the wrong branch. Put it on the session commit before anything else.

```
git checkout -B variants-v<N> <SESSION_SHA>
ln -s <main checkout>/lusty-lagoon/node_modules lusty-lagoon/node_modules
cd lusty-lagoon && npm run build
```

Serve your build with `npx vite preview --port 418<N> --strictPort` in the background, and shoot it with

```
node /tmp/claude-0/-home-user-freelancing/76496740-33b7-5e16-a5ef-af5406e9e2dd/scratchpad/tools/snap.mjs "http://localhost:418<N>/variants/<N>?still" <out.png> 1440 900 --full
```

and the same at 1920 by 1080. Open the png and look at it. Shoot, judge, fix, and shoot again at
least three times before you report. Kill your preview server when you finish, with `fuser -k 418<N>/tcp`.

## Where you work

- Only `lusty-lagoon/src/features/variants/v<N>/` and, if you crop art, `lusty-lagoon/public/art/variants/v<N>/`.
- Replace `Variant<N>.tsx`, keep its default export. Split parts into files in the same folder.
- Do not edit anything else. Not `App.tsx`, not `components/`, not `shared/data.ts`, not the lobby,
  not tokens, css or the tailwind config. A part you miss gets built inside your folder.
- Commit on your branch with a message that names the variant. Never merge, never push.

## What you can use

- Parts in `src/components/ui/`, Button (variants primary gold, secondary purple, tertiary, quiet,
  sizes sm md lg icon cta cta-sm), Tabs, Dialog, Popover, Menu, Tooltip, Select, Switch, Checkbox,
  Field, Skeleton, Message, Avatar, GameTile, Logo, BrandText, Progress, StatusChip, MethodLogo.
- `GameDialog` from `features/lobby/LobbyPage`. Every play action opens it.
- `NotificationsPanel` and `useUnreadCount` from `features/account`, for the bell.
- `useWallet()` from `features/wallet/store` for `balance` and `transactions`.
- Data. `data/games.ts` (GAMES, gameById, CATEGORIES), `data/wallet.ts` (ACCOUNT, coinById),
  `data/ranks.ts` (RANKS, shortPoints), `features/lobby/data.ts` (BETS, payout, TOP_WINNERS,
  FEATURED, RECOMMENDED, EXPLORE_ORDER, GIVEAWAY), `features/variants/shared/data.ts` (CHAT,
  LIVE_WINS, RACE, DAILY_CHEST, ROOMS, PROVIDERS, CONTINUE_PLAYING, ONLINE_NOW, useCountdown,
  useVariantState).
- Art, all in `public/art/`. Game covers in `games/` (tall, and `-wide` for a few). Characters with
  transparent backgrounds in `landing/` (girl-floral, girl-lei, girl-offshoulder, girl-wrap,
  pillar-girl), `auth/` (login-player, register-player) and `money/refer-megaphone`. Scenes in
  `landing/` (casino-arcade 2 by 1, casino-hall and casino-courtyard square, hero-beach), `auth/`
  (login-beach, register-sunset), `lobby/hero-sunset`. Props, `landing/` pillars (flowers left and
  right, gems a and b, girl), `landing/slot-machine`, `lobby/giveaway-chest`, `lobby/hero-girl`,
  `lobby/hero-pillar`, `lobby/giveaway-pillar`, `lobby/featured-sugar-rush`. Shell icons in `shell/`.
  Avatars in `avatars/`. Coins come from `coinById(id).icon`.

## Rules every variant keeps

These come from Filip's review notes and the client README. They are not up for exploration.

- Brand. Palette from the tokens only (page, sunken, panel, raised, line, field, ink, ink2, ink3,
  accent, brand, gold, tonal, pending, success, danger, win, label, card-line and the rest in
  tokens.css). Bai Jamjuree for display, the wordmark and big numbers. Switzer for UI text. The
  Logo component as is. BrandText for a display headline in the wordmark treatment.
- Note 1. Surfaces are flat or one soft tone. Never a strong gradient, never a different gradient
  on each repeated tile. A selected thing shows a border and a check, never a brighter gradient.
- Note 2. No text glow or text shadow anywhere. Tabs never get an inset shadow.
- Note 3. Progress bars are a flat fill on a flat track. No bevel, sparkles or cast shadow.
- Note 4. Coins are flat and upright, never scattered, tilted or glowing.
- Note 5. Repeated tiles share one icon style and one surface.
- Note 6. Rows and FAQ rows are flat.
- Note 7. Buttons have no gloss, sunburst or bevel. Gold is the primary action, at most one per
  view area. Purple is secondary.
- Text. 14px is the floor for anything read to act, 12px only for captions, badges and table
  heads. Contrast AA. Sentence case for UI copy, plain words, no marketing voice. A button says
  what happens.
- Data adds up. Payout is wager times multiplier. Amounts vary. A cover matches its game name.
- Accessibility. Every control is a real button or link with a name, focus is visible, images
  that carry no meaning get `alt=""`, keyboard reaches everything.
- States. `?state=loading` shows skeletons for the games and the live feed, `?state=empty` shows
  an empty game search with a next step, `?state=error` shows the feed paused and the games failed
  with a retry. `?still` freezes every countdown. Read it with `useVariantState()`.
- Widths. Design for 1440 by 900 first, the first screen is what Filip judges. It must also hold
  at 1920, grids add columns, nothing stretches into lines over 80 characters. No phone layout.
- Tailwind trap. The preset replaces the scales. Spacing keys are 0 0.5 1 2 3 4 6 8 12 16 24
  (0 to 96px). Heights h-4 5 6 8 9 10 11 only. Text sizes text-12 14 16 18 20 24 28 32 40 48.
  Radius rounded (4), lg 8, xl 12, 2xl 16, 3xl 24, full. Anything else, h-12, ml-5, gap-5, silently
  does nothing. Use arbitrary values such as `h-[48px]` when you need one.

## Quality bar

"Way way better" means a page a casino player trusts with money and wants to come back to.

- One signature element per variant, named below. Spend the boldness there, keep the rest quiet.
- Real hierarchy. One primary action per area. Numbers that matter are big and tabular.
- No SaaS card kit. Not everything in identical rounded boxes. Vary the shapes by what they hold.
- No uppercase eyebrow over every heading, no middle dot meta strings, no arrows tacked onto
  button labels, no numbered markers unless the content is a real sequence.
- Every interactive thing works. Nav links go to real routes (/lobby, /wallet/deposit,
  /wallet/withdraw, /agent, /refer, /faq, /account, /notifications). Balance and Deposit go to the
  wallet. Play opens GameDialog. Tabs filter. Carousels move.
- Use our art generously and well. Cut-out characters break out of their frames, scenes fill
  panels, covers are never stretched.

## The five variants

### 1. Social lagoon

Thesis. The lobby is a room full of players. Six of the eight desktop references keep a live chat
column, Lusty Lagoon has none. Borrow the three column shell of Wizard Casino, Grimdrop and NewBettie.

```
| nav 232 | content, fluid                                  | rail 320              |
|         | top bar, search, balance + Deposit, bell, you   |                       |
| logo    | hero, sunset + girl cut-out, headline, 2 CTAs   | daily chest card      |
| promo   | rooms row, 4 compact tiles with art and players | Chat 1,284 | Friends  |
| nav     | live wins strip                                 | messages              |
| groups  | recommended rail                                | ...                   |
| rank    | latest wagers with tabs                         | composer + Send       |
```

- Signature. The right rail, sticky and full height. On top the daily chest card, chest art
  breaking out of the card, a ready in countdown, the seven day streak as small day cells with a
  check on claimed days. Under it Chat and Friends tabs, messages with avatars, flat Admin and Mod
  badges, mentions in accent, a composer whose Send adds the message as John D.
- Nav groups Casino (Lobby, Slots, Megaways, Hold and win, Fish games, New, with counts), Money
  (Wallet, Send to agent, Refer a friend), Help (FAQ). Two small promo tiles on top, Daily chest
  and Weekly race, same surface, own art. A compact rank card at the bottom.
- Refuses. Category tiles in a different loud colour each (NewBettie, Turbo Bet).

### 2. Sunset stage

Thesis. Our art is the best thing we own, so the page opens on a stage, not a card. Borrow the
cinematic hero of Grimdrop and the large custom game cards of its carousel.

```
| rail 80 | top bar floats over the stage, search, balance + Deposit, bell, you      |
| icons   | STAGE, full content width, about 560 tall, edge to edge                  |
| + label |   headline in BrandText, about 72px, live player line, gold + purple CTA |
|         |   girl-lei cut-out large on the right, pillars framing, sunset behind    |
|         | [continue playing dock, 4 cards overlapping the stage's bottom edge]     |
|         | made for you, 3 large game cards, cover + blurred cover backdrop, play  |
|         | giveaway band, chest + amount + join                                     |
|         | all games, chips + grid with names under covers                          |
```

- Signature. The stage. Sunset scene filling the width, the girl cut-out about 520 tall breaking
  past the stage bottom, the continue playing dock overlapping its lower edge, each dock card with
  cover, name, last played and the session result signed and coloured (+$60.00 in win, -$40.00 in ink3).
- Nav is an 80 wide icon rail with the shell icons and a 12px label under each, active item with
  the accent well. The logo mark sits at the top of the rail, the full wordmark lives in the stage.
- Refuses. A boxed hero with rounded corners floating in the page.

### 3. Rank road

Thesis. Give the player reasons to come back before giving them games. Borrow the rewards and
unlock schedule of Cybet and the race podium of Krush, minus their glow.

```
| nav 248 | top bar                                                               |
|         | Evening, John            [player card] [daily chest] [weekly race]    |
|         | RANK ROAD, full width, Bronze . Silver . Gold . Platinum . Diamond   |
|         |   a pillar per rank, the road filled to you, You are here marker      |
|         | pick up where you left off, 4 wide cards     | top wins today          |
|         | hot right now grid                                                     |
|         | latest wagers, compact                                                 |
```

- Signature. The rank road. A horizontal road across the page with the five ranks as milestones,
  each milestone one of our pillar cut-outs (Bronze flowers left, Silver gems a, Gold gems b,
  Platinum flowers right, Diamond the pillar girl), rank name, points to reach it and its reward
  from RANKS. The road is a flat accent line filled to the player's 550,000 points, a You are here
  marker with John's avatar sits on it. Ranks ahead are dimmed, not hidden.
- Player card with avatar, rank badge, points as a big tabular number, a flat bar and the line
  "100,000 points to Silver". Daily chest card with the chest art and the seven day cells. Weekly
  race card with the pool, the countdown in days, hours and minutes, a three avatar podium and your
  place.
- Refuses. Stacked promo banners that all shout at once.

### 4. Casino floor

Thesis. Finding the next game is the main job. Walk into a room, then filter fast. Borrow the
category tiles of Turbo Bet and NewBettie, the provider row and live wins ticker of HugeWin.

```
| top bar full width, logo, wide search with a / hint, balance + Deposit, bell, you |
| primary nav row, Lobby Slots Megaways Hold and win Fish New    Wallet Refer FAQ  |
| live wins ticker, cover + player + amount, scrolls with arrows                    |
| ROOMS bento   [ Slots, arcade, 2 wide ] [ Megaways, hall ] [ Hold and win ]     |
|               [ Fish games, beach ]      [ New, slot machine ]                   |
| find a game, sticky bar, category chips with counts, provider select, sort,     |
|   results count                                                                 |
| grid, 8 columns at 1440, name and provider under each cover                    |
| providers row                                                                   |
```

- Signature. The rooms bento. Each room a scene from our art filling its tile, a dark scrim only
  where the text sits, the room name in Bai Jamjuree, a short blurb, live players and the game
  count, the whole tile one link that sets the filter and scrolls to the grid.
- No sidebar. The primary nav is a row under the top bar.
- Filters work. Category chips show a check and a border when picked, provider and sort use the
  Select part, results count updates, empty result has a clear button.
- Refuses. Loud per tile colours, and a sidebar that repeats the category chips.

### 5. Quiet vault

Thesis. The calm counterpoint. Money and live play first, effects zero, art used once. Borrow the
restraint of mines.gg and the latest bets table of NewBettie.

```
| nav 232, text only | top bar                                                    |
|                    | BALANCE card, 2,492.00 USDT very large, today +60.00,      |
|                    |   Deposit gold, Withdraw purple, last three transactions,  |
|                    |   one character cut-out at the card's right edge           |
|                    | [giveaway, compact]                                         |
|                    | LIVE WAGERS, the main table, tabs, 12 rows, live dot        |
|                    | jump back in list       | top wins today list               |
|                    | all games, small tiles, 10 columns                          |
```

- Signature. The balance as type. Bai Jamjuree at about 64px, tabular, the currency smaller beside
  it, the day's change under it. One cut-out, girl-wrap or login-player, standing at the card's
  right edge. Nowhere else on the page carries art except the game covers.
- Live wagers table is the centre of the page. Pinned header, game cover and name, player, time,
  wager with coin, multiplier, payout in win colour when above zero.
- Refuses. Everything decorative. No scenes, no pillars, no chest art outside the giveaway card.

## Report

Five lines or fewer. The variant, the commit hash on your branch, what the signature looks like in
one line, anything you could not build and why, the path of your last 1440 screenshot.
