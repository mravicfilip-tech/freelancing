// The load in of every part marked data-wipe, the Rise from Filip's round 5 board, in place of the block wipe he rejected
// (taste 2026-10-13 10:05, picked by Claude on his "just do the work, idc"). Text rises letter by letter, each letter out of
// its own mask at its baseline, a few letters in motion at once so a line reads as a wave. A part with no text of its own, an
// icon, a button or a counting figure, rises whole out of the mask of its own box. Nothing fades and no bar covers anything.
// With none of the driving JS running, which is the reduced motion case, every part shows its end state.

// letters in motion at once
const SPREAD = 6;

export type Rise = { el: HTMLElement; letters: HTMLElement[]; last: string };

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

const mask = (inner: Node) => {
  const l = document.createElement('span');
  l.className = 'rl';
  const c = document.createElement('span');
  c.className = 'rc';
  c.appendChild(inner);
  l.appendChild(c);
  return l;
};

// Split a part into words and letters, once. The original text node moves into a screen reader copy, so React keeps its node
// and the part reads as one string, and the letters beside it are hidden from assistive tech.
export function prepRise(el: HTMLElement): Rise {
  const whole = el.classList.contains('btn') || el.hasAttribute('data-count');
  if (el.hasAttribute('data-rise') || whole) return { el, letters: Array.from(el.querySelectorAll<HTMLElement>('.rc')), last: '' };
  const nodes = pieces(el);
  if (!nodes.some((n) => n.nodeType === Node.TEXT_NODE)) return { el, letters: [], last: '' };
  for (const t of nodes) {
    // an inline image rises in its place in the line, like one more letter
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
    const parts = (t.nodeValue ?? '').split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        vis.appendChild(document.createTextNode(part));
        continue;
      }
      const w = document.createElement('span');
      w.className = 'rw';
      for (const ch of Array.from(part)) w.appendChild(mask(document.createTextNode(ch)));
      vis.appendChild(w);
    }
    t.parentNode!.insertBefore(sr, t);
    sr.appendChild(t);
    sr.after(vis);
  }
  el.setAttribute('data-rise', '');
  return { el, letters: Array.from(el.querySelectorAll<HTMLElement>('.rc')), last: '' };
}

const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// p runs 0 to 1 over the load in of this part
export function setRise(R: Rise, p: number) {
  const key = String(Math.round(p * 400));
  if (key === R.last) return;
  R.last = key;
  const n = R.letters.length;
  if (!n) {
    R.el.style.setProperty('--wy', `${(100 * (1 - outCubic(p))).toFixed(1)}%`);
    return;
  }
  for (let i = 0; i < n; i++) {
    const t = Math.min(1, Math.max(0, (p * (n + SPREAD) - i) / SPREAD));
    R.letters[i].style.setProperty('--y', (1 - outCubic(t)).toFixed(3));
  }
}
