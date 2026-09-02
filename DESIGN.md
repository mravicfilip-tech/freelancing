# Hero design plan

Brief: Remittix presale landing hero. Crypto in, local currency out, paid into
bank accounts in 30+ countries. Light `#EDEFF1` page with a dot grid, ink
`#111214`, indigo `#4B4BF7`, lime `#D9F24E` used sparsely. Reference the
client likes: a mid-grey dotted globe with tight orbits carrying real coin
logos, no pointer parallax, nothing that reads as templated.

## Tokens

Colour

| name    | hex       | job |
|---------|-----------|-----|
| bg      | `#EDEFF1` | page and hero ground |
| ink     | `#111214` | headline, primary button, wordmark |
| body    | `#5B636B` | paragraph text (darker than the old `#8A8F98`, which failed contrast at 18px) |
| globe   | `#7C858D` | the dots |
| hairline| `#C4C8CD` | orbit rings, rules, stage border |
| indigo  | `#4B4BF7` | spent once per direction: the primary action (1, 3) or the coin pulse (2) |
| lime    | `#D9F24E` | corner marks and the live countdown dot only |

Type: one family per direction, self-hosted variable fonts.

| direction | family | display | body |
|-----------|--------|---------|------|
| 1 Ledger  | Instrument Sans | 600, -0.04em, 0.95 lh | 400, 18/1.5 |
| 2 Orbit   | Bricolage Grotesque | 500, opsz 96, -0.03em | 400, 18/1.55 |
| 3 Stage   | Schibsted Grotesk | 600, -0.035em | 400, 17/1.55 |

Line length under 70 characters everywhere.

## Layout concepts

1. Ledger, left-aligned two-column. Copy in the left 5/12, globe large on the
   right with air on all sides. The countdown becomes one quiet line under the
   actions with a live lime dot.

```
Remittix        How it works   Coverage        [Join the presale]

Send crypto.                       .  .  .  .
It arrives as money.            .  o  o  o  o  .
                               .  o  o  o  o  o  .
paragraph, under 70ch          .  o  o  o  o  o  .
[Join the presale]  How it works   .  o  o  o  .
• Presale closes in 42 days           .  .  .
```

2. Orbit, centred, planet rising. Headline and one paragraph centred, action
   beneath, then the globe sits low and large and is cut by the bottom of the
   hero so it reads as a horizon. Indigo lives in the coin pulse, the button is ink.

```
              Pay any bank account
               from your wallet.
                 paragraph
              [Join the presale]
            .  .  o  o  o  o  .  .
          .  o  o  o  o  o  o  o  .
─────────o──o──o──o──o──o──o──o──o────── hero edge
```

3. Stage, product window. Copy left; on the right the globe sits inside one
   white panel with a hairline border, and a short live list of settled
   transfers runs along the panel's foot. The panel is the product, not a card.

```
Crypto to bank,        ┌──────────────────────┐
in minutes.            │      .  o  o  o  .    │
paragraph              │    o  o  o  o  o  o   │
[Join the presale]     │      .  o  o  o  .    │
                       │ BTC→NGN Lagos 38s ... │
                       └──────────────────────┘
```

## Principles

- One memorable object: the globe with coins in transit. Everything else is quiet.
- No eyebrow label, no single accented word, no arrow glyphs in buttons, no
  big-number stat row. Numbers live inside sentences.
- Motion: the globe turns and the coins orbit. That is the only motion. No
  pointer parallax, no per-section entrances.
- Indigo is spent exactly once per direction.

## Review against the brief and the generic defaults

What the previous hero did that reads as a template: a tracked-out all-caps
eyebrow, one word of the headline in the accent colour, `→` appended to the
primary button, a three-up big-number stat row, system font stack, and a
pointer parallax. All removed. The single-word accent was in the original
brief, so its removal is a deliberate deviation made at the client's request
for a less generic page.

What stays because it is brand, not default: the `#EDEFF1` ground with its dot
grid, the ink black, and the lime corner marks.

Coin badges get drawn logos (ETH diamond, BTC, Tether, USDC) with a soft
shadow so they read as tokens, not glyph pills.
