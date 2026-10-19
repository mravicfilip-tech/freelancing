# Round 5, everything Filip has said, in one place

Filip on 2026-10-19 at 18:09, after rejecting the button board.

> I don't like any of these buttons, they don't feel 2026 or modern enough. You see how these casinos
> feel better executed UI wise, I believe this is a step in the right direction. Pick any button
> direction apply things. I want drastic 5 changes in the 5 design direction variants. Analyze whole
> chat, consolidate all of my feedback, inspirations, from start to zero and redo everything. Give me
> way way better options, put way more effort in. Build plan, execute after that no waiting.

This file is the whole brief for round 5. Every builder reads it end to end. Where it and an older
brief disagree, this one wins. The taste log still holds every rule, and this file says which apply.

## 1. What the job is

Five dashboard variants of the Lusty Lagoon casino lobby for a signed in player, John D., 2,492 USDT,
Bronze rank. Five drastically different design directions, not five layouts in one style. A person
flipping the switcher should feel five different products that all belong to the Lusty Lagoon brand.
Each is a real running page with real data shapes, every control working, every state drawn.

Round 3 and round 4 failed for the same root cause. One shared kit drew every variant, so the five
read as one product with five layouts. Round 5 gives each direction its own visual language.

## 2. The brand, the same in all five

- Palette, from `clients/lusty-lagoon/README.md`. Purple family (`brand` #8D26E7, `accent` #B47CFF),
  orange for the one primary action per section, gold for prizes, money amounts, badges and pending,
  green for wins and live, danger for errors. A direction may choose its own ground within purple
  black, indigo black, slate violet or true black, never another hue family.
- Fonts. Bai Jamjuree 600 and 700 for display, Switzer 400 to 900 for UI. Nothing else.
- Logo. The LUSTY over LAGOON wordmark component, as is.
- Art. Only what is in `lusty-lagoon/public/art` and the game covers. Never rendered over its source
  size. A character is never cut by the top of its frame, and when it breaks out above a frame it
  shows whole.
- Accessibility. WCAG 2.2 AA. Dark label on orange (white on bright orange is about 2.6 to 1).

## 3. Every rule from Filip that still binds

From the taste log, the Looms and the chat, newest first. Each is checkable.

### Buttons, round 5
- The primary is the tactile orange key. Two close orange stops, lighter at the top, a 1px inner top
  light, a 2px darker inner bottom edge, a dark label at weight 800, 48 tall in content and 52 to 56
  for heroes. Hover lifts brightness, pressed moves down 1px and loses the bottom edge. Its shape may
  follow the direction, rounded 12, full pill, or angled.
- The secondary is the same key in purple with a white label (Snegbet's Participate). Quiet buttons
  sit on the surface with an edge.
- Never a flat single fill primary (the five board systems were rejected for that). Never a gloss
  sheen, sunburst, coloured glow, or text glow.

### Colour and surfaces
- Orange is the action, at most one per section. Purple is the secondary and the selection. Gold is
  prizes, money and badges. Green is win and live. Pending is gold.
- No text glow. No inset shadow on tabs. No coloured outer glow on buttons or cards.
- A progress bar is a flat fill on a flat track, no bevel, no cast shadow.
- Repeated rows and cards never each carry their own gradient fill. Category tiles may each carry one
  hue, that is the art layer.
- No stock 3D icon set on feature tiles. No scattered tilted glowing coins.

### Layout and composition
- Variant 1 keeps its three columns and chat rail, variant 3 keeps the D3 order, variant 4 keeps its
  layout, variant 5 keeps the D4 order (details in section 5).
- A full labelled sidebar beats an icon rail ("I liked the previous sidebar").
- The four sidebar promo tiles are liked. They need better gradients, a soft border, and to look sharp.
- No menu button that does nothing ("not sure what this menu is doing, we can remove it").
- The sidebar active row needs a better treatment than the round 3 purple wash.
- Wins read best as a strip of game covers with handle and amount, filling the full row. The podium
  wins of the old variant 2 lost to it. Compact Snegbet feed cards are also in the references.
- All games ends on whole rows at 1440 and at 1920. No orphan gaps.
- The hero has to be big, exciting and crisp. "The hero needs to be bigger and the image upscaled",
  "this whole block is not fully exciting", "the woman is being cut off", "this element asset behind
  it is not fully polished" (the flower pillar).
- The variant 1 Daily chest widget was disliked as built (purple fill, six boxed digits, weekday strip).
- A hover never lifts a card into a clip. It lights the edge and scales art inside.
- Type sizes were all over the place. Each direction sets one ramp of at most seven sizes and keeps it.
- Visual hierarchy is a requirement, decide the first, second and third thing the eye lands on.
- The balance dropdown must work, it is a real menu (kit `BalancePill`).
- The Deposit button beside the balance was "very really bad". It is the orange key now.
- The weekly race was liked in principle, but floating side art beside the prize felt random.
- Signed in screens never show sign up offers.

### Execution, rounds 3 and 4
- "Take 99% more from those screenshots and get them way closer." Execution follows the references
  closely, vivid where they are vivid and calm where they are calm.
- "The layout directions are interesting." Layout is not where the variants failed.
- Premium 2026 is the bar. One soft light per panel at most, edges over fills, quiet labels and loud
  numbers, tabular figures, live elements that move without flashing, controls one height per row.

### The product screens, not this round
- The landing page, wallet, account and money screens stay 1 to 1 with the Figma, with the orange
  primary. Nothing in round 5 touches them.

## 4. The inspirations and what each gives

Files under `clients/lusty-lagoon/references/`. Open every one a direction names, with the Read tool.

| Set | Files | Gives |
|---|---|---|
| Round 5, accepted direction | `2026-10-19-round-5/snegbet-tournaments-desktop.webp` | Saturated tactile buttons, winners feed cards, in-house games row, grouped sidebar panels, tournament prize cards, colour coded ranks, chat with quotes and win cards |
| | `2026-10-19-round-5/player145-mobile-blue.webp` | Glassy cards with lit edges, originals tiles with heavy titles and 3D objects, balance pill with a plus |
| | `2026-10-19-round-5/betsera-mascot-lobby.webp` | A giant mascot breaking out of the hero, heavy display headline, originals tiles with very heavy condensed caps, live wins avatars along the top |
| | `2026-10-19-round-5/cs2-upgrade-angular.webp` | Angled language, parallelogram and trapezoid buttons, rarity lines under live items, slate grounds |
| Round 4, accepted | `2026-10-19-round-4/dribbble-task-manager-card-dark.webp`, `dribbble-crypto-trading-dashboard-dark.webp` | Near black panels, 1px light edge, one soft light, one strong number, sunken table headers |
| Round 4 research | `2026-10-19-round-4-research/live/` and `craft/` with `notes.md` each | Six live casinos (one saturated accent each), Hyde, Oval, Linear, Raycast recipes, cheap tells |
| Round 3, the ten | `2026-10-19/` with `README.md` | Turbo Bet three columns and chat, NewBettie bets table, Krush race podium, Cybet unlock schedule, Grimdrop stage, Wizard Casino bonus card, HugeWin, Skinify deposit, mines.gg calm panels, Catbet mobile |

## 5. The five directions

Each direction owns its ground, surfaces, shapes, type treatment, buttons, art use and motion. The
table is the contract. The paragraphs say how.

| # | Name | Layout | Seed references | Ground | Shape | Feel |
|---|---|---|---|---|---|---|
| 1 | Neon arcade | Three columns, chat rail | Snegbet, Turbo Bet, NewBettie | Indigo violet, about #0D0A26 | Rounded 12 to 20, pills | Vivid, social, busy but ordered |
| 2 | Mascot stage | Sidebar, cinematic hero, originals | Betsera, Player 145, Gamdom | Near black, about #0A0910, ember light | Rounded 16 to 28, full pills | Cinematic, character led, bold |
| 3 | Tournament arena | D3 order | Snegbet tournaments, Krush, Cybet | Navy purple, about #0E0B2C | Rounded 16 to 24, badges | Competitive, gamified, ranked |
| 4 | Angular floor | Round 3 layout kept | CS2 upgrade, mines.gg, Chips | Slate violet, about #15131D | Angled, clipped corners, radius 4 to 6 | Technical, esports, sharp |
| 5 | Glass vault | D4 order | Dribbble trading and task card, Player 145 glass, Cloudbet | True black, about #07060B, light blobs | Glass panels, radius 24 to 28 | Calm, luxurious, fintech |

### 1. Neon arcade, variant 1, Social lagoon
- Keeps the three columns, sidebar, centre and a chat rail, and the top block of hero, four tiles and
  the Daily chest.
- Top bar after Snegbet. Logo, the weekly race chip, the balance pill with the orange key Deposit,
  icon squares with edges, the account box.
- Sidebar. The 2 by 2 promo tiles, sharper, a hue light and a soft hue edge. Then a row of five
  in-house original icon tiles with NEW and hot badges (Snegbet). A quiet nav list with a clear active
  row. A grouped panel for Wallet, Send to agent, Refer a friend and FAQ with colour icons and
  chevrons. The hot streak card.
- A winners live feed across the top of the centre, compact Snegbet cards with thumb, avatar, handle,
  amount and a coin chip, filling the row.
- Hero on a purple burst like the Snegbet tournament art, the woman whole and large, a prize or streak
  line, the orange key. Four vivid category tiles with heavy titles and big 3D art.
- Daily chest redrawn compact, prize at 28 to 40, one line countdown, a segmented 7 day bar.
- Segmented chips with a vivid purple active pill, whole rows of covers, the bets table with gold,
  silver and bronze rank badges where a rank shows.
- Chat after Snegbet, MOD tags, reply quotes, a shared win card inside a message, a purple key send.
- Eye order. Hero, Daily chest, tiles.

### 2. Mascot stage, variant 2, new
- Replaces the dropped Sunset stage slot. Must not repeat its faults. A full labelled sidebar, a hero
  that is big with crisp art, wins as covers or avatar cards, cards Filip would like.
- A slim full sidebar after Betsera. Promo tiles at the top, nav groups, a VIP card at the bottom.
- The top bar carries a live wins avatar strip after Betsera, with the balance and orange Deposit.
- A cinematic hero about 460 to 520 tall, near black with a brand light from purple to ember, the
  biggest character art we have, breaking out above the hero frame and whole, a 64 headline in Bai
  Jamjuree, one line, the orange key pill and a quiet secondary.
- An Originals row of tall tiles, one hue each with a 3D object and very heavy capitals (SLOTS,
  MEGAWAYS, HOLD AND WIN, FISH, NEW, LIVE), staggered heights or one featured taller tile.
- Then hot games as covers in whole rows and a compact bets list.
- Eye order. The character and headline, the originals tiles, the covers.

### 3. Tournament arena, variant 3, Rank road
- Keeps D3. Hero and rank card on top always, then Pick up where you left off with Top wins today,
  then Hot right now, then the weekly race, then the rank road, then the unlock schedule and the bets.
- The hero becomes a Snegbet prize card. The 7 day chest on a purple burst with the chest art, a
  PRIZE label in small caps over the amount, a requirement line with icons, a full width orange key.
- The rank card becomes a Your position card, rank shield, EXP bar with a lightning mark, points to
  Silver, a colour coded rank badge.
- The weekly race becomes two parts, a prize pool card with the countdown and a leaderboard with gold,
  silver and bronze rank badges, your own row pinned and highlighted with a Play more key.
- The rank road as tier cards coloured by tier (bronze, silver, gold, platinum, diamond), pillars whole.
- The unlock schedule as day cards, today lit, done days checked green, pending gold.
- Eye order. The chest prize, your position, continue playing.

### 4. Angular floor, variant 4, Casino floor
- Keeps the round 3 layout. Top bar, nav row, live wins row, rooms bento, finder, providers, footer.
- Everything angled after the CS2 screen. Nav tabs as parallelograms, the orange key as a trapezoid
  or parallelogram with a chevron, panels with one clipped corner, section heads with an angled tab.
- The live wins row as segmented cells with a rarity line under each, gold, purple, blue, green by
  multiplier.
- Rooms keep their hue art inside angular frames with clipped corners, the lead Slots room largest.
- Slate violet grounds, edges at 5 to 8 percent white, small grey caps labels over bold tabular values.
- Eye order. The lead room, the other rooms, the finder.

### 5. Glass vault, variant 5, Quiet vault
- Keeps D4. Balance first, Quick deposit second, the giveaway third, then live wagers and biggest wins.
- True black ground with two or three large soft light blobs, purple and ember, fixed behind the page.
  Panels are frosted glass, white at about 4 percent, blur 24, a 1px edge at about 10 percent and a
  1px inner top light.
- The balance is the hero, the number very large (80 to 96, Switzer 600, tight tracking, tabular),
  the day's change under it, the character art inside the glass card and whole.
- Quick deposit as a glass card, method picker as quiet glass chips, Checkout as the orange key.
- The giveaway as a wide glass band with a gold light and the chest art, the prize at 40.
- Tables after the trading reference, header in one sunken bar.
- Eye order. Balance, Checkout, giveaway.

## 6. What every direction must also do

- Use real data from `features/variants/shared/data.ts`, `data/games.ts` and the wallet store.
- Every control works. Balance menu, Deposit to the wallet, a cover opens the game dialog, filters,
  search, chat send and likes, race and giveaway dialogs, countdowns that tick (frozen with `?still`).
- States through `?state=loading|empty|error`, plus long text. Skeletons in the real shapes.
- 1440 and 1920 both composed, no horizontal scroll, whole rows.
- One type ramp of at most seven sizes per direction, numbers tabular, display face for display only.
- Focus rings and keyboard on every control. Text contrast AA.
- The page carries the variant switcher, mounted at the app root already.
