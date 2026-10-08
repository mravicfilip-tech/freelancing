// Scroll driven word by word reveal. Each word rises a little and fades in, one after another,
// with no stand in glyphs and no ghost offset.

export type WordLine = { words: HTMLElement[]; last: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const eout = (t: number) => 1 - (1 - t) ** 3;

// Splits the line's data-text into word spans.
export function makeWords(el: HTMLElement): WordLine {
  const text = el.dataset.text ?? el.textContent ?? '';
  el.textContent = '';
  const parts = text.split(' ');
  const words = parts.map((w, i) => {
    const s = document.createElement('span');
    s.className = 'v2-w';
    s.textContent = w;
    el.append(s);
    if (i < parts.length - 1) el.append(' ');
    return s;
  });
  return { words, last: -1 };
}

// t 0 shows nothing, t 1 shows every word at rest.
export function setWords(l: WordLine, t: number) {
  const k = clamp01(t);
  if (k === l.last) return;
  l.last = k;
  const n = l.words.length;
  const d = 1.6;
  const spread = n - 1 + d;
  l.words.forEach((w, i) => {
    const a = clamp01((k * spread - i) / d);
    const e = eout(a);
    w.style.opacity = String(e);
    w.style.transform = a >= 1 ? '' : `translateY(${((1 - e) * 0.32).toFixed(3)}em)`;
  });
}
