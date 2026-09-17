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

// Two snapshots of the same page taken from different ports are the same page.
// Chromium resolves url() in a computed `maskImage` or `backgroundImage` to an
// ABSOLUTE url, origin included, so a baseline captured on :4196 reports twelve
// differences against an identical build served on :4198 -- and the gate is
// meant to answer "did this change", not "which port was free that afternoon".
// Origins are stripped from the value before comparing rather than at capture
// time, so anchors recorded before this still compare cleanly.
const ORIGIN = /\bhttps?:\/\/[^/"')\s]+/g;
const value = (v) => (typeof v === 'string' && v.includes('://') ? v.replace(ORIGIN, '') : v);

let changed = 0, geometry = 0, colour = 0, missing = 0;
// Geometry rows are collected outside the per-section cap. The cap exists so a
// wholesale recolour does not print ten thousand lines, but it was also hiding
// the handful of rows the GEOMETRY MOVED alarm is actually about -- so the
// alarm named a number and then withheld the evidence for it. An alarm you
// cannot check is one people learn to skip.
const geomRows = [];
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
        const va = value(ea[key]), vb = value(eb[key]);
        if (va !== vb) {
          changed++;
          if (GEOM.has(key)) { geometry++; geomRows.push(`  ${width}  ${sel}  ${ea.k || '?'} · ${key}: ${va} -> ${vb}`); }
          else colour++;
          if (perSection.length < 6) perSection.push(`      ${ea.k || '?'} · ${key}: ${va} -> ${vb}`);
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
  if (geometry) {
    console.log(`GEOMETRY MOVED — ${geometry} row${geometry === 1 ? '' : 's'}, listed in full below.`);
    console.log('A theme change should not move anything. The one legitimate exception is the');
    console.log('control that INDICATES the theme: .theme-toggle__sun and .theme-toggle__moon');
    console.log('swap scale and rotation, and getBoundingClientRect bakes a transform into the');
    console.log('box it reports, so the hidden glyph measures differently from the shown one.');
    console.log('Anything else in this list is a real defect.\n');
    geomRows.forEach((r) => console.log(r));
  }
}
process.exit(changed || missing ? 1 : 0);
