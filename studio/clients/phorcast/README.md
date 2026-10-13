# phorcast

Brand rules for Phorcast. Facts here come from the Phorcast repo (`mravicfilip-tech/phorcast`) at
commit `932bbf5`, from `src/styles/tokens.css`, `docs/DESIGN-SYSTEM.md`, `HANDOVER.md` and
`docs/KNOWN-ISSUES.md`. Lines marked "Filip to add" are not on file yet.

## Brand

Dark theme is the default. Light theme follows the system until the visitor picks one.

| Token | Dark | Light | Job |
|---|---|---|---|
| page | `#0f0e0d` | `#fffbf8` | Page ground |
| panel | `#1b1b1a` | `#f7f0ea` | Raised panels |
| panel-2 | `#2b2928` | `#ece1d9` | Inactive bars, tracks |
| line | `#313131` | `#e3d6cb` | Hairlines |
| ink | `#fffbf8` | `#1a1512` | Headings, nav |
| ink-2 | `#9d9d9d` | `#5e5651` | Body copy |
| ink-muted | `#626262` | `#7a716c` | Eyebrows, quiet labels |
| accent | `#e5331e` | `#a21605` | Brand red, text or fill |
| accent-deep | `#c02816` | `#7e0202` | Gradient dark stop, pressed |
| accent-lift | `#e9513f` | `#c4361c` | Gradient light stop, hover |
| on-accent | `#fffbf8` | `#fffbf8` | Label on the red, never flips |
| pos | `#15a456` | `#0b6e37` | Price up |
| neg | `#a21605` | `#b01309` | Price down, errors |

Type, six sizes, client approved.

| Role | Size | Face and weight |
|---|---|---|
| Display, the h1 | fluid, 28 to 100px | Manrope 500, line height 0.9 |
| Section heading | 32px, 28px at 720 and below | Manrope 500 |
| Card heading | 18px | Manrope 500 |
| Paragraph | 18px at every width | Inter Tight 300 |
| Label, eyebrows and buttons | 16px | Galano Grotesque 500 and 600, files not supplied yet |
| Small | 14px | per call site |

Shape. Pill radius 400px. Primary button 254 by 50px. Content column 1440px.

Logo. A line-drawn 3D mark (`HeroLogo`, three.js) with a static SVG fallback, and the wordmark
"Phorcast". It tilts toward the pointer, kept at the client's request. Clear space, Filip to add.

## Rules that never bend

- The brand is spelled Phorcast. A client screenshot once said "Phorecast", open question in
  KNOWN-ISSUES 1.7.
- No em dashes in any copy. Client feedback round, item 10.
- No bold sentences. Project lead, item 11.
- Paragraphs are 18px everywhere, one size per heading level. Item 12.
- Copy speaks of forecasting, not trading. The client moved the wording, KNOWN-ISSUES 1.5. Their
  footer strapline "Trade the outcome, not the asset." stays as supplied.
- Only claims the FAQ backs. No KYC, instant withdrawals, 60 seconds, self-custody, the token and
  the deposit bonus all conflict with the FAQ until the client answers, KNOWN-ISSUES 1.1 and 1.2.

## Accessibility

WCAG 2.2 AA. Known failures on the live site. The white link on the orange Bento card is about
2.5 to 1. Dark eyebrow grey `#626262` on `#0f0e0d` is 3.16 to 1, left as designed. Steps
auto-advances with no pause control. New work does not repeat any of the three.

## Reference

The live site phorcast-markets.vercel.app at commit `932bbf5`, captured 13 October 2026 from the
code, no shots on file yet. Figma file `aczG8te17zRGoK5wvirB92`.

## Widths

1440

## Run

The code lives in its own repo, `mravicfilip-tech/phorcast`, not in this one. Clone it beside this
repo. Node 22. `npm ci`, then `npm run dev` on localhost port 5173. `npm run check` runs typecheck,
lint and build. Routes to shoot are home=/ and about=/about. `/?slide=N` holds the hero on one
slide, so use it for shots. `scripts/deploy.sh` ships to production, so a preview goes out as a
plain Vercel preview deployment with the same account check. Preview project name, Filip to add.
