# lusty-lagoon

Brand rules for Lusty Lagoon, a tropical crypto sweepstakes casino. Filip's own earlier piece,
now being refurbished, landing page and product. Lines marked "Filip to add" are not on file yet.

## Brand

Sampled from the Figma file on 2026-10-19, since it defines no variables or styles. Tokens live in
`lusty-lagoon/src/styles/tokens.css`. Contrast is measured on panel.

| Token | Hex | Job |
|---|---|---|
| page | `#140C23` | Page ground, sidebar and top bar |
| sunken | `#181028` | Inputs, table head, code values |
| panel | `#1E1232` | Cards and panels |
| raised | `#2A1C45` | Hover, selected card, active nav item |
| line | `#3A2A5A` | Decorative edges |
| field | `#7A64A3` | Input edges, 3.52 to 1 |
| ink | `#FFFFFF` | Text, 17.68 to 1 |
| ink-2 | `#B293C6` | Secondary text, 6.64 to 1, from the Figma |
| ink-3 | `#9D86C2` | Muted text, 5.58 to 1, replaces the Figma `#8A6FB1` at 4.20 |
| brand | `#8D26E7` | The wordmark's purple copy only |
| accent | `#B47CFF` | Selection, focus ring, active tab, progress fill, 6.12 to 1 |
| gold | `#F4D543` | Primary action, once per view, dark text `#1A0F2B` at 12.59 to 1 |
| tonal | `#3B2366` | Secondary action, edge `#5E4785` |
| pending | `#F19920` | Pending, from the Figma chip |
| success | `#3DD68C` | Completed, money in |
| danger | `#FF7A88` | Declined, errors |

Type. Bai Jamjuree 600 and 700 for display and the wordmark. Switzer 400 to 700 for UI text. Both
self-hosted in `lusty-lagoon/public/fonts`. Exo 2 appears in a few Figma labels and is not carried.

Logo. The wordmark is LUSTY over LAGOON, Bai Jamjuree Bold uppercase, LAGOON set in by 12px, a
white to ice blue fill, and a hard brand purple copy 2px below. The Figma's soft glow layers are
dropped. Clear space, Filip to add.

Radius 8 on controls and chips, 12 on cards, 16 on panels. No gradients on repeated surfaces, no
text glow, no bevels, no inset shadows, per the taste log.

## Rules that never bend

Filip to add.

## Accessibility

WCAG 2.2 AA, the studio default. Known failures in the source design, Filip to confirm.

## Reference

Figma file Lusty Lagoon Casino, page Design (node 83-53), read 2026-10-19.
https://www.figma.com/design/MjPhupcafS4TyCyssMHTjU/Lusty-Lagoon-Casino?node-id=83-53

- Section Dashboard Designs Desktop holds 22 frames at 1440. Landing page, Dashboard (the lobby),
  Login, Register steps 1 and 2, Wallet in 8 states across Deposit, Withdraw and Gift card, Tip,
  Gift Cards, Notification Example, Refer a friend, Send to Agent, Account Settings in 4 states.
- Section Mobile Designs holds 24 frames at 440, the same screens plus Sidebar Menu Open.
- Section Components holds the shared parts.
- The page Wireframes is an older pass and not the reference.
- No live site on file.

## Widths

1440, 1920

## Run

- Code lives in `lusty-lagoon/` at the repo root.
- `npm ci`, then `npm run build`, then `npx vite preview --port 4173`. Base URL `http://localhost:4173`.
  Filip reviews with `npm run live`, which serves on 5173 and pulls the session branch every 8s.
- Routes to shoot `deposit=/wallet/deposit,withdraw=/wallet/withdraw,kit=/kit`.
- Deep links for every state. `?pick=<coin or method>&step=<send|amount|details|review|status>`,
  plus `amount`, `address` and `network`. `step=status` runs the flow to its end on load.
  `?outcome=declined` declines card deposits. `?access=locked` locks withdrawals.
  `?history=loading|error|empty|large` sets the transaction table state.
- Nothing moves on its own except status timers, which `step=status` skips, so shots are stable.
- Vercel previews are on hold, so Filip reviews the pushed commit on his own localhost.
