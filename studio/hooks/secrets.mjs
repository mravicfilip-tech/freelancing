#!/usr/bin/env node
// Studio secret warning. A UserPromptSubmit hook for Claude Code that only warns Filip.
//
//   It reads the prompt, looks for pasted secrets, and on a hit prints one JSON object holding a
//   systemMessage, a single line naming the kind and a masked form, with advice to revoke it.
//   On no hit it prints nothing. It is not a guard. It never blocks, never stops the turn, never
//   adds context to the prompt, and never writes the secret anywhere.
//
// Every error exits 0 silently. A watchdog exits 0 after 150ms. No dependencies.
// scripts/secrets.mjs imports detect() from here so the hook and the history scan agree.
//
// Masked form is the public prefix of the kind (ghp_, sk-ant-, AKIA) then four stars then the last
// four characters of the value. A value under 12 characters shows stars only.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_TEXT = 400000;

// Shannon entropy in bits per character.
export function entropy(s) {
  const n = s.length;
  if (!n) return 0;
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  let h = 0;
  for (const c of counts.values()) { const p = c / n; h -= p * Math.log2(p); }
  return h;
}

export function mask(value, prefix = '') {
  const body = value.startsWith(prefix) ? value.slice(prefix.length) : value;
  const tail = body.length >= 12 ? body.slice(-4) : '';
  return `${prefix}****${tail}`;
}

const hasDigit = (s) => /\d/.test(s);
const hasLetter = (s) => /[A-Za-z]/.test(s);
// Obvious placeholders and code that is not a literal value.
const PLACEHOLDER = /^(?:<[^>]*>|\$[{(]?\w|%\w|\{\{|your[_-]|xxx|\*{3,}|\.{3,}|changeme|example|placeholder|process\.env|os\.environ|getenv|null|none|true|false|undefined)/i;

// Specific kinds. Each has a regex, a label, the public prefix, and an optional extra check.
// The first capture group, when present, is the secret. Otherwise the whole match is.
const SPECIFIC = [
  { kind: 'GitHub token', re: /\b(gh[pousr]_)[A-Za-z0-9]{30,255}\b/g, prefix: (m) => m[1] },
  { kind: 'GitHub token', re: /\b(github_pat_)[A-Za-z0-9_]{22,255}\b/g, prefix: (m) => m[1] },
  { kind: 'Anthropic key', re: /\b(sk-ant-)[A-Za-z0-9_-]{20,255}/g, prefix: (m) => m[1] },
  { kind: 'OpenAI key', re: /(?<![A-Za-z0-9])(sk-(?:proj-|svcacct-|admin-)?)[A-Za-z0-9_-]{20,255}/g, prefix: (m) => m[1], check: (v) => hasDigit(v) && !/^sk-ant-/.test(v) },
  { kind: 'AWS access key', re: /\b((?:AKIA|ASIA)[0-9A-Z]{16})\b/g, prefix: (m) => m[1].slice(0, 4) },
  { kind: 'Slack token', re: /\b(xox[abeprs]-)[A-Za-z0-9-]{10,200}/g, prefix: (m) => m[1] },
  { kind: 'Vercel token', re: /\b(vcp_)[A-Za-z0-9]{20,100}\b/g, prefix: (m) => m[1] },
  { kind: 'Vercel token', re: /vercel[^\n]{0,40}?(?:token|key)[^\n]{0,20}?[=:\s"']+([A-Za-z0-9]{24})(?![A-Za-z0-9])/gi, group: 1, prefix: () => '', check: (v) => hasDigit(v) && hasLetter(v) && entropy(v) >= 3.4 },
  { kind: 'private key block', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/g, prefix: () => '', whole: true },
  { kind: 'JWT', re: /\b(eyJ)[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, prefix: (m) => m[1] },
];

// A name, an equals or colon, then a long literal value.
const GENERIC = /\b(?:password|passwd|pwd|pass|secret|client[_-]?secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|private[_-]?key)\s*["']?\s*[:=]\s*["']?([^\s"'`,;<>)]{12,})/gi;

// A long token-shaped string within 40 characters after a word like token, secret or key.
const NEAR_WORD = /\b(?:token|secret|key|credential)s?\b[^\n]{0,40}?(?<![A-Za-z0-9_+=-])([A-Za-z0-9_+=-]{33,200})(?![A-Za-z0-9_+=-])/gi;

function overlaps(spans, a, b) {
  return spans.some(([x, y]) => a < y && b > x);
}

// Returns [{ kind, masked, start, end, value }] in order of position. The value is for the caller
// to hash or compare. Never print it.
export function detect(input) {
  const text = String(input ?? '').slice(0, MAX_TEXT);
  if (!text) return [];
  const hits = [];
  const spans = [];
  const seen = new Set();
  const add = (kind, value, start, prefix) => {
    const end = start + value.length;
    if (overlaps(spans, start, end)) return;
    if (seen.has(value)) return;
    seen.add(value);
    spans.push([start, end]);
    hits.push({ kind, masked: kind === 'private key block' ? '****' : mask(value, prefix), start, end, value });
  };

  for (const s of SPECIFIC) {
    for (const m of text.matchAll(s.re)) {
      const value = s.whole ? m[0] : (s.group ? m[s.group] : m[0]);
      const start = m.index + m[0].lastIndexOf(value);
      if (s.check && !s.check(value)) continue;
      add(s.kind, value, start, s.prefix(m));
    }
  }

  for (const m of text.matchAll(GENERIC)) {
    const value = m[1];
    if (PLACEHOLDER.test(value) || /[({[\]}$]/.test(value)) continue;
    if (!hasDigit(value) && !/[^A-Za-z]/.test(value) && value.length < 16) continue;
    add('password or key assignment', value, m.index + m[0].lastIndexOf(value), '');
  }

  for (const m of text.matchAll(NEAR_WORD)) {
    const value = m[1];
    if (!hasDigit(value) || !hasLetter(value) || entropy(value) < 3.5) continue;
    if (/^[0-9a-f]{40}$/i.test(value) && !/\bkey\b/i.test(m[0].slice(0, 10))) continue; // a git sha near the word key is not a secret
    add('high entropy string', value, m.index + m[0].lastIndexOf(value), '');
  }

  return hits.sort((a, b) => a.start - b.start);
}

// A stable short id for a value, for counting repeats without keeping it.
export const fingerprint = (v) => createHash('sha256').update(String(v)).digest('hex').slice(0, 12);

// The one line shown to Filip, or null when the prompt is clean.
export function warning(prompt) {
  const hits = detect(prompt);
  if (!hits.length) return null;
  const shown = hits.slice(0, 3).map((h) => `${h.kind} ${h.masked}`).join(', ');
  const more = hits.length > 3 ? ` and ${hits.length - 3} more` : '';
  return `Possible secret in your prompt, ${shown}${more}. It is now in this session transcript, so revoke it at the source and issue a new one.`;
}

export function decide(d) {
  if (!d || typeof d !== 'object') return null;
  if (d.hook_event_name && d.hook_event_name !== 'UserPromptSubmit') return null;
  if (typeof d.prompt !== 'string' || !d.prompt) return null;
  const line = warning(d.prompt);
  return line ? { systemMessage: line } : null;
}

// A copy installed for the user stays quiet when the project carries its own copy of this hook,
// so the freelancing repo never runs it twice. CLAUDE_PROJECT_DIR is set by Claude Code for hooks.
export function shadowedByProject(self, projectDir) {
  if (!projectDir) return false;
  const own = resolve(self);
  const project = resolve(projectDir, 'studio', 'hooks', basename(own));
  return project.toLowerCase() !== own.toLowerCase() && existsSync(project);
}

async function main() {
  const watchdog = setTimeout(() => process.exit(0), 150);
  if (shadowedByProject(fileURLToPath(import.meta.url), process.env.CLAUDE_PROJECT_DIR)) { clearTimeout(watchdog); process.exit(0); }
  try {
    let raw = '';
    process.stdin.setEncoding('utf8');
    for await (const c of process.stdin) raw += c;
    const out = decide(JSON.parse(raw.replace(/^﻿/, '').trim() || '{}'));
    if (out) process.stdout.write(JSON.stringify(out));
  } catch {
    // A failed warning must never get in the way of the prompt.
  }
  clearTimeout(watchdog);
  process.exit(0);
}

const self = process.argv[1] ? resolve(process.argv[1]).toLowerCase() : '';
if (self === resolve(fileURLToPath(import.meta.url)).toLowerCase()) main();
