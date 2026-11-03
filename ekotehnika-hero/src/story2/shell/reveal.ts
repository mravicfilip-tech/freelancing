// The load in of every part marked data-wipe. Round 7 took out the Rise of round 5, letters and words coming up from under a mask
// word by word, which Filip rejected (taste 2026-11-03 10:20, "so it comes down from the bottom word by word", "something more
// professional"). In its place the text arrives a line at a time, in one of four ways he picks on the panel with ?text=N
// (preview.ts), 1 is the default.
//   1 Fade       each line fades in while it drifts up 12px
//   2 Line mask  each whole line slides up out of its own mask as one piece, the words of a line never part
//   3 Blur       each line goes from 8px of blur and no opacity to sharp
//   4 Wipe       each line is uncovered by a clip running left to right across it
// Lines follow each other by LINE_STEP of the part's own progress, about 60ms at the pace of the hero block, and they are the lines
// as laid out, so a paragraph that wraps is told apart line by line. A part with no text of its own, an icon, a button or a counting
// figure, arrives whole in the same way, as one line. Nothing about a word is animated on its own, a word is only the unit the
// browser can break a line at. The look lives in shell.css under html[data-text], this file sets one number, --tp from 0 to 1, on
// each unit. With none of the driving JS running, which is the reduced motion case, no data-text is set and every part shows its end
// state.
import { TEXT } from '../preview';

// the share of a part's progress between the start of one line and the start of the next
const LINE_STEP = 0.0625;
// no more than this much of the progress is spent waiting for the last line to start, so a long paragraph still ends together
const STEP_BUDGET = 0.6;

if (typeof document !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.dataset.text = String(TEXT);

// A unit is one word or one inline image, in its mask. line is the line of the part it sits on, fa and fb the share of that line's
// width its left and right edges are at, for the wipe.
type Unit = { c: HTMLElement; line: number; fa: number; fb: number };
export type Rise = { el: HTMLElement; units: Unit[]; lines: number; last: number; done: boolean; width: number };

// The text nodes of a part and the inline images in its text (the flags in the hero marker), in reading order, leaving out
// any part nested inside it that rises on its own.
function pieces(el: HTMLElement): (Text | Element)[] {
  const out: (Text | Element)[] = [];
  const walk = (n: Node) => {
    for (const c of Array.from(n.childNodes)) {
      if (c.nodeType === Node.TEXT_NODE) {
        if ((c.nodeValue ?? '').trim()) out.push(c as Text);
      } else if (c instanceof HTMLImageElement || c instanceof SVGElement) out.push(c);
      else if (c instanceof HTMLElement && !c.hasAttribute('data-wipe')) walk(c);
    }
  };
  walk(el);
  return out;
}

// A unit in its mask. The mask only clips in Line mask, see .rl in shell.css, the other three let the drift, the blur and the clip
// of their own show past the box.
const mask = (inner: Node) => {
  const l = document.createElement('span');
  l.className = 'rl';
  const c = document.createElement('span');
  c.className = 'rc';
  c.appendChild(inner);
  l.appendChild(c);
  return l;
};

// Which line each unit sits on, from where the browser laid it out. offsetTop ignores the transform a unit is in the middle of, so a
// part can be measured while it arrives. Units on one line share a top to within half a unit's height, an inline image sits lower
// than a word, so the bottom edge is compared and not the top.
function measure(R: Rise) {
  let line = -1;
  let edge = -Infinity;
  let from = 0;
  const close = (to: number) => {
    let a = Infinity;
    let b = -Infinity;
    for (let i = from; i < to; i++) {
      a = Math.min(a, R.units[i].c.offsetLeft);
      b = Math.max(b, R.units[i].c.offsetLeft + R.units[i].c.offsetWidth);
    }
    const w = Math.max(1, b - a);
    for (let i = from; i < to; i++) {
      R.units[i].fa = (R.units[i].c.offsetLeft - a) / w;
      R.units[i].fb = (R.units[i].c.offsetLeft + R.units[i].c.offsetWidth - a) / w;
    }
    from = to;
  };
  R.units.forEach((u, i) => {
    const bottom = u.c.offsetTop + u.c.offsetHeight;
    if (line < 0 || Math.abs(bottom - edge) > Math.max(4, u.c.offsetHeight * 0.5)) {
      if (line >= 0) close(i);
      line++;
      edge = bottom;
    }
    u.line = line;
  });
  if (R.units.length) close(R.units.length);
  R.lines = Math.max(1, line + 1);
  R.width = R.el.offsetWidth;
  R.last = -1;
}

// One resize watcher for every part, a change of width can move where a paragraph breaks. The first report of an observed part is its
// first size and is skipped.
const parts = new WeakMap<Element, Rise>();
const watcher =
  typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver((es) => {
        for (const e of es) {
          const R = parts.get(e.target);
          if (R && e.target instanceof HTMLElement && e.target.offsetWidth !== R.width) measure(R);
        }
      });

// Split a part into words, once. The original text node moves into a screen reader copy, so React keeps its node and the part reads
// as one string, and the words beside it are hidden from assistive tech.
export function prepRise(el: HTMLElement): Rise {
  const whole = el.classList.contains('btn') || el.hasAttribute('data-count');
  const R: Rise = { el, units: [], lines: 1, last: -1, done: false, width: 0 };
  if (!el.hasAttribute('data-rise') && !whole) {
    const nodes = pieces(el);
    if (nodes.some((n) => n.nodeType === Node.TEXT_NODE)) {
      for (const t of nodes) {
        // an inline image arrives in its place in the line, like one more word
        if (!(t instanceof Text)) {
          const at = document.createComment('');
          t.parentNode!.insertBefore(at, t);
          at.replaceWith(mask(t));
          continue;
        }
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        const vis = document.createElement('span');
        vis.setAttribute('aria-hidden', 'true');
        for (const part of (t.nodeValue ?? '').split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) vis.appendChild(document.createTextNode(part));
          else vis.appendChild(mask(document.createTextNode(part)));
        }
        t.parentNode!.insertBefore(sr, t);
        sr.appendChild(t);
        sr.after(vis);
      }
      el.setAttribute('data-rise', '');
    }
  }
  if (el.hasAttribute('data-rise')) {
    R.units = Array.from(el.querySelectorAll<HTMLElement>('.rc')).map((c) => ({ c, line: 0, fa: 0, fb: 1 }));
    measure(R);
    // the fonts change the width of every word, lay the lines out again when they are in
    document.fonts?.ready.then(() => measure(R));
    parts.set(el, R);
    watcher?.observe(el);
  }
  return R;
}

const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// p runs 0 to 1 over the load in of this part
export function setRise(R: Rise, p: number) {
  // a number and not a string, this runs for every part on screen every frame
  const key = Math.round(p * 400);
  if (key === R.last) return;
  R.last = key;
  const done = p >= 1;
  // data-done lifts every effect of the part off it for good, a finished part carries no filter, clip or transform
  if (done !== R.done) {
    R.done = done;
    R.el.toggleAttribute('data-done', done);
  }
  const n = R.units.length;
  if (!n) {
    R.el.style.setProperty('--tp', outCubic(p).toFixed(3));
    return;
  }
  const step = R.lines > 1 ? Math.min(LINE_STEP, STEP_BUDGET / (R.lines - 1)) : 0;
  const span = 1 - (R.lines - 1) * step;
  for (let i = 0; i < n; i++) {
    const U = R.units[i];
    const lp = outCubic(clamp01((p - U.line * step) / span));
    // the wipe's front runs across the line, a word is uncovered by the share of it the front has passed
    const t = TEXT === 4 ? clamp01((lp - U.fa) / Math.max(0.0001, U.fb - U.fa)) : lp;
    U.c.style.setProperty('--tp', t.toFixed(3));
  }
}
