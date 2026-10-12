#!/usr/bin/env node
// Tests for hooks/secrets.mjs and scripts/secrets.mjs.
//   node hooks/test/secrets.test.mjs
//
// Every fake secret is built at runtime from parts, so no real-looking secret sits in this file.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide, detect, warning } from '../secrets.mjs';
import { scan } from '../../scripts/secrets.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = resolve(HERE, '..', 'secrets.mjs');
const SCAN = resolve(HERE, '..', '..', 'scripts', 'secrets.mjs');

let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log(`ok  ${name}`); };

// Deterministic body with mixed characters, so the entropy and digit checks hold.
const ALNUM = 'aB3dE5fG7hJ9kL2mN4pQ6rS8tU1vW0xYzC';
const body = (n, seed = 0) => Array.from({ length: n }, (_, i) => ALNUM[(i * 7 + seed * 5 + 3) % ALNUM.length]).join('');
const join2 = (...p) => p.join('');

// kind, public prefix, full fake value
const FAKES = [
  ['GitHub token', 'ghp_', join2('gh', 'p_', body(36, 1))],
  ['GitHub token', 'gho_', join2('gh', 'o_', body(36, 2))],
  ['GitHub token', 'github_pat_', join2('github', '_pat_', body(40, 3))],
  ['Anthropic key', 'sk-ant-', join2('sk', '-ant-', 'api03-', body(48, 4))],
  ['OpenAI key', 'sk-', join2('sk', '-', body(44, 5))],
  ['OpenAI key', 'sk-proj-', join2('sk', '-proj-', body(48, 6))],
  ['AWS access key', 'AKIA', join2('AK', 'IA', 'QWERTY7890ASDFGH'.slice(0, 16))],
  ['Slack token', 'xoxb-', join2('xo', 'xb-', '1234567890-', body(24, 7))],
  ['Vercel token', 'vcp_', join2('vc', 'p_', body(32, 8))],
  ['JWT', 'eyJ', join2('ey', 'Jhbgc', body(12, 9), '.', 'ey', 'Jzdwi', body(14, 1), '.', body(22, 2))],
  ['password or key assignment', '', body(20, 3)],
];

const asPrompt = (secret, kind) => {
  if (kind === 'password or key assignment') return join2('pass', 'word=', secret);
  return `here is my key ${secret} please use it`;
};

await test('every kind is detected, with the right kind, in a one line systemMessage', () => {
  for (const [kind, , secret] of FAKES) {
    const out = decide({ hook_event_name: 'UserPromptSubmit', prompt: asPrompt(secret, kind) });
    assert.ok(out, `no hit for ${kind}`);
    assert.deepEqual(Object.keys(out), ['systemMessage'], 'only a systemMessage');
    assert.ok(out.systemMessage.includes(kind), `kind ${kind} missing from "${out.systemMessage.replace(secret, '***')}"`);
    assert.ok(!out.systemMessage.includes('\n'), 'one line');
    assert.match(out.systemMessage, /revoke/i);
  }
});

await test('the private key block and the generic labels are detected', () => {
  const head = join2('-----BEGIN ', 'RSA PRIVATE', ' KEY-----');
  assert.equal(detect(`${head}\nabc`)[0].kind, 'private key block');
  const api = detect(join2('api', '_key: ', body(24, 4)));
  assert.equal(api[0].kind, 'password or key assignment');
});

await test('high entropy string next to the word token is detected', () => {
  const v = body(40, 6) + 'Zq9';
  const hits = detect(`my deploy token is ${v}`);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'high entropy string');
  assert.equal(detect(`my deploy sentence is ${v}`).length, 0, 'no trigger word, no hit');
});

await test('the masked form never shows more than the last 4 characters of the secret', () => {
  for (const [kind, prefix, secret] of FAKES) {
    const out = decide({ hook_event_name: 'UserPromptSubmit', prompt: asPrompt(secret, kind) });
    const msg = out.systemMessage;
    const rest = secret.startsWith(prefix) ? secret.slice(prefix.length) : secret;
    // No 5 character stretch of the part after the public prefix may appear.
    for (let i = 0; i + 5 <= rest.length; i++) {
      assert.ok(!msg.includes(rest.slice(i, i + 5)), `${kind}, leaked "${rest.slice(i, i + 5)}"`);
    }
    // The 4 character tail may appear, the masked form is the prefix, four stars, then the tail.
    assert.ok(msg.includes(`${prefix}****${rest.slice(-4)}`) || rest.length < 12, `${kind} mask shape`);
    assert.ok(!msg.includes(secret), 'full secret never printed');
  }
});

await test('a private key body is never echoed', () => {
  const head = join2('-----BEGIN ', 'PRIVATE', ' KEY-----');
  const msg = decide({ hook_event_name: 'UserPromptSubmit', prompt: `${head}\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----` }).systemMessage;
  assert.ok(!msg.includes('MIIEvQ') && !msg.includes('BEGIN'));
});

await test('clean prompts print nothing', () => {
  const clean = [
    'make the nav 44px tall and use the brand blue',
    'the commit is 4f9c2a1d8e7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c on branch concept/dal',
    'set the password field to be at least 12 characters in the form',
    'run git log --oneline and read src/components/NavigationSidebarCollapsed.tsx',
    'risk-assessment-for-the-quarterly-planning-meeting and task-board-redesign',
    'password=<your password>  api_key=${API_KEY}  token: process.env.TOKEN',
    '~/.claude/studio/hooks/secrets.mjs token path',
    '',
  ];
  for (const p of clean) {
    assert.equal(decide({ hook_event_name: 'UserPromptSubmit', prompt: p }), null, p);
    assert.equal(warning(p), null);
  }
  const r = spawnSync('node', [HOOK], { input: JSON.stringify({ hook_event_name: 'UserPromptSubmit', prompt: 'hello there' }), encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '', 'no output on a clean prompt');
});

await test('end to end, exit 0, only a systemMessage on stdout, nothing that blocks', () => {
  const [kind, , secret] = FAKES[0];
  const t0 = Date.now();
  const r = spawnSync('node', [HOOK], { input: JSON.stringify({ hook_event_name: 'UserPromptSubmit', prompt: asPrompt(secret, kind) }), encoding: 'utf8' });
  const ms = Date.now() - t0;
  assert.equal(r.status, 0);
  const o = JSON.parse(r.stdout);
  assert.deepEqual(Object.keys(o), ['systemMessage']);
  assert.ok(!r.stdout.includes(secret));
  console.log(`    spawn to exit ${ms}ms`);
});

await test('bad input and other events exit 0 and print nothing', () => {
  for (const input of ['', 'not json', '{"prompt":42}', '[]', 'null', JSON.stringify({ hook_event_name: 'PreToolUse', prompt: asPrompt(FAKES[0][2], 'x') })]) {
    const r = spawnSync('node', [HOOK], { input, encoding: 'utf8' });
    assert.equal(r.status, 0, input);
    assert.equal(r.stdout, '', input);
  }
});

await test('a very large prompt is handled inside the time budget', () => {
  const big = 'lorem ipsum dolor sit amet '.repeat(40000) + ' ' + FAKES[0][2];
  const t0 = process.hrtime.bigint();
  decide({ hook_event_name: 'UserPromptSubmit', prompt: big });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`    1MB prompt ${ms.toFixed(0)}ms`);
  assert.ok(ms < 100, `took ${ms}ms`);
});

await test('many hits stay on one line and say how many more', () => {
  const p = FAKES.map(([k, , s]) => asPrompt(s, k)).join('\n');
  const msg = decide({ hook_event_name: 'UserPromptSubmit', prompt: p }).systemMessage;
  assert.ok(!msg.includes('\n') && /and \d+ more/.test(msg));
});

await test('the source never blocks, no decision field, no continue false, no writes', () => {
  for (const f of [HOOK, SCAN]) {
    const src = readFileSync(f, 'utf8');
    assert.ok(!/decision\s*:/.test(src), `${f} has a decision field`);
    assert.ok(!/continue\s*:\s*false/.test(src), `${f} has continue false`);
    assert.ok(!/additionalContext/.test(src), `${f} adds context`);
    assert.ok(!/writeFile|appendFile|createWriteStream/.test(src), `${f} writes a file`);
  }
  assert.ok(/setTimeout\(\(\) => process\.exit\(0\), 150\)/.test(readFileSync(HOOK, 'utf8')), 'watchdog');
  assert.ok(!/[\u2013\u2014]/.test(readFileSync(HOOK, 'utf8')), 'long dash');
});

await test('the history scan finds a seeded secret, masks it, and skips tool output and subagents', async () => {
  const home = mkdtempSync(join(tmpdir(), 'secrets-test-'));
  try {
    const proj = join(home, '.claude', 'projects', 'p1');
    mkdirSync(join(proj, 'subagents'), { recursive: true });
    const secret = FAKES[3][2];
    const now = new Date().toISOString();
    const user = (content, extra = {}) => JSON.stringify({ type: 'user', sessionId: 'sess-aaa', timestamp: now, message: { role: 'user', content }, ...extra });
    writeFileSync(join(proj, 'a.jsonl'), [
      user(`please use ${secret}`),
      user(`please use ${secret}`),
      user([{ type: 'tool_result', content: `output ${FAKES[0][2]}` }]),
      JSON.stringify({ type: 'assistant', sessionId: 'sess-aaa', timestamp: now, message: { role: 'assistant', content: `echo ${FAKES[1][2]}` } }),
      user(`<system-reminder>${FAKES[2][2]}</system-reminder> fine`),
    ].join('\n') + '\n');
    writeFileSync(join(proj, 'subagents', 'b.jsonl'), user(`agent wrote ${FAKES[4][2]}`) + '\n');
    const codex = join(home, '.codex', 'sessions', '2026', '10', '12');
    mkdirSync(codex, { recursive: true });
    writeFileSync(join(codex, 'rollout-2026-10-12T10-00-00-01a0f72c-3ae7-7c32-adac-d7c4e22af6a2.jsonl'),
      JSON.stringify({ type: 'response_item', timestamp: now, payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: `use ${FAKES[0][2]}` }] } }) + '\n');
    const res = await scan({ since: Date.now() - 86400000, home });
    assert.equal(res.hits.length, 2, JSON.stringify(res.hits.map((h) => [h.kind, h.tool])));
    const a = res.hits.find((h) => h.tool === 'claude');
    assert.equal(a.kind, 'Anthropic key');
    assert.equal(a.count, 2);
    assert.equal(a.session, 'sess-aaa');
    assert.ok(res.hits.find((h) => h.tool === 'codex' && h.kind === 'GitHub token'));
    const json = JSON.stringify(res.hits);
    for (const [, prefix, s] of FAKES) {
      const rest = s.slice(prefix.length);
      assert.ok(!json.replace(/\*+/g, '').includes(rest.slice(0, 8)), 'a scan result leaked a value');
    }
    // End to end through the CLI, with HOME pointed at the seeded folder.
    const r = spawnSync('node', [SCAN, '--since', '2020-01-01'], { encoding: 'utf8', env: { ...process.env, USERPROFILE: home, HOME: home } });
    assert.equal(r.status, 0);
    assert.ok(/Anthropic key/.test(r.stdout) && /Anthropic key in claude/.test(r.stdout));
    assert.ok(!r.stdout.includes(secret) && !r.stdout.includes(secret.slice(7, 20)));
  } finally { rmSync(home, { recursive: true, force: true }); }
});

console.log(`\n${passed} passed`);
