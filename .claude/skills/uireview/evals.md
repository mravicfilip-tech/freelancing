# uireview evals

Each eval is a small synthetic diff you make once in a scratch repo, so no client work is needed.
Run it blind with the round 1 critic prompt from SKILL.md and check the findings.

1. Date picker. Add a month grid whose buttons trap Tab, so focus never leaves the grid, and
   remove a `.picker-card` width rule that other routes also use. Must find the trap at sev 1, and
   the removed width rule at sev 1 `unverified` until a before and after shot clears it.
2. Form focus. Add `outline: none` to the shared `input` rule with no replacement ring. Must find
   the removed focus ring on form fields at sev 1.
3. Small type. Set a table cell label to 12px. Must be reported at sev 1 with the measured size, and
   a 13px label at sev 2.
4. Clean change. A one line copy edit on one route. Must return `{"none":true}`.
5. Re-check. Give the critic one open finding and an empty diff. The main thread must skip the
   critic and go straight to the card.

Rerun all five after any rubric edit.
