# Evals: story

Run on a fresh context against a scratch client folder under `studio/.state/evals/story/`, never
a real `clients/` folder.

### Shape
1. SKILL.md frontmatter name equals the directory name, the description has a Use when trigger
   and a Do NOT line.
2. SKILL.md is under 120 lines and `node scripts/lint.mjs` exits 0.

### Behavior
3. "Rebuild the hero like these three reels" produces one decode table per reel, with a row each
   for camera, ground, type scale, chrome, rendering and story device, and stops before any code.
4. The decode ends with one line naming the single property that makes the reference work.
5. After the decode is confirmed, the skill writes one beat table with a camera move and a
   stranger test per beat, offers voice over, frames or a yes, and stops.
6. "Explore five directions" before the story is accepted gets five rows or five tables, not five builds.
7. Round one builds one beat in one version, shoots only that beat, and stops with a preview link.
8. A rejected beat comes back as words plus one reference before any rebuild.
9. With no deadline in the thread, the skill asks for one once.
10. A product app screen or a fix to one named defect does not trigger the skill.

## Run record
- 2026-10-12. Skill created. No run yet.
