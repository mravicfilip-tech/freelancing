// The load in of every part marked data-wipe. Round 7 took out the Rise of round 5, letters and words coming up from under a mask
// word by word, which Filip rejected (taste 2026-11-03 10:20, "so it comes down from the bottom word by word", "something more
// professional"). Round 7 then put four line level looks on the panel, and in round 8 he picked the first, "Use 01 Fade animation"
// (taste 2026-11-03 13:15). Fade is the only text animation now, Line mask, Blur and Wipe and the ?text switch are gone.
// Each line fades in while it drifts up 12px. Lines follow each other by LINE_STEP of the part's own progress, about 60ms at the pace
// of the hero block, and they are the lines as laid out, so a paragraph that wraps is told apart line by line. A part with no text of
// its own, an icon, a button or a counting figure, arrives whole in the same way, as one line. Nothing about a word is animated on its
// own, a word is only the unit the browser can break a line at. The look lives in shell.css under [data-wipe], this file sets one
// number, --tp from 0 to 1, on each unit. With none of the driving JS running, which is the reduced motion case, no --tp is set and
// every part shows its end state.

// the share of a part's progress between the start of one line and the start of the next
const LINE_STEP = 0.0625;
// no more than this much of the progress is spent waiting for the last line to start, so a long paragraph still ends together
const STEP_BUDGET = 0.6;

// A unit is one word or one inline image, in a box of its own. line is the line of the part it sits on.
type Unit = { c: HTMLElement; line: number };
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

// A unit in its box, the box the drift moves, see .rc in shell.css.
const box = (inner: Node) => {
  const c = document.createElement('span');
  c.className = 'rc';
  c.appendChild(inner);
  return c;
};

// Which line each unit sits on, from where the browser laid it out. offsetTop ignores the transform a unit is in the middle of, so a
// part can be measured while it arrives. Units on one line share a top to within half a unit's height, an inline image sits lower
// than a word, so the bottom edge is compared and not the top.
function measure(R: Rise) {
  let line = -1;
  let edge = -Infinity;
  R.units.forEach((u) => {
    const bottom = u.c.offsetTop + u.c.offsetHeight;
    if (line < 0 || Math.abs(bottom - edge) > Math.max(4, u.c.offsetHeight * 0.5)) {
      line++;
      edge = bottom;
    }
    u.line = line;
  });
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
          at.replaceWith(box(t));
          continue;
        }
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        const vis = document.createElement('span');
        vis.setAttribute('aria-hidden', 'true');
        for (const part of (t.nodeValue ?? '').split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) vis.appendChild(document.createTextNode(part));
          else vis.appendChild(box(document.createTextNode(part)));
        }
        t.parentNode!.insertBefore(sr, t);
        sr.appendChild(t);
        sr.after(vis);
      }
      el.setAttribute('data-rise', '');
    }
  }
  if (el.hasAttribute('data-rise')) {
    R.units = Array.from(el.querySelectorAll<HTMLElement>('.rc')).map((c) => ({ c, line: 0 }));
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
    U.c.style.setProperty('--tp', outCubic(clamp01((p - U.line * step) / span)).toFixed(3));
  }
}
