# Round 4 plan, lusty-lagoon

One pass over the 31 notes in `notes.md`. Baseline is commit f8ced30, the build live at
https://lusty-lagoon.vercel.app/variants. Nothing in it may regress except what a note names.

- Deadline. None. Filip said "Don't worry about due dates" earlier in the thread.
- Live variants after this round. 1 Social lagoon, 3 Rank road, 4 Casino floor, 5 Quiet vault. The
  numbers stay as they are, so every note keeps its meaning.
- Widths 1440 and 1920, desktop only, per the client README.
- Delivery. A pushed commit named by its short hash in chat. The live link moves to that commit only
  on Filip's ship line for it.

## Decision lines, each needs its own answer

"Go" does not cover these. Each moves layout, direction or a brand value. While one waits, the
build lines below run.

### D1. Two reference sets, split by layer

- The tension. Round 3 ruled that execution follows the ten casino screens closely, with vivid tiles
  and heavy caps. Note 12 points at two near black Dribbble screens as better UI. Followed end to end,
  each one cancels the other.
- Default. The casino screens own the content, meaning game covers, category art, heroes, mascots,
  chest and prize art, and the one hue a category tile carries. The two Dribbble screens own the
  chrome, meaning panels, cards, tables, widgets, controls, the top bar, the sidebar and the type.
- Chrome rules under that default. Brand `page` and `panel` grounds from the README, a 1px light edge
  on every panel (ink at about 8%), one soft purple light per panel at most, labels in `ink-3` at 12
  or 14, rows split by space or one faint line, one strong number per panel, colour kept for status
  and for the one primary action.
- What it refuses. A gradient on every card, boxed digits, glows, and chrome copied from the casino
  screens.

### D2. Variant 1 top block, redrawn (notes 8, 14 to 17)

- Hero. The woman shown whole inside the frame, never cut by the band, from the higher resolution
  cut out. The flower pillar leaves, a soft brand light takes its place. One live line in the hero,
  the player's streak or the chest pay, beside the orange primary.
- Four tiles. Each keeps its own hue as art, with one calm two stop fill, the 1px light edge, art
  larger and breaking out of the top edge inside the tile, and the live count as a chip.
- Daily chest card. Drawn after the Task Manager Card. Near black panel, one purple light, the chest
  art top right, the countdown as one line of large numbers instead of six boxes, the seven day streak
  as a thin segmented bar, Remind me as a quiet secondary.
- References. Turbo Bet for the hero and tiles, the Task Manager Card for the chest card.

### D3. Variant 3 order and hero (notes 19 to 24)

- Order, read from the cursor path in note 24. Hero and rank card on top, always. Then Pick up where
  you left off with Top wins today. Then Hot right now. Then the weekly race. Then the rank road. Then
  the unlock schedule and the bets.
- Hero. Taller band, the woman whole inside it, the chest kept inside the hero edge rather than
  breaking across the bottom border, larger art.
- Weekly race. The slot machine and the chest that float either side of the prize leave. The prize,
  the countdown and the podium carry the panel.

### D4. Variant 5 hierarchy (notes 26, 27, 29 to 31)

- Order. Balance first, Quick deposit second, the giveaway third, Live wagers and Biggest wins after.
- Balance card. The largest card on the page and the only one in the money row with the purple
  light. The number stays at 64 with the day's change under it. Withdraw and Send to agent stay
  secondary, so the only orange in the row is Checkout.
- Giveaway banner. Taller, its gold hue as a full band, the chest art breaking out of the top, the
  prize at 40, Join the giveaway as the row's orange primary.
- Biggest wins. The card starts level with the Live wagers heading.

### D5. Pending moves off orange

- The clash. The README's `pending` chip is `#F19920`, an orange. With orange as the primary action,
  a pending chip reads like a button.
- Default. Pending takes the brand `gold` `#F4D543`, which leaves buttons under this ruling and keeps
  prize and money amounts. Orange then means one thing, act here.

## Build lines, covered by "go"

### Shared, first, because every variant reads it

1. One button board, notes 3, 5, 10 and 28. Notes 5 and 28 ask for the same thing twice, five
   button variants and five orange buttons, so they share one board of five button systems. Each
   system shows the orange primary, the purple secondary, a quiet button, an icon square, three
   sizes, hover, pressed, disabled and loading, plus Deposit beside the balance and Checkout in place.
   The five differ on real axes.
   - 1 Flat. Solid orange, dark ink label, 12px radius, sentence case.
   - 2 Pill. A two stop orange fill, low contrast, white label, full pill.
   - 3 Caps. Solid orange, 8px radius, Bai Jamjuree 700 caps with wide tracking, a 1px lighter inner
     edge.
   - 4 Icon tile. Solid orange with a darker orange square holding an arrow at the trailing end.
   - 5 Split. Label on the orange fill, the amount or count on a darker orange segment beside it.
   - Every one obeys the taste log. No gloss highlight, bevel, sunburst or outer glow. The orange
     candidates sit on the board as swatches with their contrast numbers, and the pick sets the token.
   - `variants.mjs` board, Filip answers with a number, `/taste` logs it.
2. One sidebar board, notes 2 and 4. Four active row treatments, each shown with the promo tiles in
   their new edge (soft 1px border, one calmer fill each, sharper art crop).
   - 1 Raised row with a 1px light edge.
   - 2 Raised row with a 3px accent bar at the left.
   - 3 Accent edge all round, no fill change.
   - 4 A soft accent light from the left inside the row, no edge.
3. Type ramp, note 6. Seven sizes, 12, 14, 16, 20, 28, 40 and 64. Display face at 40 and 64 only.
   Every one off size maps to its nearest step. Variants 1, 3, 4, 5 and the kit.
4. Hover stays in place, note 7. No lift on tiles or covers. The edge lights and the art scales
   inside the clip, so nothing can be cut. The narrower fix, keeping the lift and making room for
   it, is there if Filip prefers it.
5. The balance caret becomes a real menu, note 9. Each coin with its balance, a Wallet link, full
   keyboard and Escape. Variants 1 and 3. The kit is empty, so it is built new and added on accept.
6. Orange primary at every site in the list at the end of this file, note 3, after the board pick.
   Two edit points carry most of it, the `primary` variant of `Button` and the tones of
   `KitButton`. Each listed call site is then set one by one, never a sweep.
7. Variant 2 leaves, note 18. Its route, its switcher entry and its folder go. The code stays in
   git at f8ced30.

### Variant 1, Social lagoon

8. The menu button leaves, note 1, in variants 1 and 3.
9. Recent wins fills the row at 1440 and 1920, note 13, from enough entries in the shared data.
10. All games shows whole rows at each width, with View all for the rest, note 11.
11. Latest bets drawn under the D1 chrome, after the trading table in the reference. Header in one
    sunken bar, rows split by space, numbers right aligned, profit as a coloured number, note 11.
12. The top block per D2.

### Variant 3, Rank road

13. Rank card spacing, note 20. Room between the big number, the bar and the row under it.
14. The rest per D3.

### Variant 4, Casino floor

15. Layout stays, note 25. Chrome per D1, buttons, type and hover from the shared lines.

### Variant 5, Quiet vault

16. Per D4, with Checkout orange from line 6.

## Order of work

- The two boards go out first and stop for Filip's numbers.
- While they wait, lines 3, 4, 5, 7, 8 to 11, 13 and 15 run, plus any D line he has answered.
- Builders split by folder, one per variant, each in its own worktree, after the shared kit lines
  land on the session branch. Their work comes across by cherry pick only.
- After the picks, line 6 and the rest of the D lines.
- Self check per build recipe step 4, before and after shots at 1440 and 1920 with `--interact`,
  `baselint.mjs`, the screens, flows and money suites, then `/uireview` once on the round.

## Orange primary, every site it applies

Listed per the app-wide flow. Nothing changes until Filip answers yes, a narrower scope or a skip.
Variant 2 sites are left out since it leaves.

### Turns orange, product screens (gold today, through `Button` primary)

- components/shell/Sidebar.tsx line 117, See rewards
- features/account/parts.tsx line 18, Save changes
- features/auth/LoginPage.tsx line 138, Log in
- features/auth/RegisterPage.tsx line 262, Continue and Create account
- features/landing/LandingPage.tsx line 139, Register account
- features/landing/LandingPage.tsx line 316, Play now
- features/lobby/LobbyPage.tsx line 209, Join the giveaway
- features/money/AgentPage.tsx line 597, Verify identity
- features/money/AgentPage.tsx line 639, Continue and Confirm send
- features/money/GiftCardsPanel.tsx line 105, Redeem code
- features/money/TipPanel.tsx line 394, Verify identity
- features/money/TipPanel.tsx line 422, Continue and Send tip
- features/wallet/PaymentFlow.tsx line 182, the step's primary label
- features/wallet/steps.tsx line 113, Verify identity

### Turns orange, variants (purple or gold today)

- features/variants/kit/parts.tsx line 306, Deposit beside the balance, variants 1 and 3
- features/variants/kit/parts.tsx line 311, the square Deposit, same pill
- features/variants/v1/Variant1.tsx line 181, Play Sugar Rush
- features/variants/v1/Variant1.tsx line 368, Join the giveaway
- features/variants/v3/Hero.tsx line 60, Remind me when it opens
- features/variants/v3/Race.tsx line 121, Claim
- features/variants/v4/Shell.tsx line 185, Deposit
- features/variants/v5/Giveaway.tsx line 39, Join the giveaway
- features/variants/v5/QuickDeposit.tsx line 234, Checkout

### Stays purple, not the primary action of its view

- features/variants/kit/Boards.tsx line 70, the selected bets tab
- features/variants/kit/ChatPanel.tsx lines 64 and 109, Hide the chat and Send
- features/variants/v1/Variant1.tsx line 80, the weekly race arrow
- features/variants/v3/Games.tsx line 43 and v5/Games.tsx line 38, play squares on Continue rows
- features/variants/v5/BalanceCard.tsx line 141, Withdraw
- features/variants/v5/QuickDeposit.tsx line 219, Apply promo code
- Empty and error states, Try again, Clear the search and Clear filters, at v1/Variant1.tsx lines
  270 and 283, v3/Games.tsx lines 135 and 148, v4/Finder.tsx lines 122 and 135, v5/Games.tsx lines
  97 and 110

### Stays gold, not an action

- Five `bg-gold` badges and dots, the wallet count in the product sidebar and in variants 1, 3 and
  4, and the notification dot.
