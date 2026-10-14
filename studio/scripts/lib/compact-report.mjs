// Compact text form of a shoot.mjs report.json. One line per route, one line per finding, no raw
// element dumps. Used by shoot.mjs (report.compact.txt) and by pack.mjs when the file is missing.
// report.json itself is never changed.
//
// Interact and hierarchy findings are merged into one list per route and each appears once, keyed
// on check, element and issue. Findings that share a severity, a check and an issue text collapse
// into one line with a count and the first three elements, so 40 links with no hover state cost
// one line. Contrast, type, targets, focus, console and diff get one line each at most.

const clip = (s, n) => {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '~' : t;
};

function mergedFindings(row) {
  const seen = new Set();
  const out = [];
  const lists = [(row.interact && row.interact.findings) || [], (row.hierarchy && row.hierarchy.findings) || []];
  for (const list of lists) {
    for (const f of list) {
      const key = `${f.check}|${f.el}|${f.issue}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
    }
  }
  return out;
}

function findingLines(list) {
  const groups = new Map();
  for (const f of list) {
    const key = `${f.severity}|${f.check}|${f.issue}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  const lines = [];
  for (const g of groups.values()) {
    const f = g[0];
    if (g.length === 1) {
      const d = f.detail && String(f.detail).length <= 70 ? ` (${clip(f.detail, 70)})` : '';
      lines.push({ sev: f.severity, check: f.check, text: `  s${f.severity} ${f.check} ${clip(f.el, 60)} | ${clip(f.issue, 110)}${d}` });
    } else {
      const els = g.slice(0, 3).map((x) => clip(x.el, 32)).join(', ') + (g.length > 3 ? `, +${g.length - 3}` : '');
      lines.push({ sev: f.severity, check: f.check, text: `  s${f.severity} ${f.check} x${g.length} | ${clip(f.issue, 110)} | ${els}` });
    }
  }
  lines.sort((a, b) => a.sev - b.sev || a.check.localeCompare(b.check));
  return lines.map((l) => l.text);
}

function routeLines(row) {
  const bits = [];
  bits.push(`contrast ${(row.contrast || []).length}`);
  bits.push(`type ${(row.type || []).length}`);
  bits.push(`targets ${(row.targets || []).length}`);
  bits.push(`focus ${(row.focus || []).length}`);
  bits.push(`console ${(row.console || []).length}`);
  bits.push(row.overflow ? 'overflow yes' : 'overflow no');
  if (row.diff) {
    if (row.diff.missing) bits.push('diff no before shot');
    else bits.push(`diff ${row.diff.changedPct}%${row.diff.sizeChanged ? ' size changed' : ''}${row.diff.box ? ` [${row.diff.box.join(',')}]` : ''}`);
  }
  const all = mergedFindings(row);
  if (row.interact) {
    const n = (s) => all.filter((f) => f.severity === s).length;
    bits.push(`s1 ${n(1)} s2 ${n(2)} s3 ${n(3)}`);
  }
  const h = row.hierarchy;
  if (h && !h.error) {
    const views = (h.views || []).map((v) => `${v.view}:${v.primaries}`).join(' ');
    bits.push(`primaries ${views || 0}`, `h1 ${h.headings ? h.headings.h1 : 0}`, `largest ${h.largestText ? h.largestText.px + 'px' : 'none'}`, `unnamed ${(h.unnamed || []).length}`);
  }
  const lines = [`${row.route} @${row.width} ${row.path} | ${bits.join(' | ')}`];

  // Mechanical checks, one line each. Contrast lists the worst five, the rest is a count.
  const c = [...(row.contrast || [])].sort((a, b) => a.ratio - b.ratio);
  for (const x of c.slice(0, 5)) lines.push(`  contrast ${x.ratio}:1 need ${x.need} ${clip(x.el, 50)}${x.uncertain ? ' uncertain' : ''}`);
  if (c.length > 5) lines.push(`  contrast +${c.length - 5} more, worst ${c[0].ratio}:1`);
  const t = row.type || [];
  if (t.length) {
    const sizes = {};
    for (const x of t) sizes[x.px] = (sizes[x.px] || 0) + 1;
    lines.push(`  type ${t.length} under 14px, ${Object.entries(sizes).map(([p, n]) => `${p}px x${n}`).join(' ')} | ${t.slice(0, 2).map((x) => clip(x.el, 40)).join(', ')}`);
  }
  const g = [...(row.targets || [])].sort((a, b) => a.w * a.h - b.w * b.h);
  if (g.length) {
    const rules = {};
    for (const x of g) rules[x.rule] = (rules[x.rule] || 0) + 1;
    lines.push(`  targets ${g.length}, ${Object.entries(rules).map(([r, n]) => `${r} x${n}`).join(' ')} | smallest ${g.slice(0, 2).map((x) => `${clip(x.el, 36)} ${x.w}x${x.h}`).join(', ')}`);
  }
  if ((row.focus || []).length) lines.push(`  focus ${row.focus.length} stops with no ring | ${row.focus.slice(0, 3).map((x) => clip(x, 36)).join(', ')}`);
  for (const e of (row.console || []).slice(0, 3)) lines.push(`  console ${clip(e, 110)}`);
  if (row.interact && (row.interact.errors || []).length) lines.push(`  interact step errors ${row.interact.errors.length} | ${clip(String(row.interact.errors[0]), 90)}`);
  if (row.interact && row.interact.budgetHit) lines.push('  interact time budget hit, not every element checked');
  if (h && h.error) lines.push(`  hierarchy error ${clip(h.error, 100)}`);
  const rc = row.record;
  if (rc && rc.error) lines.push(`  record failed ${clip(rc.error, 100)}`);
  else if (rc) {
    const worst = rc.layoutShift.events[0];
    lines.push(`  record ${rc.seconds}s ${rc.frames} frames, stopped at ${clip(rc.stopped, 60)}, layout shift ${rc.layoutShift.total}${rc.layoutShift.atLoad ? `, at load ${rc.layoutShift.atLoad}` : ''}${worst ? `, worst ${worst.value} at ${worst.at} ${clip(worst.sources.join(' '), 40)}` : ''}`);
  }
  lines.push(...findingLines(all));
  return lines;
}

export function compactReport(report) {
  const out = [`shots ${report.url} | widths ${(report.widths || []).join(',')} | ${(report.routes || []).length} captures${report.interact ? ' | interact on' : ''}${report.record ? ' | record on' : ''}`];
  for (const row of report.routes || []) out.push(...routeLines(row));
  return out.join('\n') + '\n';
}
