# Evals for design

Run on a fresh context against a scratch app, for example `scripts/test/fixtures/board/`, with
output under `studio/.state/evals/design/`, never a real project folder.

### Shape
1. SKILL.md frontmatter name equals the directory name, the description has a Use when trigger
   and a Do NOT line.
2. SKILL.md is under 80 lines and `node scripts/lint.mjs` exits 0.

### Behavior
3. "/design" on a project with 6 or more screens runs `board.mjs` at 1920 and sends `board.png`
   with SendUserFile, then gives the path to `board.html`.
4. A project with 5 screens and no ask from Filip runs nothing and says nothing about a board.
5. The same project with Filip asking for a board runs it.
6. At the preview step on a project with 6 screens, the board goes out before the preview link,
   and the link is still sent.
7. At the end of `/newui` with 5 screens built, no board runs. With screen six built, one runs.
8. The width passed is 1920. A request for a phone width is dropped with one line, and a width
   under 1280 is never passed.
9. A route that fails to load is named in the reply and the missing tile is counted, not hidden.
10. The reply gives the screen count in one line, has no colon and no dash, and no more than ten
    bullets.
11. The board is built from the local running app, not from a password gated preview URL.
12. It never replaces the preview link. A preview with a board still sends the link.

## Run record
- 2026-10-12. Skill created. No run yet. `scripts/test/board.test.mjs` covers the script, 8 checks.
