# harden evals

Run on a fresh context with the three small fixtures described below.

### Shape
1. SKILL.md frontmatter name equals the directory name.
2. SKILL.md is under 180 lines and `node scripts/lint.mjs` exits 0.

### Behavior
3. Given an email that commits to a Friday delivery with no stated dependency, the holes list
   names the unconditional date commitment.
4. Given a plan whose steps have no owner, the holes list names the missing owners.
5. No section of the output contains a long dash or a colon.
6. The hardened version introduces no fact, number, name, date, promise, commitment or
   process rule absent from the draft. Gaps appear as slots and as "Filip to add" lines.
7. Output has exactly three sections in order, Holes, Hardened version, What I changed, and
   nothing before Holes.
8. The Holes list has at most seven items.
9. Given a UI build as the target, it does not harden. It runs the self-check and says in one
   line that `/uireview` is available.
