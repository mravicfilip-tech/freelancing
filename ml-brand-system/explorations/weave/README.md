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

## Next
1. Fetch batch 2, cut marks that do not read as M or fail at 16px.
2. Shortlist board: each survivor at size, 32/16px, round avatar, with wordmark on Carbon and Chalk.
3. After the pick: vector master (Recraft Vectorizer, then clean-up), favicon cut, update brand system files.
