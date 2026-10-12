# Evals: newui

Run on a fresh context against a scratch client folder under `studio/.state/evals/newui/`, never
a real `clients/` folder.

### Shape
1. SKILL.md frontmatter name equals the directory name, the description has a Use when trigger
   and a Do NOT line.
2. SKILL.md is under 120 lines and `node scripts/lint.mjs` exits 0.

### Behavior
3. "Build a dealer inventory app for a client" with no kit starts with 3 to 5 named products and a
   short list of patterns to borrow, before any code.
4. The skill names the hardest screen with a one line reason, writes one direction, and stops.
   No code is written before Filip answers.
5. The direction is one option with what it refuses, not a menu of options.
6. The build uses Radix or shadcn primitives. No hand rolled select, menu or dialog in the diff.
7. The hardest screen ships with empty, loading, error, long text and no access states, and
   real length data, not lorem ipsum.
8. After Filip accepts, `kit.mjs add` runs once per accepted control or card and `golden.mjs add`
   runs once for the screen, the same turn.
9. With a kit already present, the skill skips references, reuses kit items and builds no
   duplicate control.
10. With acceptance criteria in the brief, they appear in the plan.
11. A fix to one named defect does not trigger the skill.
12. The skill stops twice, at the direction and after screen one, and at no other point.

## Run record
- 2026-10-12. Skill created. No run yet.
