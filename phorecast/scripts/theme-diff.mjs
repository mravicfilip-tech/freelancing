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
    // Two alignments, chosen by whether the element count moved -- because the
    // two mechanisms this job uses need opposite things.
    //
    // A mask conversion is a 1:1 tag swap: `<img class="x">` becomes
    // `<span class="icon x">`. Nothing is inserted or removed, document order
    // is preserved exactly, and so position IS identity. Keying on the class
    // breaks it twice over: the class itself changed, so every conversion
    // reports GONE plus ADDED, and the unclassed elements then re-ordinal
    // around the ones that left their pool, manufacturing phantom geometry.
    // Measured on the hero: 294 rows and 0 geometry by index, against 373 rows
    // and 156 phantom geometry rows by identity.
    //
    // An insertion is the opposite: inlining an SVG or adding the switcher
    // shifts every later element, and index alignment then reports thousands
    // of false differences -- which is what drove agents away from inlining.
    //
    // Equal counts means nothing was inserted, so index is right. Unequal
    // counts means something was, so identity is right. The `icon` marker is
    // stripped from the key so a converted glyph still matches its old self
    // when the identity path does run.
    const equalCount = sa.n === sb.n;
    const norm = (k) => k.split(/\s+/).filter((t) => t !== 'icon').join(' ') || k;
    const key_ = (els) => {
      const seen = new Map(), out = new Map();
      for (const e of els) {
        const base = norm(e.k);
        const n = (seen.get(base) ?? 0) + 1;
        seen.set(base, n);
        out.set(`${base}#${n}`, e);
      }
      return out;
    };
    const byIndex = (els) => new Map(els.map((e, i) => [`@${i}`, e]));
    const ma = equalCount ? byIndex(sa.els) : key_(sa.els);
    const mb = equalCount ? byIndex(sb.els) : key_(sb.els);
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
