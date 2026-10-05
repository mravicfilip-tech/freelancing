# taste evals

Run on a fresh context against a copy of a taste log in a scratch folder, never a real client file.

### Shape
1. SKILL.md frontmatter name equals the directory name.
2. SKILL.md is under 180 lines and `node scripts/lint.mjs` exits 0.

### Behavior
3. Given "v6 is perfect go with it" after six loader variants, the new entry is at the top,
   status ACCEPTED, names v6 as the winner and lists the losers.
4. Given "I don't like how active state is presented", the entry is REJECTED and the carry
   forward line is a checkable rule, not a wish.
5. Filip's words appear in quotes, under 20 words. With no reason given, the why is marked
   `(inferred)`.
6. When the new entry overturns an older ACCEPTED entry, the older one reads `ACCEPTED, SUPERSEDED
   by <date>` and is still present.
7. The chat confirmation is one line per entry.
8. A rejection with no named fault names the actual treatment from the code, or the skill asks
   exactly one question before logging.
9. "Kill the overlay, use a 2px outline" produces one ACCEPTED entry for the outline, names
   the overlay as rejected, and marks it `(not yet built)`.
10. Three entries on the same day carry times and sit newest first.
