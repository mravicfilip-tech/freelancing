# Varntix dashboard, source audit

Phase 1 of varntix-1, read only. Source file https://www.figma.com/design/rzv5g0IB5v0RKTBwWjWxI4/Varntix,
Dashboard page 55-728, read on 2026-10-07 through the Figma plugin API and screenshots. Nothing in
the file was changed. Node ids are written with a hyphen, as in a Figma link.

Reference shots of every current frame are in `source/desktop/` and `source/phone/`, named
`<order>-<screen>-<node id>.jpg`.

## 1. What is on the page

86 top level nodes and 8,196 layers. The canvas is laid out in labelled bands.

| Band | Where | What sits there |
|---|---|---|
| Components | label 6767-4481, top left | The few components the file has, with hand written captions |
| Redesign, Desktop | label 6767-2229 | One row of 1920 screens, a second row under some of them for a second state |
| Deposit Flow, Desktop | label 6767-10824 | The wallet screens, with the two dropdown menus beside them |
| Redesign, Mobile | label 6777-11226 | One row of 440 screens under their desktop twins |
| Deposit Flow, Mobile | label 6777-12056 | The phone wallet screens |
| Pop-Up | label 6767-6889 | Two sections of dialogs |

### Desktop screens, 1920

| Frame | Id | Size | Status | What it is |
|---|---|---|---|---|
| Dashboard | 6767-1586 | 1920 x 1224 | Current | Home. Balance, portfolio tiles, holdings gauge, APY and payout tiles, positions table, markets table, promo banner, media list |
| Dashboard | 7873-1373 | 1920 x 1224 | Stale duplicate | Same 477 layers and the same render as 6767-1586. Ignore |
| Invest | 3657-646 | 1920 x 1869 | Current | Titled Savings. Fixed rate cards, flexible rate cards, sold out cards |
| Frame 1597886241 | 7714-9436 | 1408 x 499 | Newer content, see question 3 | Flexible cards with Starter, Growth and Premium Yield copy |
| Investment Single Strategy | 3781-1147 | 1920 x 1439 | Current | Titled Savings. Order form, growth chart, payout schedule, investment scenario |
| Transactions | 6778-14528 | 1920 x 1175 | Current | Two total tiles with ring art, filter bar, transactions table |
| Deposits & Withdrawals | 7640-6906 | 226 x 110 | Current, a component | The table's type dropdown, two variants |
| Group 2147230152 | 7640-6943 | 72 x 526 | Exploration | A loose column of "Fixed 9.8%" labels |
| Referral | 6767-2840 | 1920 x 1585 | Current | Refer and earn steps, fees chart panel (empty), leaderboard, referral link, activity summary |
| Documents Screen | 6767-2230 | 1920 x 1088 | Current | Filter, search and four folder rows |
| Assets | 6767-2374 | 1920 x 1080 | Current | Assets table with Confirm and Redeem actions |
| Assets | 6778-15470 | 1920 x 1080 | Current, second state | The same table blurred behind the Confirm Early Redemption dialog. Not a duplicate |
| User Profile | 6767-3137 | 1920 x 1348 | Current | Setup stepper, personal details, receiving wallet, residency, password, two factor |
| Create Account | 6767-4273 | 1920 x 1080 | Current | Auth layout, photo panel left, form right |
| Login | 6767-4336 | 1920 x 1080 | Current | Same layout |
| Step 8.2 | 6767-4382 | 1920 x 1080 | Current | SMS code dialog over the auth layout |
| Step 9 | 6767-4441 | 1920 x 1080 | Current | Final step, names, phone, country, password |
| Deposit Step 1, Choose Path | 6767-4021 | 1920 x 1160 | Current | KYC limit notice, three deposit methods |
| Deposit Step 2, Web3 Wallet | 6767-3355 | 1920 x 1160 | Current | Currency, network, wallet balance, amount, promo |
| Deposit Step 2, Card Transfer | 6767-3735 | 1920 x 1160 | Current, see question 4 | Labelled Step 3 out of 3 on the screen. You pay, you receive, fees |
| Withdraw | 6767-3554 | 1920 x 1160 | Current | Balance, currency, network, amount, wallet address, 2FA code |
| Choose Currency | 6777-12059 | 352 x 357 | Current | Currency menu, open |
| Network | 6777-12107 | 352 x 243 | Current | Network menu, open |
| Unverified | 6815-2964 | 671 x 64 | Current, a state | The Unverified chip that replaces Verified on the home |

### Phone screens, 440

| Frame | Id | Twin of |
|---|---|---|
| iPhone 16 Pro Max 62 | 4586-291 | Dashboard |
| iPhone 16 Pro Max 61 | 3818-716 | Invest |
| iPhone 16 Pro Max 60 | 3818-276 | Investment Single Strategy |
| iPhone 16 Pro Max 75 | 6777-11257 | Transactions |
| iPhone 16 Pro Max 28 | 2273-3940 | Referral |
| iPhone 16 Pro Max 29 | 2273-4116 | Documents |
| iPhone 16 Pro Max 30 | 2273-4149 | Assets |
| iPhone 16 Pro Max 80 | 6778-15700 | Assets with the redemption dialog |
| iPhone 16 Pro Max 35 | 2492-1830 | User Profile |
| Create Account | 6777-11392 | Create Account |
| Login | 6777-11537 | Login |
| iPhone 16 Pro Max 76 | 6777-11584 | Step 8.2, code |
| STEP 2, Verification pop up | 6777-11639 | The code dialog by itself |
| Create Account | 6777-11451 | Step 9, final step. Misnamed |
| iPhone 16 Pro Max 77 | 6777-11708 | Deposit step 1 |
| iPhone 16 Pro Max 78 | 6777-11821 | Deposit step 2 |
| iPhone 16 Pro Max 79 | 6777-11888 | Deposit step 3 |
| withdrawal | 6777-11482 | Withdraw |
| Choose Currency, Network | 6778-29446, 6778-29494 | The two menus, same size as desktop |
| iPhone 16 Pro Max 17 | 6767-4834 | A component. The phone menu sheet |

### Dialogs, Pop-Up band

| Dialog | Id | Sizes drawn |
|---|---|---|
| Order Details, with agreement checkbox and Confirm | 6822-3927, 6822-3820 | 619 desktop, 430 phone |
| Subscription done successfully | 6824-3998, 6824-4308 | 619, 430 |
| Order placed, send to this address, QR, expiry timer | 6798-2818 | 421 |
| Payment successful | 6798-2759 | 421 |
| Almost there, verify identity | 6798-2784 | 421 |
| Finish setting up account | 6798-2801, 7746-1372 | 421, 416 |
| Forgot your password | 6798-2899, 6777-11687 | 421, 409 |
| Enter code before completing withdrawal | 7408-8615 | 416 |
| Confirm early redemption | inside 6778-15470 | about 380 |

### Loose nodes that are not screens

Logo tiles Vantix, 1115 and 1114 (7466-3462, 7466-3457, 7466-3452) are app icon explorations.
Frame 9 (6815-3077) is another copy of the Unverified chip. Check (6798-2063) is a green check
badge. Frame 1597886405 (7714-10179) is the Starter Yield head row on its own.

## 2. How the frames are built

| Measure | Count |
|---|---|
| Layers on the page | 8,196 |
| Frames with default names such as Frame 2147230489 or Group 1597884977 | 1,720 of 2,199 |
| Groups | about 1,390, 101 in the Dashboard frame alone |
| Instances | 169 across the page. The Dashboard frame has 2 |
| Fills bound to a variable or a style | 0 |
| Variables | 4, all text strings in a collection called Button text |
| Paint and effect styles | 0 and 0 |
| Text styles | 24, 12 Dashboard and 12 Website, all Noto Sans |
| Text layers without a text style | 91 of 118 on the Dashboard frame, 63 of 122 on Investment Single Strategy |
| Text below 12px | none |

Every screen root is a fixed frame filled `#070707` with a radial ellipse glow as its first child.
Inside, about half the frames use auto layout and the rest are absolute groups. Nothing would
survive a content change, which is why the rebuild goes through code first.

The components that exist are mostly buttons, and several overlap.

| Component | Id | Variants |
|---|---|---|
| Button Popup flow step | 7397-6929 | Disabled, Full Color, Conditional, Hover, Clicked, each Desktop and Mobile |
| Button Popup flow step | 7404-7853 | Default, Hover. A second set with the same name |
| Button Popup flow step | 7407-6910 | Default, Hover. A third set with the same name |
| Button Desktop Flexible | 7404-7643 | Default, Hover, Clicked, Disabled, for Fixed and Flexible, Desktop and Mobile |
| 1 | 7404-7714 | Default, Hover, Clicked, Disabled in Default, Yellow, Grey and Red. The table action chips |
| Button Blue | 7408-8240 | Default, Hover, Clicked |
| Button Desktop Fixed | 6767-4484 | One |
| Deposits & Withdrawals | 7640-6906 | Two |
| Desktop side panel | 6767-4836 | One. The nav rail, not used as an instance on most screens |
| iPhone 16 Pro Max 17 | 6767-4834 | One. The phone menu |
| Group 1597885000 | 6767-4540 | One. The logo lockup |

## 3. Values actually used

Counts are layers or text runs across the current frames.

### Colour

Surfaces are white at low alpha over a near black ground. The brand colours are few.

| Value | Uses | Where | Proposed token |
|---|---|---|---|
| `#070707` | every root, 157 fills at 40% | Page ground, dark glass panels | `bg`, `surface/glass` at 40% |
| `#000000` | 68 | Deep panels, auth form side | `bg/deep` |
| `#121213`, `#171717`, `#262626` | 42, 6, 13 | Solid panels and tracks | `ink/100`, `ink/200`, `ink/300` |
| White at 3, 4, 5, 6% | 285 | Cards and fields | `surface/1` at 4% (3 and 5 snap here) |
| White at 8, 9, 10, 12% | 124 | Raised tiles, hovered rows | `surface/2` at 10% |
| White at 20, 30, 35% | 45 | Selected tiles, glass rims | `surface/3` at 30% |
| `#7DCD85` | 60 fills, 110 text runs, 56 strokes | Positive figures, flexible products, active tab, open status | `green/500`, role `positive` |
| `#7DCD85` at 12 and 50% | 35 | Chip and glow tints | `positive/tint` at 12% |
| `#3D503F`, `#182119` | glows, swatch | Green depth | `green/800`, `green/950` |
| `#DAC197` | 25 fills, 53 text runs, 23 strokes | Fixed products, the gold accent | `gold/400`, role `accent` |
| `#DAC197` at 10, 12, 15% | 29 | Gold tints | `accent/tint` at 12% |
| `#B18A63`, `#AC9165` | 18 text, 3 fills | Bronze rank and gold depth | `gold/600` |
| `#4374FA` | 16 fills, 30 strokes | Blue buttons, Verify Now, Invite | `blue/500`, role `action`, see question 7 |
| `#53A7FF` | 44 text runs | Links | `blue/400`, role `link` |
| `#BE6D6E` | 21 text runs, 14 strokes | Negative change, Redeem, Canceled | `red/400`, role `negative` |
| `#B34D4E` | 6 text runs | A second red | snap to `red/400` |
| `#707070` | 359 strokes, 25 text runs | Table rules and dim labels | `border/strong` as a stroke only |
| White at 10, 12, 15% | 234 strokes | Card and field edges | `border/subtle` at 15% |
| `#D9D9D9` at 5 and 50% | 165 strokes | Dividers in tables | snap to `border/subtle` |
| `#888888`, `#848484`, `#A3A3A3` | 61 text runs | Muted copy | snap to `text/tertiary` |
| `#3E73C4`, `#59AF99`, `#627EEA`, `#C1CCF7`, `#8198EE`, `#9071F1`, `#B22234` | 150 | Coin, network and flag art | Brand art, never tokens |

Text colour clusters into four steps.

| Step | Source values | Proposed |
|---|---|---|
| `text/primary` | white | white |
| `text/secondary` | white at 60, 64, 65, 72, 75, 80% | white at 65% |
| `text/tertiary` | white at 50%, `#888888`, `#848484` | white at 50% |
| `text/disabled` | white at 40%, `#707070`, `#D7D7D7` at 30% | white at 40%, disabled only |

Gradients. 34 distinct. The common ones are the card face, `#7D7D7D` to `#0D0D0D` (176 uses), the
radial glows in green, grey and gold behind panels (140), and the dark card face `#373737` to
`#131314` (29). The rim on glass cards is an angular gradient stroke used 82 times. These become
three named tokens, `gradient/card`, `gradient/card-dark` and `gradient/rim`, plus the page ground
glow as one component, like the Earn dot grid.

### Type

All UI text is Noto Sans, with Noto Sans Display for some button labels and figures. 38 distinct
combinations reduce to the ramp below. Tracking is minus 4% on almost everything at 14px and
below, 0 on figures.

| Source | Runs | Proposed style |
|---|---|---|
| 14 Regular, auto, minus 4% | 1,457 | `Body/14` |
| 14 Display Regular, Display Medium | 35 | `Label/Button 14` |
| 12 Medium, minus 4% | 112 | `Label/12` |
| 12 Regular, 12 SemiBold | 75 | `Caption/12` and `Caption/12 strong` |
| 16 Regular, Display Medium 16 | 12 | `Body/16` |
| 18 Regular, minus 4% | 128 | `Heading/Card 18` |
| 18 Regular at 100% line, 0 tracking | 62 | `Heading/Card 18` (snapped) |
| 18 Display Regular, Display Light | 68 | `Label/Button 18` |
| 20 Regular, 0 tracking | 73 | `Number/20` |
| 24 Regular, 24 Medium | 8 | `Heading/Page 24` |
| 32 Regular | 6 | `Number/32`, the holdings and balance figures |
| 36 Regular | 4 | `Display/36`, auth headings |

Line height is "auto" on 90% of runs. The proposal sets 1.2 on headings and figures and 1.45 on
body, which moves text by 1 to 3px per line. That is the one place the build will not match the
source pixel for pixel.

Three other families appear and should not survive.

- Darker Grotesque is the Varntix wordmark, set as live text on every screen. It becomes the
  vector logo.
- Open Sans sets the avatar initials JD, the stepper numbers and the +44 prefix. These move to
  Noto Sans.
- Manrope sets the APY figures on the Invest cards only. The newer card frame 7714-9436 uses Noto
  Sans. See question 5.

### Radius

| Source | Uses | Proposed |
|---|---|---|
| 3, 4, 5 | 70 | `radius/xs` 4 |
| 6 | 255 | `radius/sm` 6 |
| 8, 9 | 101 | `radius/md` 8 |
| 10.4, 12 | 579 | `radius/lg` 12. The 10.4 values are scaled copies of 12 |
| 16, 18, 20, 22 | 98 | `radius/xl` 20 |
| 74, 91, 113 | 59 | `radius/full` |

### Spacing

52 distinct gaps and 48 padding sets. The common gaps are 10, 12, 17, 18, 20, 24 and 32. 141 is a
table column spread, not spacing.

Proposed scale, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64. Snaps 13 and 14 to 12, 17, 18 and
19 to 16, 25 to 30 to 24, 42 and 45 to 40. Paddings 12 by 16, 6 by 16, 3 by 14 and 8 by 22 are the
control paddings and map to the button and chip sizes.

### Strokes

1 (1,166 uses), 1.5 (99) and 2 (27). The fractional weights are scaled instances and snap to 1.

### Effects

77 distinct effects. They reduce to six.

| Source | Proposed |
|---|---|
| Background blur 10, 13.5, 15 | `Glass/10` |
| Background blur 20, 25, 33.6 | `Glass/20` |
| A five layer drop shadow in `#919191` at 0 to 5% | `Elevation/Card` |
| Inner shadows white 15% at 0,3 and 0,minus 3 | `Edge/Glass`, the glass button rim |
| A five layer inner shadow in `#363F3F` | `Edge/Panel depth` |
| Drop and inner glow `#8EDD23` at 2.9 | `Glow/Live`, the verified and open dot |
| Layer blur 76 on the ellipses | not an effect style, part of the page ground component |

## 4. Contrast, WCAG 2.2 AA

Measured on the page ground `#070707`, the card `#111111` and the field `#1D1D1D`.

| Pair | Ratio | Verdict |
|---|---|---|
| White at 50% on card | 5.3 to 1 | Pass |
| White at 40% on card, 106 runs, mostly placeholders and labels | 3.8 to 1 | Fail |
| `#707070` text on card, 25 runs | 3.8 to 1 | Fail |
| `#D7D7D7` at 30% on ground, 36 runs | 2.1 to 1 | Fail |
| `#B34D4E` on card, 6 runs | 3.7 to 1 | Fail |
| White label on `#4374FA` button | 4.1 to 1 | Fail at 14px |
| `#BE6D6E` on card | 5.0 to 1 | Pass |
| `#53A7FF` link on card | 7.5 to 1 | Pass |
| Green and gold on card | 9.8 and 10.8 to 1 | Pass |

## 5. Components the system needs

In build order, with where each appears and the states the screens actually show.

1. Marks. The Varntix logo lockup and mark, coin marks (BTC, ETH, BNB, XRP, USDC, USDT, SOL),
   network marks, payment marks (Visa, Mastercard, Apple Pay, MetaMask, WalletConnect, Google,
   Apple), flags. Every screen.
2. Icons. Nav icons for the ten rail items, header icons (profile, wallet, log out), back, close,
   copy, share, paste, filter, calendar, search, chevron, info, gift, folder, check, eye, menu.
3. Buttons. Primary blue, Fixed (gold), Flexible (green outline), Glass neutral (Continue, Next
   Step, Save Changes, Load more), Secondary (Previous Step, Cancel), Social sign in (Google,
   Apple, WalletConnect), Table action chips in green, red and grey (the "1" set), icon buttons,
   text link. States default, hover, pressed, disabled, plus loading, which the file never drew.
4. Chips and tags. Tile tags (Cash, Activity, PNL), product tags (Fixed, Flexible), APY chip,
   status with dot (Open, Closing, Pending, Completed, Canceled), Insights tag, Verified and
   Unverified, change pill up and down, Sold Out, Preferred by our users.
5. Inputs. Text field with label, select with a coin or network mark, phone field with flag,
   password with eye, six box code input, amount field with an inline action (Apply, Paste, Copy),
   search, date trigger, filter trigger, checkbox, and the open menus Choose Currency and Network.
   States default, focus, filled, invalid, disabled. Invalid was never drawn.
6. Navigation. Desktop rail with item default and active, account card, top bar (back, title,
   three icon buttons), phone top bar, phone menu sheet, underline tabs (Deposit, Withdraw),
   segmented control (1m, 1y, All Time), step counter (Step 1 out of 3), setup stepper (Create
   account, personal details, ID verification), referral steps.
7. Cards and tiles. Panel card, stat tile with tag, balance row, holdings gauge, total tile with
   ring art, promo banner, media list item, product card (fixed, flexible, sold out), deposit
   method card (default, selected), chart card with legend, scenario tile, leaderboard row,
   activity summary row, document row.
8. Tables. Header, row, status cell, action cell, Load more, and the stacked phone row.
9. Dialogs. Shell with close and optional back, halo icon header, and the nine dialogs listed in
   section 1.
10. Page ground and layouts. The glow ground, the app shell (rail plus content), the auth layout
    (photo panel plus form).

## 6. Screens and states the build needs

Drawn means the file has it. Not drawn means the app needs it and the build will make it from
the system without new styling.

| Route | Drawn states | Not drawn |
|---|---|---|
| Dashboard | Verified, full data | Unverified (the chip exists), no positions, loading |
| Savings list | Fixed, flexible, sold out | Loading |
| Savings plan | Form, chart, schedule, scenario | Invalid amount, below minimum |
| Order details, subscription done | Both dialogs | Agreement not ticked |
| Wallet, deposit | Step 1, Web3 step 2, Card step, order placed with QR, payment successful | Crypto transfer step 2, insufficient balance, invalid promo code |
| Wallet, withdraw | Form, email code dialog | Invalid address, wrong code, over the KYC limit |
| Assets | Table, early redemption dialog | No assets |
| Transactions | Table, type menu | No transactions, no filter match |
| Referrals | Full data | Fees chart (the panel is empty in the file), no referees |
| Documents | Four folders | Folder open, no match |
| Profile | All sections | Saved, invalid, 2FA enabled |
| Login, Create account, code, final step, forgot password | All drawn | Invalid email, wrong code, password mismatch |
| Bonds, Support, Settings | Rail items only | Whole screens, see question 2 |

## 7. Copy and data errors in the source

Fixed in the build unless Filip says otherwise.

- The rail marks Dashboard active on every screen.
- The Invest frame is titled Savings, the phone menu calls it Invest, and the rail calls it
  Savings.
- The phone wallet screens are titled Direct Wallet Payment, desktop says Wallet.
- USDC is priced $86,355.80, the same figure as XRP.
- Typos. "Perosnal" twice, "Residencce", "Accural", "Not code yet?", "Shar 1oz of Silver", "Earn
  metalsfor life", "Buton Savigns".
- Phone referral steps say "Shar 1oz of Silver" and "Earn metals for life" where desktop says
  "Get paid when they invest" and "Earn commissions".

## 8. Open questions for Filip

Each has a default. Reply "yes" to take them all, or correct one line.

1. Phone menu has a moon icon for a theme switch. Default is to drop it, per the Dark only
   ruling.
2. Bonds, Support and Settings are in the rail with no screens. Default is Settings opens User
   Profile, and Bonds and Support show a coming soon panel built from the existing card and empty
   state parts.
3. The Invest frame shows three cards all named Growth Yield. The newer frame 7714-9436 names them
   Starter, Growth and Premium Yield with different limits and payout frequencies. Default is the
   newer copy.
4. The deposit paths have different step counts. Web3 is labelled step 2, Card is labelled step 3
   with no step 2, and Transfer Crypto has no step 2 at all, only the order placed dialog. Default
   is three steps for every path, step 1 method, step 2 the path's own form as drawn, step 3 the
   confirmation dialog (order placed with QR for crypto, payment successful for the others).
5. APY figures on the Invest cards are Manrope. Default is Noto Sans, as on the newer card frame.
6. The primary action has four treatments. Blue in dialogs and Verify Now, gold Subscribe on
   fixed products, green outline Subscribe on flexible products, glass neutral on form submits.
   Default is to keep all four, each with its own job, named `action`, `fixed`, `flexible` and
   `neutral`.
7. Contrast fails in section 4. Default is placeholders and labels at white 50% (5.3 to 1), the
   `#707070` and `#D7D7D7` text moved to `text/tertiary`, `#B34D4E` snapped to `#BE6D6E`, and the
   blue button fill darkened to `#3B6AF0` (4.7 to 1) while `#4374FA` stays the brand blue for
   rings and icons.
8. Line heights move from auto to 1.2 and 1.45, so text shifts 1 to 3px against the source.
   Default is yes.
