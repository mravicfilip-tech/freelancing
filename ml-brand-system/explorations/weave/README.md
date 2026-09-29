# Symbol exploration via Figma Weave

State of the symbol work, so a new session can resume.

## Brief (agreed)
- Keep the bar graph from the old logo (`old-logo-reference.png`), but make it read as a capital M.
- Symbol stands alone next to the full wordmark "Maximum Leverage" (sentence case, Host Grotesk 400-500).
- Flat colour: Signal #E5261A on Carbon #0E0E0F. No gradients.
- Must hold at 16px, in round social avatars and in video.

## Principles for a bar-M
- Two full-height outer bars are the M's legs; right leg may be tallest (growth).
- Inner bar tops cut on diagonals to trace the V.
- Four bars rather than five; gap width equals bar width.

## Runs
- Batch 1 (Recraft V3 sheets, 24 credits): rejected, stock-icon output.
- Batch 2 (bar-M from old logo, 108 credits): 8 x GPT Image 2.5 + 4 x Nano Banana Pro.
  Run IDs in `bar-m-batch-run-ids.txt`. Fetch with `weave_get_model_run_output`.
- Old logo uploaded to Weave: https://media.weavy.ai/image/upload/v1790690578/uploads/gB5uLAjZG4XEmoA6gk6KEM42IW22/ygmtbks6rlkeb3wtqljd.png

## Batch 2 review (done)
- All 12 outputs cut from the raw PNGs, recoloured to exact Signal on transparent: `bar-m/<id>.png` (512px),
  `-64.png` and `-32.png` (the 32px and 16px favicon tests at 2x).
- Survivors: **g1** (four bars, cut tops), **n1** (bars with carved V), **g6** (M carved from tile), **g3** (rounded legs, drawn V).
- Cut: g2 (five bars, chart with a dip), g4 (signal icon), g5 (equaliser), g7 (floating chevron dies at 16px),
  g8 (signal icon), n2 (Gmail echo, slits close), n3 (reads ".vl"), n4 (typeset M, bar graph gone).
- Shortlist board: `bar-m-shortlist.html`, published at https://claude.ai/artifact/4qhkwrg4rcVVgAx1Ays4Az

## Next
1. **Picked: g6** (M carved from a red tile; run 52c74b42). Also worth drawing a positive version (red bars, no tile) for use beside the wordmark.
2. **Vector master done, hand-built (no Weave spend)** in `ml-brand-system/assets/logo/symbol/`:
   tile and untiled SVG masters, a hinted 16px favicon, avatar, and PNG exports. `build.py` generates all SVGs from the grid
   (bar 12, gap 4, V falls 3:4, 60 x 48 glyph, 80 tile with radius 16). Equal bar and gap widths were tried first and
   rejected, because the gaps overpowered the bars. Board: `g6-master.html`, published at https://claude.ai/artifact/43AiKexStb9CjqffwZEsSf
   (it references `symbol/` and `bar-m/` as published paths).
   Next: swap the brand system over (`assets/logo/ml-icon.svg`, `ml-favicon-512.png`, wordmark lockups, tokens/brand docs). Not done yet; the old files are untouched.
3. No further Weave spend without an explicit Approve/Cancel prompt that shows the cost.

## Round 3 (starting)
- User feedback on the g6 vector master: too sharp, reads as AI-generated, not worth the credits spent. **G6 direction shelved**;
  files stay in `assets/logo/symbol/` for reference only, brand system not switched.
- Next: user sends reference examples. Upload them to Weave, generate from the references, quote the exact cost with an
  Approve/Cancel prompt before every run.
- **Round 3 generated (108 credits)**: 8 GPT Image 2.5 + 4 Nano Banana Pro, text prompts distilled from `refs/`. Run IDs in
  `round3-run-ids.txt`, cut marks in `round3/`. Shortlist (strongest first): f-gpt "M." with full stop, d-gpt locked ML
  monogram, b-gpt rising arches, c-gpt continuous ribbon M, b-nb mane wave. Cut: a-gpt, a-nb, d-nb, e-gpt, g-gpt, g-nb, h-gpt.
  Board: `round3-shortlist.html`, published at https://claude.ai/artifact/9P8gYirK3M3UMJ2w4M1i2G
- **User picked b-nb "Mane wave"** from round 3. 10 variants generated (110 credits, Nano Banana Pro seeded from the b-nb image):
  run IDs in `mane-run-ids.txt`, cut marks in `mane/`. Recommended: m04 circle, m01 base bar, m10 heavy square, m08 upright.
  Board: `mane-variants.html`, published at https://claude.ai/artifact/XMnXKCX1BKrXoFV1tx6H4F
  Credits used this session: 108 (round 3) + 110 (mane variants). Weave balance after: 1,150.
- **Mane wave dropped** by the user (none of the 10 variants worked).
- **Round 4 (110 credits, Nano Banana Pro)**: 10 new directions, one move each from the refs. Run IDs in `round4-run-ids.txt`,
  cut marks in `round4/`. Recommended: r01 heavy M with one cut, r03 folded strip, r04 layered ML, r10 brush M.
  Board: `round4-symbols.html`, published at https://claude.ai/artifact/AiRTNr1VSSwSKQK6gMoQpt. Weave balance after: 1,040.
