#!/usr/bin/env node
// scripts/baselint.mjs
//
// Warns when added lines fall off the base layout scale in foundation/base-layout.css.
// It reads `git diff -U0` and checks added lines only, never the whole repo, so it is not a sweep.
// It exits 0 always. It warns and never blocks (DOCTRINE guards, only two things block).
//
//   node scripts/baselint.mjs --repo <path> [--base <ref>] [--client <id>] [--json]
//
//   --repo    git repo to check, default the current folder
//   --base    ref to diff against, default HEAD (staged and unstaged work, plus new untracked files)
//   --client  client id, picks clients/<client>/base-override.json. Without it the registry decides
//             (node scripts/registry.mjs <repo>). No match means the base scale alone.
//   --json    machine output
//
// Fix mode. It is a dry run unless --apply is given.
//
//   node scripts/baselint.mjs --repo <path> --fix [--plan-out <file>] [--preset]
//   node scripts/baselint.mjs --repo <path> --fix --apply [--plan <file>] [--preset]
//
//   --fix       lists each off-scale value on an added line with its new value and token. The new value
//               is the nearest allowed value for that property and brand. A tie, a z-index, a shadow,
//               an icon set mix and a control height that would change tier are marked needs a call and
//               get no proposal.
//   --apply     writes only the unambiguous changes, one exact line edit per finding, in the unit the
//               line already used (px, rem, a bare number, a Tailwind arbitrary value). It refuses a
//               line whose text is not what the dry run saw, and never touches a line the diff did not add.
//   --plan-out  saves the dry run, so a later --apply --plan reads back exactly what was shown
//   --plan      apply what a saved dry run showed, and refuse any line that changed since
//   --preset    Tailwind arbitrary values map to the class in foundation/tailwind-preset.cjs when it has one.
//               Without the flag the repo is checked for a tailwind config that uses the preset.
//
// Checks css, scss, tsx, jsx, ts, js, html and vue. rem and em convert at 16px. Tailwind arbitrary
// values such as text-[13px] and p-[5px] are read too. Height checks need a control context (a
// selector or line that names a button, input, select, chip, tab and so on), icon sizes need an
// icon context, so a 400px panel is never flagged. No dependencies.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRANDS = process.env.STUDIO_CLIENTS_DIR || join(STUDIO, 'clients');

// ---------- the scale ----------
export const DEFAULTS = {
  fontFloor: 14,
  fontSizes: [12, 14, 16, 18, 20, 24, 28, 32, 40, 48],
  lineHeights: [16, 20, 24, 28, 32, 36, 40, 48, 56],
  spacing: [0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96],
  radius: [0, 4, 8, 12, 16, 24],
  controlHeights: [32, 36, 40, 44],
  iconSizes: [16, 20, 24, 32],
  iconStroke: [1.5],
  zIndex: [0, 10, 20, 30, 40, 50, 60],
  shadowColor: 'black',
};
const LH_FOR_FS = { 16: [12], 20: [14], 24: [16], 28: [18, 20], 32: [24], 36: [28], 40: [32], 48: [40], 56: [48] };
const SHADOWS = [
  { level: 1, x: 0, y: 1, blur: 2, a: 0.08 },
  { level: 2, x: 0, y: 2, blur: 6, a: 0.15 },
  { level: 3, x: 0, y: 8, blur: 24, a: 0.16 },
];
const OVERRIDE_KEYS = ['fontFloor', 'fontSizes', 'lineHeights', 'spacing', 'radius', 'controlHeights', 'iconSizes', 'iconStroke', 'zIndex', 'shadowColor'];

export function loadScale(client) {
  const scale = JSON.parse(JSON.stringify(DEFAULTS));
  if (client && /^[a-z0-9-]+$/.test(client)) {
    const f = join(BRANDS, client, 'base-override.json');
    if (existsSync(f)) {
      try {
        const o = JSON.parse(readFileSync(f, 'utf8'));
        for (const k of OVERRIDE_KEYS) if (o[k] !== undefined) scale[k] = o[k];
      } catch { /* an unreadable override means the base scale alone */ }
    }
  }
  return scale;
}

// ---------- helpers ----------
const FILE_EXT = new Set(['.css', '.scss', '.tsx', '.jsx', '.ts', '.js', '.html', '.vue']);
const SKIP_PATH = /(^|\/)(node_modules|dist|build|\.next|coverage|__tests__)\/|\.min\.|\.d\.ts$|\.(test|spec)\.[a-z]+$|(^|\/)base-layout\.css$/;
const r3 = (n) => Math.round(n * 1000) / 1000;
const kebab = (p) => p.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const list = (a) => a.join(' ');

function toPx(tok, js) {
  const m = /^(-?\d*\.?\d+)(px|rem|em)?$/i.exec(tok.trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  const u = (m[2] || '').toLowerCase();
  if (u === 'rem' || u === 'em') return r3(n * 16);
  if (u === 'px') return r3(n);
  if (n === 0) return 0;
  return js ? r3(n) : null;
}

function splitTop(str, sep) {
  const out = [];
  let depth = 0, cur = '', q = '';
  for (const ch of str) {
    if (q) { cur += ch; if (ch === q) q = ''; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function nearest(v, set, preferLarger = true) {
  let best = set[0];
  for (const s of set) {
    const d = Math.abs(s - v), bd = Math.abs(best - v);
    if (d < bd || (d === bd && preferLarger && s > best)) best = s;
  }
  return best;
}

const SKIP_VALUE = /var\(|calc\(|clamp\(|min\(|max\(|env\(|theme\(|\$\{|@|\$[a-z]/i;

// ---------- the checks, each returns a finding fragment or null ----------
function checkFont(px, sc) {
  if (sc.fontSizes.includes(px)) return null;
  const near = nearest(px, sc.fontSizes);
  let note = '';
  if (Number.isInteger(px) && px < sc.fontFloor && px >= 12 && sc.fontFloor > 14) note = `below the brand floor ${sc.fontFloor}`;
  return { kind: 'font', num: px, sev: px < 12 ? 1 : 2, allowed: sc.fontSizes, token: sc.fontSizes.includes(near) && DEFAULTS.fontSizes.includes(near) ? `var(--bl-fs-${near})` : `brand size ${near}`, note: px < 12 ? 'under 12, sev 1 if it is working text' : note };
}
function checkLine(px, sc) {
  if (sc.lineHeights.includes(px)) return null;
  const near = nearest(px, sc.lineHeights);
  const fs = LH_FOR_FS[near];
  return { kind: 'line', num: px, sev: 3, allowed: sc.lineHeights, token: fs ? 'var(--' + fs.map((f) => `bl-lh-${f}`).join(') or var(--') + ')' : `brand line height ${near}`, note: '' };
}
function checkSpace(px, sc) {
  const a = Math.abs(px);
  if (sc.spacing.includes(a)) return null;
  const near = nearest(a, sc.spacing);
  return { kind: 'space', num: a, sev: 3, allowed: sc.spacing, token: DEFAULTS.spacing.includes(near) && near >= 2 ? `var(--bl-sp-${near})` : near === 0 ? '0' : `brand spacing ${near}`, note: 'sev 2 when it breaks sibling alignment' };
}
function checkRadius(px, sc) {
  if (px >= 999 || sc.radius.includes(px)) return null;
  const near = nearest(px, sc.radius, false);
  return { kind: 'radius', num: px, sev: 3, allowed: [...sc.radius, 'full'], token: DEFAULTS.radius.includes(near) ? `var(--bl-r-${near})` : `brand radius ${near}`, note: 'sev 2 when siblings differ' };
}
function checkControlHeight(px, sc) {
  if (px === 0 || sc.controlHeights.includes(px)) return null;
  const near = nearest(px, sc.controlHeights);
  return { kind: 'ctl', num: px, sev: px < 24 ? 1 : 2, allowed: sc.controlHeights, token: DEFAULTS.controlHeights.includes(near) ? `var(--bl-h-${near})` : `brand height ${near}`, note: px < 24 ? 'under 24 target, sev 1' : 'siblings in a row share one tier' };
}
function checkIcon(px, sc) {
  if (sc.iconSizes.includes(px)) return null;
  const near = nearest(px, sc.iconSizes);
  return { kind: 'icon', num: px, sev: 3, allowed: sc.iconSizes, token: DEFAULTS.iconSizes.includes(near) ? `var(--bl-icon-${near})` : `brand icon ${near}`, note: '' };
}
function checkStroke(n, sc) {
  if (sc.iconStroke.includes(n)) return null;
  return { kind: 'stroke', num: n, sev: 3, allowed: sc.iconStroke, token: 'var(--bl-icon-stroke)', note: '' };
}
function checkZ(n, sc) {
  if (sc.zIndex.includes(n)) return null;
  const near = nearest(n, sc.zIndex, false);
  return { kind: 'z', num: n, sev: 3, allowed: sc.zIndex, token: DEFAULTS.zIndex.includes(near) ? `var(--bl-z-${near})` : `brand z ${near}`, note: '' };
}

function parseColor(tok) {
  let m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(tok);
  if (m) {
    let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { black: m[1] === '0' && m[2] === '0' && m[3] === '0', a };
  }
  m = /^#([0-9a-f]{3,8})$/i.exec(tok);
  if (m) {
    const h = m[1];
    if (h.length === 3 || h.length === 6) return { black: /^0+$/.test(h), a: 1 };
    if (h.length === 4) return { black: /^0{3}/.test(h), a: parseInt(h[3] + h[3], 16) / 255 };
    if (h.length === 8) return { black: /^0{6}/.test(h), a: parseInt(h.slice(6), 16) / 255 };
  }
  if (/^(transparent|currentcolor)$/i.test(tok)) return { black: false, a: 0, named: true };
  if (/^[a-z]+$/i.test(tok)) return { black: tok.toLowerCase() === 'black', a: 1, named: true };
  if (/^(hsla?|oklch|oklab|lab|lch|color)\(/i.test(tok)) return { black: false, a: 1, fn: true };
  return null;
}

const COLOURED = /rgba?\(\s*(?!0[\s,]+0[\s,]+0\b)|#(?!0{3,8}\b)[0-9a-f]{3,8}/i;
function checkShadow(value, sc) {
  const v = value.trim().replace(/\s*!important$/i, '');
  if (/^(none|inherit|initial|unset)$/i.test(v)) return null;
  const layers = splitTop(v, ',');
  const bad = [];
  for (const layer of layers) {
    const toks = splitTop(layer, ' ');
    const nums = [];
    let color = null, inset = false, ok = true;
    for (const t of toks) {
      if (/^inset$/i.test(t)) { inset = true; continue; }
      const px = toPx(t, false);
      if (px !== null) { nums.push(px); continue; }
      const c = parseColor(t);
      if (c && !color) { color = c; continue; }
      ok = false;
    }
    if (!ok || nums.length < 2 || nums.length > 4) { bad.push(layer); continue; }
    const [x, y, blur = 0, spread = 0] = nums;
    // A spread only ring, the usual focus or border trick, is not a shadow level.
    if (blur === 0 && x === 0 && y === 0 && spread > 0) continue;
    const anyColor = sc.shadowColor === 'any';
    const geo = SHADOWS.find((s) => s.x === x && s.y === y && s.blur === blur && spread === 0);
    if (!geo || inset) { bad.push(layer); continue; }
    if (!anyColor && (!color || !color.black || Math.abs(color.a - geo.a) > 0.005)) { bad.push(layer); continue; }
  }
  if (!bad.length) return null;
  return { kind: 'shadow', num: 0, sev: 3, allowed: ['none', '0 1px 2px rgba(0,0,0,.08)', '0 2px 6px rgba(0,0,0,.15)', '0 8px 24px rgba(0,0,0,.16)'], token: 'var(--bl-shadow-1), var(--bl-shadow-2) or var(--bl-shadow-3)', note: sc.shadowColor !== 'any' && COLOURED.test(value) ? 'coloured shadows only where the brand uses them' : '' };
}

// ---------- context ----------
const CONTROL = /\b(btn|button|input|select|textarea|field|chip|pill|tab|toggle|switch|dropdown|combobox|control|picker)s?\b/i;
const ICON = /\b(icon|svg|glyph|chevron|caret|ico)s?\b|<svg|<path\b|Icon\b/i;
const SVG_SHAPE = /^(path|circle|line|rect|polyline|polygon|ellipse|g)$/;
const ICON_TAG =/^(\w*Icon|Search|Plus|Minus|Check|X|Menu|Bell|Settings|User|Home|Trash2?|Edit2?|Eye|EyeOff|Download|Upload|Filter|Calendar|Info|Copy|Link|Star|Heart|Mail|Phone|Lock|Chevron\w*|Arrow\w*|Alert\w*|Circle\w*|Loader\w*)$/;

function contextFor(fileLines, lineNo, ext) {
  const line = fileLines[lineNo - 1] || '';
  let selector = '';
  if (['.css', '.scss', '.vue', '.html'].includes(ext)) {
    for (let i = lineNo - 2, n = 0; i >= 0 && n < 40; i--, n++) {
      const t = fileLines[i];
      if (/\{\s*$/.test(t) && !/^\s*@(media|supports|keyframes|layer|container)/.test(t)) { selector = t; break; }
    }
  }
  const prev = [fileLines[lineNo - 3] || '', fileLines[lineNo - 2] || ''].join(' ');
  const broad = `${selector} ${prev}`;
  // The line itself decides first, then the selector and the lines just above.
  const own = ICON.test(line) ? 'icon' : CONTROL.test(line) ? 'control' : null;
  if (own) return own;
  if (CONTROL.test(broad)) return 'control';
  if (ICON.test(broad)) return 'icon';
  return null;
}

// ---------- locating a token on a line ----------
// The position of a token, searched forward from a start. Both neighbours are checked so 5px is not
// found inside 15px or 5pxx.
function findToken(text, tok, from) {
  let i = from;
  while ((i = text.indexOf(tok, i)) >= 0) {
    const before = text[i - 1] || '';
    const after = text[i + tok.length] || '';
    const okBefore = tok.startsWith('-') ? !/[\w.]/.test(before) : !/[\w.-]/.test(before);
    if (okBefore && !/[\w.%]/.test(after)) return i;
    i++;
  }
  return -1;
}
// The number inside a JSX attribute such as size={18} or strokeWidth="2", from a match made with the d flag.
// Capture 1 is the number for stroke matches, capture 2 for size, width and height matches.
function attrLoc(tag, match) {
  const g = match.length > 2 ? 2 : 1;
  const attrOffset = tag.index + tag[0].length - tag[2].length;
  return { index: attrOffset + match.indices[g][0], raw: match[g], style: 'attr' };
}

// ---------- scan one added line ----------
const KNOWN_PROP = /^(font-size|line-height|(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?|gap|row-gap|column-gap|grid-gap|border-radius|border-(top|bottom)-(left|right)-radius|border-(start|end)-(start|end)-radius|height|min-height|width|z-index|box-shadow|stroke-width)$/;
const CUSTOM_CAT = [
  [/(font-size|(^|-)fs(-|$))/i, 'font-size'],
  [/(radius|rounded)/i, 'border-radius'],
  [/shadow/i, 'box-shadow'],
  [/(^|-)z(-index)?(-|$)|layer/i, 'z-index'],
  [/(space|spacing|gap)/i, 'padding'],
];

function scanLine(text, ctx, sc) {
  const out = [];
  const push = (property, value, frag, loc) => { if (frag) out.push({ property, value, ...frag, loc: loc || null }); };

  // CSS declarations and JS style objects.
  const re = /(?<![\w\-(])(--?[a-zA-Z][\w-]*|[a-zA-Z][a-zA-Z-]*)\s*:\s*/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[1];
    let prop = kebab(raw);
    const camel = /[a-z][A-Z]/.test(raw);
    if (prop.startsWith('--')) {
      const hit = CUSTOM_CAT.find(([rx]) => rx.test(prop.slice(2)));
      if (!hit) continue;
      prop = hit[1];
    } else if (!KNOWN_PROP.test(prop)) continue;
    let rest = text.slice(re.lastIndex);
    let val;
    if (/^['"`]/.test(rest)) {
      const q = rest[0];
      const end = rest.indexOf(q, 1);
      val = rest.slice(1, end < 0 ? undefined : end);
    } else {
      let depth = 0, i = 0;
      for (; i < rest.length; i++) {
        const ch = rest[i];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (depth <= 0 && (ch === ';' || ch === '}' || (ch === ',' && prop !== 'box-shadow'))) break;
      }
      val = rest.slice(0, i);
    }
    val = val.replace(/\/\*.*?\*\//g, '').replace(/\s*!important\s*$/i, '').trim();
    if (!val || SKIP_VALUE.test(val)) continue;
    const label = raw.startsWith('--') ? raw : prop;
    // Each token is located on the line by searching forward from the value start, so two equal
    // tokens in one declaration get two different positions.
    let cursor = re.lastIndex;
    evalProp(prop, val, true, ctx, sc, (value, frag, tok) => {
      const index = findToken(text, tok, cursor);
      if (index >= 0) cursor = index + tok.length;
      push(label, value, frag, { index, raw: tok, style: 'value' });
    });
  }

  // Tailwind arbitrary values.
  const tw = /(?<![\w-])((?:[a-z0-9-]+:)*)(!?)(-?)(text|leading|px|py|pt|pr|pb|pl|ps|pe|p|mx|my|mt|mr|mb|ml|ms|me|m|gap-x|gap-y|gap|space-x|space-y|rounded(?:-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee))?|min-h|h|size|w|z|shadow)-\[([^\]\s]+)\]/g;
  while ((m = tw.exec(text))) {
    const neg = m[3] ? '-' : '';
    const cls = m[4];
    const body = m[5];
    const whole = m[0].replace(m[1], '');
    if (/^(length|color|string|url|var)\b|^#|^var\(|^calc/.test(body) || /^[a-z]+:/.test(body)) continue;
    const val = body.replace(/_/g, ' ');
    const cut = m[1].length + m[2].length;
    const multi = splitTop(val, ' ').length > 1;
    const loc = { index: m.index + cut, raw: m[0].slice(cut), style: 'tw', cls, neg: !!m[3], body, multi };
    const at = (property, frag) => push(property, `${whole.replace(/^!/, '')}`, frag, loc);
    if (cls === 'text') {
      const px = toPx(val, false);
      if (px !== null && /(px|rem|em)$/i.test(val)) at('font-size', checkFont(px, sc));
    } else if (cls === 'leading') {
      const px = toPx(val, false);
      if (px !== null && /(px|rem|em)$/i.test(val)) at('line-height', checkLine(px, sc));
    } else if (/^(p[xytrblse]?|m[xytrblse]?|gap(-x|-y)?|space-[xy])$/.test(cls)) {
      for (const t of splitTop(val, ' ')) {
        const px = toPx(t, false);
        if (px !== null && /(px|rem|em)$/i.test(t)) at('spacing', checkSpace(px, sc));
      }
    } else if (cls.startsWith('rounded')) {
      const px = toPx(val, false);
      if (px !== null && /(px|rem|em)$/i.test(val)) at('border-radius', checkRadius(px, sc));
    } else if (cls === 'z') {
      if (/^-?\d+$/.test(val)) at('z-index', checkZ(parseInt(val, 10), sc));
    } else if (cls === 'shadow') {
      at('box-shadow', checkShadow(val, sc));
    } else if (cls === 'h' || cls === 'min-h' || cls === 'size' || cls === 'w') {
      const px = toPx(val, false);
      if (px === null || !/(px|rem|em)$/i.test(val)) continue;
      const kind = ctx.kind;
      if (kind === 'icon' && px <= 96) at(cls === 'w' ? 'width' : cls === 'size' ? 'size' : 'height', checkIcon(px, sc));
      else if (kind === 'control' && cls !== 'w' && cls !== 'size' && px <= 64) at(cls === 'min-h' ? 'min-height' : 'height', checkControlHeight(px, sc));
    }
  }

  // JSX icon props, size={18}, width={18}, strokeWidth={2}.
  const tag = /<([A-Za-z][\w.]*)\b([^>]*)/.exec(text);
  if (tag && SVG_SHAPE.test(tag[1]) && ctx.kind === 'icon') {
    // A path, circle or line inside an icon carries its own stroke width.
    const sm = /(?:strokeWidth|stroke-width)\s*=\s*\{?\s*['"]?(\d+(?:\.\d+)?)['"]?\s*\}?/d.exec(tag[2]);
    if (sm) push('stroke-width', sm[1], checkStroke(parseFloat(sm[1]), sc), attrLoc(tag, sm));
  }
  // Tailwind stroke width classes, stroke-2 or stroke-[2], inside an icon.
  if (ctx.kind === 'icon') {
    for (const sw of text.matchAll(/(?<![\w-])((?:[a-z0-9-]+:)*)stroke-(?:\[(\d+(?:\.\d+)?)(?:px)?\]|(\d+))(?![\w.-])/g)) {
      push('stroke-width', sw[0].replace(sw[1], ''), checkStroke(parseFloat(sw[2] ?? sw[3]), sc), { index: sw.index + sw[1].length, raw: sw[0].slice(sw[1].length), style: 'tw', cls: 'stroke', neg: false, body: '', multi: false });
    }
  }
  if (tag) {
    const isSvg = tag[1] === 'svg' || ICON_TAG.test(tag[1]);
    if (isSvg) {
      const attrs = tag[2];
      const am = /(?:^|\s)(size|width|height)\s*=\s*\{?\s*['"]?(\d+(?:\.\d+)?)(?:px)?['"]?\s*\}?/gd;
      let a;
      while ((a = am.exec(attrs))) {
        if (a[1] === 'size' && tag[1] === 'svg') continue;
        push(a[1], a[2], checkIcon(parseFloat(a[2]), sc), attrLoc(tag, a));
      }
      const sm = /(?:strokeWidth|stroke-width)\s*=\s*\{?\s*['"]?(\d+(?:\.\d+)?)['"]?\s*\}?/d.exec(attrs);
      if (sm) push('stroke-width', sm[1], checkStroke(parseFloat(sm[1]), sc), attrLoc(tag, sm));
    }
  }
  return out;
}

function evalProp(prop, val, js, ctx, sc, emit) {
  if (prop === 'box-shadow') { emit(val, checkShadow(val, sc), val); return; }
  if (prop === 'z-index') { if (/^-?\d+$/.test(val)) emit(val, checkZ(parseInt(val, 10), sc), val); return; }
  if (prop === 'stroke-width') {
    if (ctx.kind !== 'icon') return;
    if (/^\d+(\.\d+)?$/.test(val)) emit(val, checkStroke(parseFloat(val), sc), val);
    return;
  }
  const toks = splitTop(val, ' ');
  for (const t of toks) {
    if (t === '/' || /%|v[wh]|vmin|vmax|ch|fr|ex$/i.test(t)) continue;
    const px = toPx(t, js);
    if (px === null) continue;
    let frag = null;
    if (prop === 'font-size') frag = checkFont(px, sc);
    else if (prop === 'line-height') { if (/(px|rem|em)$/i.test(t)) frag = checkLine(px, sc); }
    else if (prop.includes('radius')) frag = checkRadius(px, sc);
    else if (prop === 'height' || prop === 'min-height' || prop === 'width') {
      const kind = ctx.kind;
      if (kind === 'icon' && px <= 96) frag = checkIcon(px, sc);
      else if (kind === 'control' && prop !== 'width' && px <= 64) frag = checkControlHeight(px, sc);
    } else frag = checkSpace(px, sc);
    if (frag) emit(t.replace(/^(-?\d*\.?\d+)$/, js ? '$1px' : '$1'), frag, t);
  }
}

// ---------- icon sets ----------
// A diff that imports icons from two libraries mixes stroke weights, corner styles and metaphors.
const ICON_LIBS = [
  ['lucide', /lucide(?:-react|-vue|-vue-next|-svelte|-solid|-angular|-static|-react-native)?(?=['"/])/i],
  ['heroicons', /heroicons/i],
  ['phosphor', /phosphor-(?:react|icons|vue|svelte)|@phosphor-icons\//i],
  ['tabler', /@tabler\/icons|tabler-icons/i],
  ['material', /@mui\/icons-material|material-icons|@material-design-icons|@material-ui\/icons|react-icons\/md['"/]/i],
  ['fontawesome', /@fortawesome\/|font-?awesome|react-icons\/fa6?['"/]/i],
  ['radix', /@radix-ui\/react-icons/i],
];
const IMPORT_LINE = /(?:^\s*import\b|\brequire\s*\(|\bfrom\s+['"]|^\s*@import\b|<link\b[^>]*href=|<script\b[^>]*src=)/;

export function iconSetMix(files) {
  const firsts = new Map(); // library to its first import in the diff
  const counts = new Map();
  for (const [file, added] of files) {
    if (!wanted(file)) continue;
    for (const { line, text } of added) {
      if (!IMPORT_LINE.test(text)) continue;
      for (const [lib, rx] of ICON_LIBS) {
        if (!rx.test(text)) continue;
        counts.set(lib, (counts.get(lib) || 0) + 1);
        if (!firsts.has(lib)) firsts.set(lib, { file: file.replace(/\\/g, '/'), line });
        break;
      }
    }
  }
  if (firsts.size < 2) return [];
  // The library with the most import lines is the one to keep. A tie keeps the first seen.
  const order = [...firsts.keys()];
  const keep = order.reduce((a, b) => (counts.get(b) > counts.get(a) ? b : a));
  return order.filter((l) => l !== keep).map((l) => ({
    file: firsts.get(l).file, line: firsts.get(l).line, property: 'icon-set', value: l,
    allowed: [keep], token: 'one icon set per diff', sev: 3, note: `this diff imports icons from ${order.join(' and ')}`,
  }));
}

// ---------- git ----------
function git(repo, args) {
  return execFileSync('git', ['-C', repo, '-c', 'core.quotepath=false', ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

export function parseDiff(diff) {
  const files = new Map();
  let file = null, newLine = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) { file = raw === '+++ /dev/null' ? null : raw.replace(/^\+\+\+ [ab]\//, '').replace(/^\+\+\+ /, ''); if (file && !files.has(file)) files.set(file, []); continue; }
    if (raw.startsWith('--- ') || raw.startsWith('diff ') || raw.startsWith('index ')) continue;
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(raw);
    if (h) { newLine = parseInt(h[1], 10); continue; }
    if (!file) continue;
    if (raw.startsWith('+')) { files.get(file).push({ line: newLine, text: raw.slice(1) }); newLine++; }
  }
  return files;
}

function wanted(file) {
  const n = file.replace(/\\/g, '/');
  return FILE_EXT.has(extname(n).toLowerCase()) && !SKIP_PATH.test(n);
}

export function lint({ repo, base = 'HEAD', client = null, preset = false }) {
  const sc = loadScale(client);
  const theme = preset ? presetTheme(client) : null;
  let diff = '';
  let error = null;
  try { diff = git(repo, ['diff', '-U0', '--no-color', '--no-ext-diff', base, '--']); } catch (e) { error = String(e.stderr || e.message).trim().split('\n')[0]; }
  const files = parseDiff(diff);
  // New files that are not tracked yet are part of the work, every line is added.
  try {
    const untracked = git(repo, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
    for (const f of untracked) {
      if (!wanted(f)) continue;
      try {
        const lines = readFileSync(join(repo, f), 'utf8').split(/\r?\n/);
        files.set(f, lines.map((text, i) => ({ line: i + 1, text })));
      } catch { /* unreadable, skip */ }
    }
  } catch { /* not a repo, the diff error already says so */ }

  const findings = [];
  let checkedFiles = 0, addedLines = 0;
  for (const [file, added] of files) {
    if (!wanted(file)) continue;
    checkedFiles++;
    const ext = extname(file).toLowerCase();
    let fileLines = [];
    try { fileLines = readFileSync(join(repo, file), 'utf8').split(/\r?\n/); } catch { /* deleted or unreadable */ }
    for (const { line, text } of added) {
      addedLines++;
      const t = text.trim();
      if (!t || /^(\/\/|\/\*|\*|<!--)/.test(t)) continue;
      const ctx = { kind: contextFor(fileLines.length ? fileLines : [text], fileLines.length ? line : 1, ext) };
      for (const f of scanLine(text, ctx, sc)) {
        const item = { file: file.replace(/\\/g, '/'), line, property: f.property, value: f.value, allowed: f.allowed, token: f.token, sev: f.sev, note: f.note || '', kind: f.kind, num: f.num, loc: f.loc, lineText: text.replace(/\r$/, '') };
        item.fix = propose(item, sc, theme);
        findings.push(item);
      }
    }
  }
  for (const f of iconSetMix(files)) findings.push({ ...f, kind: 'iconset', num: 0, loc: null, lineText: '', fix: { status: 'call', reason: 'which icon set to keep is a design call' } });
  const seen = new Set();
  const unique = findings.filter((f) => { const k = `${f.file}:${f.line}:${f.property}:${f.value}:${f.loc ? f.loc.index : ''}`; if (seen.has(k)) return false; seen.add(k); return true; });
  unique.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  const res = { client, base, repo, checkedFiles, addedLines, findings: unique, error };
  // The added line numbers per file, kept off the JSON so apply can check a line is still one the diff added.
  Object.defineProperty(res, 'added', { value: files, enumerable: false });
  return res;
}

// ---------- fix proposals ----------
const r4 = (n) => Math.round(n * 10000) / 10000;

// The allowed value nearest to v. A tie returns every value at that distance, so the caller can refuse.
function nearestAllowed(v, set) {
  let bd = Infinity, at = [];
  for (const s of set) {
    const d = Math.abs(s - v);
    if (d < bd - 1e-9) { bd = d; at = [s]; } else if (Math.abs(d - bd) < 1e-9) at.push(s);
  }
  return { best: at[0], tied: at.length > 1 ? at : null, dist: bd };
}

// A number written in the unit the old token used. px stays px, rem and em divide by 16, a bare number stays bare.
function formatLike(old, px) {
  const m = /^(-?)(\d*\.?\d+)(px|rem|em)?$/i.exec(old);
  if (!m) return null;
  const unit = (m[3] || '').toLowerCase();
  if (px === 0) return `0${unit}`;
  let s = String(r4(unit === 'rem' || unit === 'em' ? px / 16 : px));
  if (m[2].startsWith('.') && s.startsWith('0.')) s = s.slice(1);
  return m[1] + s + unit;
}

const parsePx = (v) => parseFloat(String(Array.isArray(v) ? v[0] : v));
function keyForPx(map, px) {
  for (const [k, v] of Object.entries(map || {})) if (Math.abs(parsePx(v) - px) < 1e-9) return k;
  return null;
}

// The Tailwind preset class for a value, or null when the preset has none (leading, w, size, z, shadow).
function presetClass(theme, loc, kind, px) {
  const { cls, neg } = loc;
  const sign = neg ? '-' : '';
  if (cls === 'text') { const k = keyForPx(theme.fontSize, px); return k === null ? null : `text-${k}`; }
  if (/^(p|m)[xytrblse]?$|^gap(-x|-y)?$|^space-[xy]$/.test(cls)) { const k = keyForPx(theme.spacing, px); return k === null ? null : `${sign}${cls}-${k}`; }
  if (cls.startsWith('rounded')) { const k = keyForPx(theme.borderRadius, px); return k === null ? null : k === 'DEFAULT' ? cls : `${cls}-${k}`; }
  if (cls === 'h') { const k = keyForPx(theme.height, px); return k === null ? null : `h-${k}`; }
  if (cls === 'min-h') { const k = keyForPx(theme.minHeight, px); return k === null ? null : `min-h-${k}`; }
  return null;
}

// The nearest allowed value as an exact edit, or a reason it needs a call. Nothing here guesses.
function propose(f, sc, theme) {
  const call = (reason) => ({ status: 'call', reason });
  if (f.kind === 'z') return call('a z-index is a layering decision, pick the layer');
  if (f.kind === 'shadow') return call('a shadow is a level choice, 1 card, 2 menu or 3 modal');
  if (!f.loc || f.loc.index < 0) return call('the value could not be located on the line');
  if (f.loc.multi) return call('a class with several values in one bracket');
  const set = { font: sc.fontSizes, line: sc.lineHeights, space: sc.spacing, radius: sc.radius, icon: sc.iconSizes, stroke: sc.iconStroke, ctl: sc.controlHeights }[f.kind];
  if (!set) return call('no rule for this property');
  const { best, tied, dist } = nearestAllowed(f.num, set);
  if (tied) return call(`${f.num} sits between ${tied.join(' and ')}, pick one`);
  if (f.kind === 'ctl' && dist > 1) return call(`${f.num} to ${best} moves the control to another height tier, check its siblings`);
  const { loc } = f;
  let next = null;
  if (loc.style === 'tw') {
    if (loc.cls === 'stroke') next = `stroke-[${best}]`;
    else {
      const bracket = /^(.*)-\[(.+)\]$/.exec(loc.raw);
      const viaPreset = theme && f.kind !== 'stroke' ? presetClass(theme, loc, f.kind, best) : null;
      if (viaPreset) next = viaPreset;
      else if (bracket) { const body = formatLike(loc.body, best); if (body !== null) next = `${bracket[1]}-[${body}]`; }
    }
  } else next = formatLike(loc.raw, best);
  if (next === null || next === loc.raw) return call('the value could not be rewritten in its own unit');
  return { status: 'auto', old: loc.raw, new: next, index: loc.index };
}

// Whether the repo already uses the Tailwind preset, so mapped classes would exist.
function detectPreset(repo) {
  try {
    for (const name of readdirSync(repo)) {
      if (!/^tailwind\.config\.(js|cjs|mjs|ts)$/.test(name)) continue;
      if (/tailwind-preset|presetFor/.test(readFileSync(join(repo, name), 'utf8'))) return true;
    }
  } catch { /* no config, no preset */ }
  return false;
}
function presetTheme(client) {
  const require = createRequire(import.meta.url);
  return require(join(STUDIO, 'foundation', 'tailwind-preset.cjs')).presetFor(client).theme;
}

// ---------- apply ----------
// One exact line edit per finding. A finding is applied only when the line now reads exactly what the
// dry run saw, the line is still one the diff added, and the old text sits at the same place on it.
export function applyFixes({ res, plan = null }) {
  const changed = [], refused = [], left = [];
  const items = plan ? plan.items : res.findings.map(toPlanItem);
  const byFile = new Map();
  for (const it of items) {
    if (it.status !== 'auto') { left.push(it); continue; }
    if (!byFile.has(it.file)) byFile.set(it.file, []);
    byFile.get(it.file).push(it);
  }
  for (const [file, list] of byFile) {
    const path = join(res.repo, file);
    let raw;
    try { raw = readFileSync(path, 'utf8'); } catch { for (const it of list) refused.push({ ...it, why: 'the file could not be read' }); continue; }
    const parts = raw.split(/(?<=\n)/);
    const added = new Set((res.added.get(file) || []).map((a) => a.line));
    const edits = new Map(); // line number to its accepted edits
    for (const it of list) {
      const part = parts[it.line - 1];
      const current = part === undefined ? null : part.replace(/\r?\n$/, '');
      if (current === null || current !== it.lineText) { refused.push({ ...it, why: 'the line changed since the dry run' }); continue; }
      if (!added.has(it.line)) { refused.push({ ...it, why: 'the diff did not add this line' }); continue; }
      if (current.substr(it.index, it.old.length) !== it.old) { refused.push({ ...it, why: 'the old text is not where the dry run saw it' }); continue; }
      if (!edits.has(it.line)) edits.set(it.line, []);
      edits.get(it.line).push(it);
    }
    let touched = false;
    for (const [lineNo, es] of edits) {
      const part = parts[lineNo - 1];
      const eol = /\r?\n$/.exec(part)?.[0] || '';
      let text = part.slice(0, part.length - eol.length);
      // Right to left, so an earlier edit never moves a later position.
      es.sort((a, b) => b.index - a.index);
      let floor = Infinity;
      for (const e of es) {
        if (e.index + e.old.length > floor) { refused.push({ ...e, why: 'two edits overlap on this line' }); continue; }
        text = text.slice(0, e.index) + e.new + text.slice(e.index + e.old.length);
        floor = e.index;
        changed.push(e);
        touched = true;
      }
      parts[lineNo - 1] = text + eol;
    }
    if (touched) writeFileSync(path, parts.join(''));
  }
  changed.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.index - b.index);
  return { changed, refused, left };
}

export function toPlanItem(f) {
  const base = { file: f.file, line: f.line, property: f.property, token: f.token, lineText: f.lineText, status: f.fix.status };
  return f.fix.status === 'auto'
    ? { ...base, old: f.fix.old, new: f.fix.new, index: f.fix.index }
    : { ...base, old: f.loc ? f.loc.raw : f.value, reason: f.fix.reason };
}

// ---------- client lookup ----------
function clientFromRegistry(repo) {
  try {
    const out = execFileSync(process.execPath, [join(STUDIO, 'scripts', 'registry.mjs'), repo], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 });
    const first = out.split('|')[0].trim();
    return /^[a-z0-9-]+$/.test(first) ? first : null;
  } catch { return null; }
}

// ---------- cli ----------
function args(argv) {
  const o = { repo: process.cwd(), base: 'HEAD', client: null, json: false, help: false, fix: false, apply: false, plan: null, planOut: null, preset: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') o.repo = resolve(argv[++i] || '.');
    else if (a === '--base') o.base = argv[++i] || 'HEAD';
    else if (a === '--client') o.client = argv[++i] || null;
    else if (a === '--json') o.json = true;
    else if (a === '--fix') o.fix = true;
    else if (a === '--apply') o.apply = true;
    else if (a === '--plan') o.plan = resolve(argv[++i] || '');
    else if (a === '--plan-out') o.planOut = resolve(argv[++i] || '');
    else if (a === '--preset') o.preset = true;
    else if (a === '--help' || a === '-h') o.help = true;
  }
  return o;
}

function main() {
  const o = args(process.argv.slice(2));
  if (o.help) {
    console.log('node scripts/baselint.mjs --repo <path> [--base <ref>] [--client <id>] [--json]\nWarns on added lines off the base layout scale. Exits 0 always.\nnode scripts/baselint.mjs --repo <path> --fix [--plan-out <file>]   dry run of the nearest allowed values\nnode scripts/baselint.mjs --repo <path> --fix --apply [--plan <file>]   writes the unambiguous ones only');
    return;
  }
  const client = o.client || clientFromRegistry(o.repo);
  const usePreset = o.preset || detectPreset(o.repo);
  const res = lint({ repo: o.repo, base: o.base, client, preset: usePreset });
  if (o.apply && !o.fix) { console.log('baselint --apply only works with --fix, nothing was written.'); return; }
  if (o.fix) { fixMain(o, res, client, usePreset); return; }
  if (o.json) { console.log(JSON.stringify(res, null, 2)); return; }
  if (res.error) { console.log(`baselint could not read the diff against ${o.base}. ${res.error}`); return; }
  const head = `client ${client || 'none'}, base ${o.base}, ${res.checkedFiles} files, ${res.addedLines} added lines`;
  if (!res.findings.length) { console.log(`baselint found nothing off the scale (${head})`); return; }
  console.log(`baselint ${res.findings.length} warnings (${head})`);
  for (const f of res.findings) {
    const extra = f.note ? `, ${f.note}` : '';
    console.log(`${f.file}:${f.line}  ${f.property} ${f.value}  allowed ${list(f.allowed)}  use ${f.token}  sev ${f.sev}${extra}`);
  }
}

function fixMain(o, res, client, usePreset) {
  if (res.error) { console.log(`baselint could not read the diff against ${o.base}. ${res.error}`); return; }
  const items = res.findings.map(toPlanItem);
  const autos = items.filter((i) => i.status === 'auto');
  const calls = items.filter((i) => i.status !== 'auto');
  const head = `client ${client || 'none'}, base ${o.base}, ${res.checkedFiles} files, ${res.addedLines} added lines`;
  const planDoc = { version: 1, repo: res.repo, base: o.base, client, preset: usePreset, items };
  if (o.planOut) writeFileSync(o.planOut, JSON.stringify(planDoc, null, 2));

  if (!o.apply) {
    if (o.json) { console.log(JSON.stringify(planDoc, null, 2)); return; }
    if (!items.length) { console.log(`baselint --fix found nothing off the scale (${head})`); return; }
    console.log(`baselint --fix dry run, ${autos.length} changes and ${calls.length} that need a call (${head}). Nothing was written.`);
    for (const i of autos) console.log(`${i.file}:${i.line}  ${i.property}  ${i.old}  to  ${i.new}  use ${i.token}`);
    for (const i of calls) console.log(`${i.file}:${i.line}  ${i.property}  ${i.old}  needs a call, ${i.reason}`);
    if (autos.length) console.log('Apply the changes above with --fix --apply. Lines that need a call are never written.');
    return;
  }

  let plan = null;
  if (o.plan) {
    try { plan = JSON.parse(readFileSync(o.plan, 'utf8')); } catch (e) { console.log(`baselint could not read the plan ${o.plan}. Nothing was written.`); return; }
    if (!plan || !Array.isArray(plan.items)) { console.log('baselint plan file has no items. Nothing was written.'); return; }
  }
  const out = applyFixes({ res, plan });
  if (o.json) { console.log(JSON.stringify(out, null, 2)); return; }
  console.log(`baselint --fix --apply made ${out.changed.length} changes, refused ${out.refused.length}, left ${out.left.length} that need a call.`);
  for (const c of out.changed) console.log(`changed  ${c.file}:${c.line}  ${c.property}  ${c.old}  to  ${c.new}`);
  for (const r of out.refused) console.log(`refused  ${r.file}:${r.line}  ${r.property}  ${r.old}  ${r.why}`);
  for (const l of out.left) console.log(`left     ${l.file}:${l.line}  ${l.property}  ${l.old}  needs a call, ${l.reason}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.log(`baselint stopped, ${e.message}`); }
  process.exitCode = 0;
}
