#!/usr/bin/env node
// Studio lint. Keeps the shape honest. Exit 0 clean, 1 on errors (warnings do not fail).
//   node scripts/lint.mjs
//
// Checks
//   skills   the kit's skills in .claude/skills. Name equals dir, under 180 lines, description has a trigger
//            and a Do NOT, evals.md and lessons.md exist
//   agents   .claude/agents tiers, name equals file, model alias and effort match foundation/models.md
//   models   no pinned model version id in any kit file, aliases only. Kit files are studio/, the root
//            CLAUDE.md, the kit's skills and .claude/agents
//   paths    no absolute path to a person's home folder in any studio file
//   style    no long dashes in any studio file

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = resolve(STUDIO, '..');
// The kit's own skills. The other folders in .claude/skills belong to other plugins.
const KIT_SKILLS = ['uireview', 'harden', 'taste', 'mode'];
const errors = [];
const warnings = [];
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f === '.state' || f === '.git' || f === 'node_modules') continue;
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

// ---------- models.md tiers (aliases only) ----------
const models = readFileSync(join(STUDIO, 'foundation', 'models.md'), 'utf8');
const seats = {};
for (const m of models.matchAll(/^\|\s*([a-z-]+)\s*\|\s*(opus|fable|sonnet|haiku)\s*\|\s*(low|medium|high|xhigh|max)\s*\|/gm)) seats[m[1]] = { model: m[2], effort: m[3] };
if (!Object.keys(seats).length) errors.push('foundation/models.md, no helper tiers found');
// A pinned version id, such as a family name followed by a version number. Files use aliases.
const PINNED = /claude-(opus|sonnet|haiku|fable)-\d[\w.-]*/;
// A home folder path written out in full, which only works on one machine.
const HOME_PATH = /(?:[A-Za-z]:[\\/]Users[\\/]|\/Users\/[A-Za-z]|\/home\/[a-z])/;
const LONG_DASH = new RegExp('[' + String.fromCharCode(8211, 8212) + ']');

// ---------- skills ----------
const skillsDir = join(ROOT, '.claude', 'skills');
for (const name of KIT_SKILLS) {
  const dir = join(skillsDir, name);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) { errors.push(`.claude/skills/${name}, missing`); continue; }
  const file = join(dir, 'SKILL.md');
  if (!existsSync(file)) { errors.push(`.claude/skills/${name}, missing SKILL.md`); continue; }
  const text = readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  const lines = text.split(/\r?\n/).length;
  if (!fm) errors.push(`.claude/skills/${name}/SKILL.md, no frontmatter`);
  else {
    if (fm.name !== name) errors.push(`.claude/skills/${name}/SKILL.md, name "${fm.name}" does not equal directory`);
    if (!/\bUse (when|on|the moment|whenever)\b/i.test(fm.description || '')) errors.push(`.claude/skills/${name}/SKILL.md, description has no trigger ("Use when ...")`);
    if (!/Do NOT/.test(fm.description || '')) errors.push(`.claude/skills/${name}/SKILL.md, description has no "Do NOT use for" line`);
  }
  if (lines >= 180) errors.push(`.claude/skills/${name}/SKILL.md, ${lines} lines, limit 180`);
  for (const f of ['evals.md', 'lessons.md']) if (!existsSync(join(dir, f))) errors.push(`.claude/skills/${name}, missing ${f}`);
}

// ---------- agents ----------
const agentsDir = join(ROOT, '.claude', 'agents');
for (const f of readdirSync(agentsDir).filter((x) => x.endsWith('.md'))) {
  const name = f.replace(/\.md$/, '');
  const fm = frontmatter(readFileSync(join(agentsDir, f), 'utf8'));
  if (!fm) { errors.push(`.claude/agents/${f}, no frontmatter`); continue; }
  if (fm.name !== name) errors.push(`.claude/agents/${f}, name "${fm.name}" does not equal file name`);
  if (!fm.effort) errors.push(`.claude/agents/${f}, no effort (nothing inherits)`);
  const seat = seats[name];
  if (!seat) errors.push(`.claude/agents/${f}, no tier "${name}" in foundation/models.md`);
  else {
    if (fm.model !== seat.model) errors.push(`.claude/agents/${f}, model ${fm.model}, models.md says ${seat.model}`);
    if (fm.effort !== seat.effort) errors.push(`.claude/agents/${f}, effort ${fm.effort}, models.md says ${seat.effort}`);
  }
}
for (const t of Object.keys(seats)) if (!existsSync(join(agentsDir, `${t}.md`))) errors.push(`.claude/agents, tier "${t}" in models.md has no agent file`);

// ---------- every text file ----------
const kitFiles = [...walk(STUDIO), join(ROOT, 'CLAUDE.md'), ...walk(agentsDir), ...KIT_SKILLS.filter((n) => existsSync(join(skillsDir, n))).flatMap((n) => walk(join(skillsDir, n)))];
for (const p of kitFiles.filter((x) => existsSync(x) && /\.(md|mjs|json|ps1|cjs)$/.test(x))) {
  const r = rel(p);
  if (r === 'studio/scripts/lint.mjs') continue;
  const text = readFileSync(p, 'utf8');
  const pin = text.match(PINNED);
  if (pin) errors.push(`${r}, pins model ${pin[0]}, use an alias from foundation/models.md`);
  if (HOME_PATH.test(text)) errors.push(`${r}, holds an absolute home folder path, use a path relative to the repo root`);
  if (LONG_DASH.test(text)) errors.push(`${r}, contains a long dash (foundation/writing.md)`);
}

for (const w of warnings) console.log(`warn   ${w}`);
for (const e of errors) console.log(`error  ${e}`);
console.log(`\nlint: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
