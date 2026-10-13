// The text load in for Filip's board, round 5 item 5, in place of the block wipe he rejected on text (taste 2026-10-13 10:05).
// Five reveals, picked with ?reveal=1 to 5 and shown on N's title and lede only until he answers with a number. With no
// param nothing changes anywhere. Each is driven by the scroll like the wipe it replaces, and none fades (taste 2026-10-12
// 17:55, nothing fades). Image, figure and cell reveals keep their wipes.
//   1 Rise      each letter rises out of a mask at its own box, one after another
//   2 Type on   letters set one by one behind a 2px ink caret, the caret leaves at the line end
//   3 Ink up    every letter waits in the fill grey and turns ink in reading order, the C1 lede fill used as the load in
//   4 Word slide  whole words slide in 24px from the left, each clipped at its own box
//   5 Settle    each letter cycles through two other letters of its own word before it lands, left to right
// With none of the driving JS running, which is the reduced motion case, every letter shows its end state.
import { clamp01 } from './motion';

export const REVEAL = (() => {
  const n = Number(new URLSearchParams(window.location.search).get('reveal'));
  return n >= 1 && n <= 5 ? n : 0;
})();

// letters a rise or a settle runs over at once, so the line reads as a wave and not one letter at a time
const SPREAD: Record<number, number> = { 1: 6, 5: 4 };
// words a slide runs over at once
const WORD_SPREAD = 1.5;

type Letter = { el: HTMLElement; ch: string; alt: [string, string]; last: string };
type Word = { el: HTMLElement; last: string };
export type Reveal = { el: HTMLElement; mode: number; order: number; letters: Letter[]; words: Word[]; key: string };

// two other letters of the same word, the next ones round the word, never the letter itself where the word allows
function altsOf(word: string, j: number): [string, string] {
  const others = Array.from(word).filter((c, i) => i !== j && c.toLowerCase() !== word[j].toLowerCase());
  if (!others.length) return [word[j], word[j]];
  return [others[j % others.length], others[(j + 1) % others.length]];
}

export function makeReveal(el: HTMLElement): Reveal {
  const words = Array.from(el.querySelectorAll<HTMLElement>('.rw'));
  const letters: Letter[] = [];
  for (const w of words) {
    const ls = Array.from(w.querySelectorAll<HTMLElement>('.rc'));
    const word = ls.map((l) => l.textContent ?? '').join('');
    ls.forEach((l, j) => letters.push({ el: l, ch: l.textContent ?? '', alt: altsOf(word, j), last: '' }));
  }
  return {
    el,
    mode: Number(el.dataset.reveal),
    order: el.dataset.order === undefined ? NaN : Number(el.dataset.order),
    letters,
    words: words.map((w) => ({ el: w, last: '' })),
    key: '',
  };
}

const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// p runs 0 to 1 over the reveal of this element
export function applyReveal(R: Reveal, p: number) {
  const key = String(Math.round(p * 400));
  if (key === R.key) return;
  R.key = key;
  const n = R.letters.length;

  if (R.mode === 4) {
    const m = R.words.length;
    R.words.forEach((W, i) => {
      const t = clamp01((p * (m + WORD_SPREAD) - i) / WORD_SPREAD);
      const s = t <= 0 ? 'h' : (24 * (1 - outCubic(t))).toFixed(1);
      if (s === W.last) return;
      W.last = s;
      W.el.dataset.s = s === 'h' ? 'h' : 'v';
      W.el.style.setProperty('--x', s === 'h' ? '-24px' : `-${s}px`);
    });
    return;
  }

  if (R.mode === 2 || R.mode === 3) {
    // letters on so far, the caret sits after the last one until the line is set
    const on = Math.round(p * n);
    R.letters.forEach((L, i) => {
      const s = i < on ? (R.mode === 2 && i === on - 1 && on < n ? 'c' : 'v') : 'h';
      if (s === L.last) return;
      L.last = s;
      L.el.dataset.s = s;
    });
    return;
  }

  const spread = SPREAD[R.mode];
  R.letters.forEach((L, i) => {
    const t = clamp01((p * (n + spread) - i) / spread);
    if (R.mode === 1) {
      const s = t <= 0 ? 'h' : (100 * (1 - outCubic(t))).toFixed(0);
      if (s === L.last) return;
      L.last = s;
      L.el.dataset.s = s === 'h' ? 'h' : 'v';
      L.el.style.setProperty('--y', s === 'h' ? '100%' : `${s}%`);
    } else {
      // settle, hidden, then the two other letters, then its own
      const c = t <= 0 ? '' : t < 0.4 ? L.alt[0] : t < 0.8 ? L.alt[1] : L.ch;
      const s = t <= 0 ? 'h' : c;
      if (s === L.last) return;
      L.last = s;
      L.el.dataset.s = t <= 0 ? 'h' : 'v';
      if (c) L.el.textContent = c;
    }
  });
}
