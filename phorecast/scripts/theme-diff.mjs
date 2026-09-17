// Compare two theme snapshots and report what changed, per section.
//
//   node scripts/theme-diff.mjs before.json after.json [--quiet]
//
// The point of this is the dark-mode regression check: capture dark before the
// light work, capture dark again after, and this must print nothing. It is
// also useful pointed at a dark/light pair, where it reports the surface area
// a theme actually touches.
import { readFileSync } from 'node:fs';

const A = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const B = JSON.parse(readFileSync(process.argv[3], 'utf8'));
const QUIET = process.argv.includes('--quiet');

let changed = 0, geometry = 0, colour = 0, missing = 0;
const GEOM = new Set(['x', 'y', 'w', 'h']);
const report = [];

for (const width of Object.keys(A.widths)) {
  const wa = A.widths[width], wb = B.widths[width] ?? {};
  for (const sel of Object.keys(wa)) {
    const sa = wa[sel], sb = wb[sel];
    if (!sa) continue;
    if (!sb) { report.push(`${width}  ${sel}  MISSING in second snapshot`); missing++; continue; }
    if (sa.n !== sb.n) report.push(`${width}  ${sel}  element count ${sa.n} -> ${sb.n}`);
    const perSection = [];
    // Aligned by identity, not by array index. Index alignment meant that
    // inserting a single node -- the theme switcher into the nav, or an inlined
    // SVG's children into a section -- shifted every later element by one and
    // reported thousands of false differences. That is not just noise: agents
    // started avoiding inlining altogether to keep the gate readable, so the
    // measuring instrument was dictating the design. Each element is keyed by
    // its class and its ordinal among siblings sharing that class, so a new
    // node displaces nothing and a genuinely added or removed one is reported
    // as exactly that.
    const key_ = (els) => {
      const seen = new Map(), out = new Map();
      for (const e of els) {
        const n = (seen.get(e.k) ?? 0) + 1;
        seen.set(e.k, n);
        out.set(`${e.k}#${n}`, e);
      }
      return out;
    };
    const ma = key_(sa.els), mb = key_(sb.els);
    for (const [id, ea] of ma) {
      const eb = mb.get(id);
      if (!eb) {
        changed++; missing++;
        if (perSection.length < 6) perSection.push(`      ${ea.k || '?'} · GONE from the second snapshot`);
        continue;
      }
      for (const key of Object.keys(ea)) {
        if (key === 'k') continue;
        if (ea[key] !== eb[key]) {
          changed++;
          GEOM.has(key) ? geometry++ : colour++;
          if (perSection.length < 6) perSection.push(`      ${ea.k || '?'} · ${key}: ${ea[key]} -> ${eb[key]}`);
        }
      }
    }
    for (const id of mb.keys()) {
      if (!ma.has(id)) {
        changed++;
        if (perSection.length < 6) perSection.push(`      ${id.split('#')[0]} · ADDED in the second snapshot`);
      }
    }
    if (perSection.length) report.push(`${width}  ${sel}\n${perSection.join('\n')}`);
  }
}

if (!changed && !missing) {
  console.log('IDENTICAL — no geometry or colour differs at any width.');
} else {
  if (!QUIET) report.slice(0, 40).forEach((r) => console.log(r));
  console.log(`\n${changed} differing properties  (${geometry} geometry, ${colour} colour/other)`);
  if (geometry) console.log('GEOMETRY MOVED — a theme change should not move anything.');
}
process.exit(changed || missing ? 1 : 0);
