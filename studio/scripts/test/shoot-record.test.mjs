// Run with  node scripts/test/shoot-record.test.mjs
// Drives shoot.mjs --record against fixtures with known motion and reads pixels back out of the
// mp4. Needs the same Chrome and puppeteer-core that shoot.mjs uses, and ffmpeg for the video tests.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findFfmpeg } from '../lib/record.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOOT = resolve(HERE, '..', 'shoot.mjs');
const FIXTURES = join(HERE, 'fixtures');
const root = mkdtempSync(join(tmpdir(), 'shoot-record-'));
const FF = findFfmpeg();

const shoot = (out, routes, extra = [], env = process.env) => {
  const r = spawnSync('node', [SHOOT, '--url', FIXTURES, '--routes', routes, '--out', out, ...extra], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return { report: JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')), compact: readFileSync(join(out, 'report.compact.txt'), 'utf8'), stdout: r.stdout };
};

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

// Frame n of an mp4 as a pixel reader. Frame n is n / fps seconds into the page's own time.
const frame = (mp4, n, w) => {
  const r = spawnSync(FF, ['-v', 'error', '-i', mp4, '-vf', `select=eq(n\\,${n})`, '-vframes', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64e6 });
  assert.equal(r.status, 0, String(r.stderr));
  assert.ok(r.stdout.length > 0, `frame ${n} is missing`);
  return (x, y) => { const i = (y * w + x) * 3; return [r.stdout[i], r.stdout[i + 1], r.stdout[i + 2]]; };
};
const is = {
  red: ([r, g, b]) => r > 200 && g < 70 && b < 70,
  blue: ([r, g, b]) => b > 200 && r < 70 && g < 70,
  green: ([r, g, b]) => g > 140 && r < 70 && b < 70,
  white: ([r, g, b]) => r > 230 && g > 230 && b > 230,
  black: ([r, g, b]) => r < 40 && g < 40 && b < 40,
  grey: ([r, g, b]) => [r, g, b].every((v) => v > 180 && v < 225),
};
const at = (px, x, y, kind) => assert.ok(is[kind](px(x, y)), `expected ${kind} at ${x},${y}, got ${px(x, y).join(',')}`);

if (FF) {
  const run = shoot(join(root, 'rec'), 'motion=/motion.html,calm=/motion-transform.html', ['--record']);
  const rec = (n) => run.report.routes.find((r) => r.route === n).record;
  const motion = rec('motion'), calm = rec('calm');

  test('every route gets a video and a strip, no errors', () => {
    assert.equal(run.report.record, true);
    for (const r of [motion, calm]) {
      assert.equal(r.error, undefined, r.error);
      assert.ok(existsSync(r.video) && existsSync(r.strip), JSON.stringify(r));
      assert.equal(r.fps, 30);
    }
  });

  test('scrolls to the bottom and stops there', () => {
    assert.equal(motion.stopped, 'bottom');
    assert.equal(motion.scroll.max, 1700);
    assert.equal(motion.scroll.end, 1700);
  });

  test('video is 1440 by 900 and holds every recorded frame', () => {
    const p = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames', '-of', 'json', motion.video], { encoding: 'utf8' });
    const s = JSON.parse(p.stdout).streams[0];
    assert.equal(s.width, 1440);
    assert.equal(s.height, 900);
    assert.equal(Number(s.nb_read_frames), motion.frames);
    assert.equal(motion.seconds, Math.round((motion.frames / 30) * 10) / 10);
  });

  test('CSS animation sits where its own clock says, frame by frame', () => {
    const f6 = frame(motion.video, 6, 1440);
    at(f6, 250, 150, 'red'); at(f6, 150, 150, 'white');
    const f15 = frame(motion.video, 15, 1440);
    at(f15, 550, 150, 'red'); at(f15, 450, 150, 'white');
    const f30 = frame(motion.video, 30, 1440);
    at(f30, 1050, 150, 'red'); at(f30, 950, 150, 'white');
  });

  test('requestAnimationFrame motion steps one frame behind, as in a browser', () => {
    const f15 = frame(motion.video, 15, 1440);
    at(f15, 520, 300, 'blue'); at(f15, 440, 300, 'white');
  });

  test('a 500ms timer fires between 433ms and 567ms', () => {
    at(frame(motion.video, 13, 1440), 50, 450, 'grey');
    at(frame(motion.video, 17, 1440), 50, 450, 'black');
  });

  test('a reveal on scroll has finished by the last frame', () => {
    at(frame(motion.video, motion.frames - 1, 1440), 150, 350, 'green');
  });

  test('layout shift, animating left counts, transform alone is zero', () => {
    assert.ok(motion.layoutShift.total > 0, JSON.stringify(motion.layoutShift));
    assert.ok(motion.layoutShift.events[0].sources.includes('div.b'));
    assert.equal(calm.layoutShift.total, 0, JSON.stringify(calm.layoutShift));
  });

  test('a shift during load is reported apart, never in the scroll total', () => {
    assert.ok(calm.layoutShift.atLoad > 0, JSON.stringify(calm.layoutShift));
    assert.equal(calm.layoutShift.total, 0);
  });

  test('compact report and summary carry the record', () => {
    assert.match(run.compact, /\| record on/);
    assert.match(run.compact, /\n {2}record [\d.]+s \d+ frames, stopped at bottom, layout shift/);
    assert.match(run.stdout, /motion @1440 .*record [\d.]+s, \d+ frames, stopped at bottom/);
  });

  test('a plain run is unchanged by --record, same shot pixel for pixel', () => {
    const plain = shoot(join(root, 'plain'), 'clean=/clean.html');
    const both = shoot(join(root, 'both'), 'clean=/clean.html', ['--record', '--seconds', '1', '--compare', join(root, 'plain')]);
    const a = plain.report.routes[0], b = both.report.routes[0];
    assert.equal(b.diff.changedPct, 0, JSON.stringify(b.diff));
    assert.deepEqual(Object.keys(b).filter((k) => k !== 'record' && k !== 'diff'), Object.keys(a));
    for (const k of ['contrast', 'type', 'targets', 'focus', 'overflow', 'console']) assert.deepEqual(b[k], a[k], k);
    assert.ok(!('record' in plain.report) && !('record' in a));
    assert.equal(b.record.frames, 30);
    assert.equal(b.record.stopped, 'seconds cap 1');
  });
} else {
  console.log('ffmpeg was not found, the video tests are skipped');
}

test('without ffmpeg, frames land as jpgs with the command that joins them', () => {
  const run = shoot(join(root, 'noff'), 'motion=/motion.html', ['--record', '--seconds', '1'], { ...process.env, FFMPEG_PATH: join(root, 'no-ffmpeg-here') });
  const r = run.report.routes[0].record;
  assert.equal(r.error, undefined, r.error);
  assert.equal(r.video, null);
  assert.equal(readdirSync(r.framesDir).filter((f) => f.endsWith('.jpg')).length, 30);
  assert.match(r.joinWith, /^ffmpeg -framerate 30 /);
  assert.ok(existsSync(r.strip));
});

console.log(`${passed} passed`);
rmSync(root, { recursive: true, force: true });
