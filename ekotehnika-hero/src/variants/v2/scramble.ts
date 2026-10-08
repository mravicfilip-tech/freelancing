// Scroll driven letter scramble in the United Carriers reel's style. Letters resolve left to right,
// the unresolved tail shows random glyphs that change as the scroll moves, and the line carries a
// red and white ghost offset while it settles.

const GLYPHS = 'ABCDEFGHIJKLMNOPRSTUVZŠŽČĆĐ#/=+<>*%&';

const hash = (i: number, j: number) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type ScrambleLine = {
  el: HTMLElement;
  done: HTMLElement;
  tail: HTMLElement;
  text: string;
  seed: number;
  last: string;
};

// Builds the two spans a line needs, the resolved head and the scrambling tail.
export function makeLine(el: HTMLElement, seed: number): ScrambleLine {
  const text = el.dataset.text ?? el.textContent ?? '';
  el.textContent = '';
  const done = document.createElement('span');
  const tail = document.createElement('span');
  tail.className = 'v2-tail';
  tail.setAttribute('aria-hidden', 'true');
  el.append(done, tail);
  el.setAttribute('aria-label', text);
  done.setAttribute('aria-hidden', 'true');
  return { el, done, tail, text, seed, last: '' };
}

// t 0 shows nothing, t 1 shows the full text.
export function setLine(l: ScrambleLine, t: number) {
  const n = l.text.length;
  const k = Math.max(0, Math.min(1, t));
  const head = k >= 1 ? n : Math.floor(Math.max(0, (k - 0.3) / 0.7) * n);
  const lead = Math.min(n, Math.ceil(Math.min(1, k / 0.55) * n));
  const frame = Math.floor(k * 46);
  let tail = '';
  for (let i = head; i < lead; i++) {
    const ch = l.text[i];
    tail += ch === ' ' || ch === '\n' ? ch : GLYPHS[Math.floor(hash(i + l.seed, frame) * GLYPHS.length)];
  }
  const key = head + '|' + tail;
  if (key === l.last) return;
  l.last = key;
  l.done.textContent = l.text.slice(0, head);
  l.tail.textContent = tail;
  const g = k > 0 && k < 1 ? (1 - k) : 0;
  if (g > 0) {
    const dx = (6 + 10 * g) * (hash(l.seed, frame) > 0.5 ? 1 : -1) * g;
    l.el.style.textShadow = `${dx.toFixed(1)}px 0 0 rgba(204,19,42,0.55), ${(-dx * 0.7).toFixed(1)}px 0 0 rgba(255,255,255,0.28)`;
    l.el.style.filter = g > 0.45 ? `blur(${(g * 1.2).toFixed(2)}px)` : '';
  } else {
    l.el.style.textShadow = '';
    l.el.style.filter = '';
  }
}
