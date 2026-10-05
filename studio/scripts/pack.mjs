#!/usr/bin/env node
// Packs the kit's four skills as account skills, one zip each, for upload in Claude settings under
// Capabilities, Skills. Account skills reach every chat, Cowork and every cloud session, so the
// commands work outside this repo too.
//
//   node studio/scripts/pack.mjs [--out <dir>]        default studio/dist
//
// Each zip holds one folder named for the skill with SKILL.md at its top, plus the kit files the
// skill reads, laid out as they are under studio/. A skill's K is its own folder when it runs
// outside this repo, so the paths in SKILL.md resolve the same way in both places.
// No dependencies. The zip writer below stores files without compression.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = resolve(STUDIO, '..');
const SKILLS = join(ROOT, '.claude', 'skills');

// Kit files each skill needs beside its own folder, as paths under studio/.
const EXTRA = {
  uireview: ['foundation/writing.md', 'scripts/ledger.mjs', 'scripts/shoot.mjs', 'scripts/registry.mjs', 'scripts/weights.json', 'hooks/guard.mjs'],
  harden: ['foundation/writing.md'],
  taste: ['foundation/writing.md', 'foundation/principles.md'],
  mode: ['foundation/writing.md', 'foundation/models.md'],
};

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

// ---------- zip, stored ----------
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

export function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const n = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); local.writeUInt32LE(0, 10); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(n.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(0, 10); central.writeUInt32LE(0, 12);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(n.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, n, data);
    centrals.push(central, n);
    offset += 30 + n.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---------- pack ----------
export function pack(out) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const made = [];
  for (const [name, extra] of Object.entries(EXTRA)) {
    const dir = join(SKILLS, name);
    if (!existsSync(join(dir, 'SKILL.md'))) throw new Error(`.claude/skills/${name}/SKILL.md is missing`);
    const files = walk(dir).map((p) => ({ name: `${name}/${relative(dir, p).replace(/\\/g, '/')}`, path: p }));
    for (const x of extra) files.push({ name: `${name}/${x}`, path: join(STUDIO, x) });
    const entries = files.map((f) => ({ name: f.name, data: readFileSync(f.path) }));
    const file = join(out, `${name}.zip`);
    writeFileSync(file, zip(entries));
    made.push(`${file.replace(/\\/g, '/')}, ${entries.length} files`);
  }
  return made;
}

function main() {
  const i = process.argv.indexOf('--out');
  const out = resolve(i > 0 && process.argv[i + 1] ? process.argv[i + 1] : join(STUDIO, 'dist'));
  for (const line of pack(out)) console.log(line);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(`pack.mjs failed ${e.message || e}`); process.exit(1); }
}
