# Builder brief, round 3b, rebuild variants 2 to 5 on the reference kit

Filip, 2026-10-19, on the first five builds. "They're not better than what we have currently. Take
99% more from those screenshots and get way closer. The layout directions are interesting, but the
execution is nowhere near." Logged REJECTED in `taste.md` at 15:20.

Each variant keeps its layout direction from `variants-brief.md`. Its execution is rebuilt to the
level of the reference screenshots, on the shared kit, with variant 1 as the bar.

## Read first

1. `variants-brief.md` in this folder, for setup, data, art and your variant's direction.
2. This file. Where the two disagree, this file wins.
3. The kit, `lusty-lagoon/src/features/variants/kit/` (parts.tsx, TopParts.tsx, ChatPanel.tsx,
   Boards.tsx, kit.css). Use these parts. Do not edit the kit. A part you need that the kit lacks
   gets built in your own folder, in the kit's style.
4. Variant 1, `lusty-lagoon/src/features/variants/v1/Variant1.tsx`, and its shot at
   `/tmp/claude-0/-home-user-freelancing/76496740-33b7-5e16-a5ef-af5406e9e2dd/scratchpad/review/k1-fold.png`.
   That is the execution bar. Yours must look as finished and as close to its references.
5. Your references, the images named under your variant below, in
   `studio/clients/lusty-lagoon/references/2026-10-19/`. Open each and crop into it. Copy their
   execution, sizes, radii, boxes, type weight and density, using our art and our data.

## What changed from the first brief

- Explore mode for this ask. Strong single hue gradients on tiles and cards are allowed, each tile
  its own hue, as the references do (kit.css has purple, gold, blue, green, pink, teal). Notes 1 and
  5 of the taste log are lifted for the variants. Text glow stays off.
- Display type is Bai Jamjuree Bold in capitals, big and heavy, for heroes, tile titles and card
  titles. UI text is Switzer, bold for labels, as the references set it.
- Every control sits in a box. Top bar items in 52 tall rounded 14 boxes on the item surface, nav
  rows as their own rounded pills, chips as boxed buttons, square icon buttons.
- Our art breaks out of tiles and cards the way the references' 3D objects do. Characters,
  pillars, the chest, the slot machine, the neon reels (`/art/kit/neon-reels.webp`, use
  `mix-blend-screen` on a coloured tile), the neon casino scene (`/art/kit/neon-casino.webp`).
- Brand palette hues, fonts, the logo and accessibility still hold. Contrast AA, 14px floor for
  anything read to act, 12px for labels and badges, every control named and reachable.
- Tailwind trap, again. Spacing keys 0 0.5 1 2 3 4 6 8 12 16 24 only, heights 4 5 6 8 9 10 11 only.
  `p-5`, `gap-5`, `top-5`, `h-2`, `h-7`, `h-12` and any `x.5` other than 0.5 do nothing. Run
  `python3 -I /tmp/claude-0/-home-user-freelancing/76496740-33b7-5e16-a5ef-af5406e9e2dd/scratchpad/tools/scalecheck.py src/features/variants/v<N>/*.tsx`
  from `lusty-lagoon/` and fix every hit except `min-h-0`.

## Per variant, the references to copy

### 2. Sunset stage, Grimdrop, Catbet, HugeWin

- Keep the 80 wide icon rail, in kit style, dark rounded squares, the active one on the purple wash.
- The stage is Grimdrop's wide hero at full content width. A headline in heavy capitals across two
  lines, as "PLAY SPIN / WIN BIG!" is set, ours "WHERE LUCK / MEETS LUST", the second line in gold.
  A purple Play now button, our sunset scene, the girl cut out large on the right breaking the edge.
- Under it Grimdrop's revenue strip, a row of game covers as rounded squares with an amount chip
  under each, then Grimdrop's large custom game carousel, three big art cards with a dark lower
  fade, the name in capitals, an online count and a square play button.
- Then Grimdrop's category bar, an ALL GAMES purple pill and icon tabs, Providers and search, and
  a trending grid with the name in capitals and the category under each cover.
- Right column like Grimdrop and Wizard Casino, a Free bonus card (gold or green hue, countdown
  digits, Get bonus) over Chat, Messages and Friends tabs. Use the kit ChatPanel for Chat.

### 3. Rank road, Cybet, Krush

- Shell like Cybet, collapsible groups in the sidebar, chat optional.
- Hero like Cybet's "7 day bonus unlock schedule", a heavy headline, two stat boxes (unlock amount,
  countdown) and a button, the chest art large on the right.
- An unlock schedule like Cybet's, one card per day of DAILY_CHEST, header with the day and claimed
  or pending, rows with an icon box, a timer and an amount. Claimed rows green, the expired row red.
- The rank road stays the signature, executed like Cybet's level cards. A current level card with
  the badge, the level name in heavy type, a thick flat progress bar and "100K points to Silver",
  and a ladder of the five ranks with our pillars, each rank a card with its reward.
- Krush's race block for RACE, the prize in big gold Bai Jamjuree, the countdown in four boxes
  with purple labels, a podium of three cards with avatar rings, the first raised in the middle,
  place tabs on their corners, then a My status row of three cards (position, total played, reward
  with a Claim button).

### 4. Casino floor, Turbo Bet, NewBettie, HugeWin

- No sidebar, as directed. The top bar like NewBettie, logo, a Casino and Live switch style
  segmented control for the nav row, balance with a blue or purple Deposit, settings, chat.
- HugeWin's live wins chips across the top, each chip a cover, player and amount in a dark box.
- The rooms as vivid tiles like NewBettie's 2 by 2 of Roulette, Mines, CoinFlip and Crush, each
  its own hue with a live player count chip in the corner, our art breaking out. Make the bento
  big, five rooms, the Slots room largest.
- The finder like Turbo Bet's All games, boxed chips with icons, a search box, provider select and
  sort, then large rounded covers. HugeWin's providers row as boxed wordmark tiles.

### 5. Quiet vault, mines.gg, NewBettie, Skinify

- Flat navy surfaces and one accent, as mines.gg does it. Calm, but finished.
- The balance card plus a quick deposit panel in Skinify's execution, method cards with a type tag
  (CARD, ONLINE, TRC20), the picked one with a coloured outline and check, amount presets ($15,
  $25, $50 in boxes), You pay, You get and the commission line, a Checkout button, a promo code
  field with Apply. Use CASH_METHODS and COINS from data/wallet.ts.
- NewBettie's latest bets table as the centre, from the kit BetsBoard or your own at that level.
- mines.gg's biggest wins feed, cards of "The user won $5,000" with an avatar and a date, and its
  tabs of Highest wins and Luckiest wins.

## Report

Five lines or fewer. The commit on your branch, the last 1440 shot path, and anything you could
not match.
