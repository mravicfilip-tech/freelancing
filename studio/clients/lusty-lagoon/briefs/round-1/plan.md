# Round 1 plan, lusty-lagoon

Built from the 8 notes in `notes.md` and the kickoff in the session thread, 2026-10-19. Status
proposed, waiting on Filip. "Go" approves every line below except the numbered decisions, which
each need their own answer.

## The diagnosis

Every note points at one cause. The 2024 design uses effects to do the work of hierarchy and
state. Gradients mark the selected payment method, glow and bevel mark the important button,
inner shadow marks the tabs, a cast shadow marks progress. Strip the effects one by one and the
result is a flatter copy of the same design, with the Visa problem still there. So the round
starts with a small system that carries hierarchy and state without effects, then the screens
are rebuilt on it.

## The system that replaces the effects

- Surfaces. Three flat steps of the brand purple, page, panel and raised, each a solid fill with
  a 1px border one step lighter. No gradient on any repeated surface. One low contrast gradient is
  allowed per screen, on the hero art only. Taste entry 11.54am.
- Text. No glow or text-shadow on any UI text. Hierarchy comes from size, weight and three text
  colours, primary, secondary and muted, each checked at 4.5 to 1 or better on its surface.
  Taste entry 11.55am.
- Buttons. One Button component for the landing page and the product. Primary is a solid gold
  fill with dark text, one per view. Secondary is a tonal purple fill with light text. Tertiary is
  text only. All three are flat, with one hover step, one pressed step and a visible focus ring.
  No sunburst, gloss, bevel or outer glow. Taste entry 11.59am, note 8.
- Selection. A selected card gets a 2px brand border, a check mark in its corner and the word
  Selected for screen readers, built on a Radix radio group. Never a gradient difference. This
  fixes note 1.
- Tabs. Radix Tabs, label plus a 2px underline on the active tab, no inset shadow. Note 2.
- Progress. A flat fill on a flat track, the number first and the bar second. No bevel, cast
  shadow, glow or particles. Note 3.
- Status. Flat chips with an icon and a word, Pending, Completed, Declined, never colour alone.
- Tokens. Sampled from the Figma frames into the client README first, since the file defines no
  variables. Everything else is built from those tokens only.
- Where it lives. A `/kit` route shows every part in every state. It doubles as the system
  slide of the case study.

## Case study scope

Note 8 says polish only what the case study shows. Proposed list, decision 1 below.

- In. The wallet payment flow end to end, the lobby, and the landing page.
- Out for now. Login, Register, Gift cards, Tip, Refer a friend, Send to agent, Notifications and
  Account settings. They stay in the sidebar and open a plain placeholder, so no click is dead.

## Order of work

1. Foundation. App scaffold in `lusty-lagoon/`, Vite, React, TypeScript, Tailwind and shadcn on
   Radix. Tokens, the parts above, the `/kit` route.
2. Screen one, the wallet payment flow. It is the hardest screen because it holds the most states
   and the user's money, and because 5 of the 8 notes land on it, notes 1, 2, 3, 7 and 8, the
   selection cards, the glowing tabs, the rank card, the buttons and the missing flow screens. Its
   sidebar and top bar then carry over to the lobby.
3. Screen two, the lobby, built from the kit.
4. Screen three, the landing page, built from the kit.

Each screen stops for Filip before the next one starts, per `/newui`.

## Screen one direction, the wallet payment flow

- Layout. Tabs across the top, Deposit, Withdraw, Tip and Gift card. Under them two columns. Left,
  7 of 12, the flow as one stepper, Method, Amount, Review, Status. Right, 5 of 12, a summary card
  that fills in as the player moves, method, amount, fee, amount received and arrival time.
  Transaction history runs full width below.
- Why. The old flow swaps the whole panel per step and never shows the fee or what arrives, only
  "average fee around 2 to 3%". The summary column answers "what happens to my money" at every
  step.
- Primary action. One gold Continue per step. Back is a tertiary text button.
- Data. Methods and times from the Figma, Mastercard and Visa arrive instantly, PayPal takes one
  day, Wire Transfer takes 1 to 3 days. Eight coins from the Figma, BTC, LTC, USDT, XRP, ETH, TRX,
  USDC and DOGE. Amounts are signed, plus for deposits and minus for withdrawals.
- Refuses. Character art inside the money flow, floating coin tiles, gradients, glow, and more
  than one gold button in view.

## Missing payment flow screens to make, note 8

The Figma covers method choice, coin or card choice, and the address or details form. It has no
amount step with a fee, no review step and no result. To show the flow whole, these get built.

- Amount, with the available balance, the fee in money and the amount received.
- Network, for coins that run on more than one chain, such as USDT, with a warning that the wrong
  network loses the funds.
- Review, one screen with every number and one Confirm.
- Status, pending with confirmations counting up, completed, and declined with a next step.
- The new row appearing in the transaction history.

## Conspicuous fixes that ride along, note 8

- The Withdraw tab copy says "Instantly deposit crypto" and "deposit your money". Rewritten for
  withdrawals.
- Every transaction row reads "+0.5 BTC", withdrawals included. Real, varied, signed amounts.
- The coin list labels XRP as "Binance" and Tron as "TRN". Corrected to XRP and TRX.
- The "150% sign-up bonus" card shows to a signed-in player holding 2,492 USDT. Decision 4.
- The landing FAQ holds survey questions such as "What type of casino games do you enjoy the
  most?". Rewritten as real questions about deposits, withdrawal times, coins, partner platforms
  and agents, in flat rows with dividers. Notes 6 and 7.

## Decisions for Filip, one answer each

1. Case study list. Default is the wallet payment flow, the lobby and the landing page, with the
   other screens as placeholders.
2. Layout. The character art leaves the wallet panel, where it takes about 460px above the
   actions, and stays on the lobby and the landing page. Default yes.
3. Layout. The landing page section Why choose Lusty Lagoon drops the six icon tiles and becomes
   three proof rows, each a sentence beside a real piece of the product, a payout row, a game
   tile, the coin list. No icon set. Default yes. Note 5.
4. Layout. The sign-up bonus card leaves the sidebar for signed-in players. Its slot shows the
   next rank reward instead. Default yes.
5. Note 4, the flying fragments. Which ones, the particles at the end of the progress bar, or the
   floating coin and currency tiles around the wallet cards and the art? No default, this needs
   an answer before the landing page and the lobby.
6. Deadline. The thread has none. When is the case study due?

## References

- Stake, the cashier. Coin and network picked in one place, address with a QR code and Copy, flat
  dark surfaces. The category leader, so the case study reads against it.
- Coinbase, send and receive. A network warning before the address, and a review step with the
  fee and arrival time.
- Revolut, transfers. Amount first with a live fee and an amount received line, then one review
  screen.
- Linear, dark UI. Depth from flat surface steps and 1px borders, no gradients.
- The brand README overrules every reference on palette, type and logo.
