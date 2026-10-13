// The load in of every part marked data-wipe, the Rise from Filip's round 5 board, in place of the block wipe he rejected
// (taste 2026-10-13 10:05, picked by Claude on his "just do the work, idc"). Text rises letter by letter, each letter out of
// its own mask at its baseline, a few letters in motion at once so a line reads as a wave. A part with no text of its own, an
// icon, a button or a counting figure, rises whole out of the mask of its own box. Nothing fades and no bar covers anything.
// With none of the driving JS running, which is the reduced motion case, every part shows its end state.

// letters in motion at once
const SPREAD = 6;

export type Rise = { el: HTMLElement; letters: HTMLElement[]; last: string };

// The text nodes of a part, leaving out svg and any part nested inside it that rises on its own.
function textNodes(el: HTMLElement): Text[] {
  const out: Text[] = [];
  const walk = (n: Node) => {
    for (const c of Array.from(n.childNodes)) {
      if (c.nodeType === Node.TEXT_NODE) {
        if ((c.nodeValue ?? '').trim()) out.push(c as Text);
      } else if (c instanceof HTMLElement && !c.hasAttribute('data-wipe')) walk(c);
    }
  };
  walk(el);
  return out;
}

// Split a part into words and letters, once. The original text node moves into a screen reader copy, so React keeps its node
// and the part reads as one string, and the letters beside it are hidden from assistive tech.
export function prepRise(el: HTMLElement): Rise {
  const whole = el.classList.contains('btn') || el.hasAttribute('data-count');
  if (el.hasAttribute('data-rise') || whole) return { el, letters: Array.from(el.querySelectorAll<HTMLElement>('.rc')), last: '' };
  const nodes = textNodes(el);
  if (!nodes.length) return { el, letters: [], last: '' };
  for (const t of nodes) {
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
      for (const ch of Array.from(part)) {
        const l = document.createElement('span');
        l.className = 'rl';
        const c = document.createElement('span');
        c.className = 'rc';
        c.textContent = ch;
        l.appendChild(c);
        w.appendChild(l);
      }
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
    R.letters[i].style.setProperty('--y', `${(100 * (1 - outCubic(t))).toFixed(0)}%`);
  }
}
