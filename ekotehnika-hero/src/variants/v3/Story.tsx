// The film's words. Each statement is set in Geist 500, white, large and centred low, and comes in
// letter by letter as you scroll, each letter rising out of a blur. The second statement scrambles
// its leading letters as they land, the way the reel's wireframe line does.
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import gsap from 'gsap';
import { clamp01, range, smooth } from '../../scroll/useScrollStory';
import { S1, S2, S3 } from './copy';

type Block = {
  id: string;
  lines: string[];
  // reveal window per line, in story progress
  reveal: [number, number][];
  out: [number, number] | null;
  top: number;
  scramble?: boolean;
};

const BLOCKS: Block[] = [
  { id: 's1', lines: S1, reveal: [[0.008, 0.07], [0.07, 0.11], [0.11, 0.16]], out: [0.3, 0.38], top: 556 },
  { id: 's2', lines: S2, reveal: [[0.47, 0.535], [0.585, 0.635], [0.635, 0.69]], out: [0.765, 0.81], top: 470, scramble: true },
  { id: 's3', lines: S3, reveal: [[0.86, 0.905], [0.905, 0.95]], out: null, top: 630 },
];

const GLYPHS = 'abcdefghijklmnoprstuvzčćšžđ';
const WIN = 6;

export function Story({ progress, reduced, still }: { progress: MutableRefObject<number>; reduced: boolean; still: number }) {
  const root = useRef<HTMLDivElement>(null);
  const model = useMemo(
    () =>
      BLOCKS.map((b) => ({
        ...b,
        lines: b.lines.map((l) => l.split('')),
      })),
    [],
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const blocks = Array.from(el.querySelectorAll<HTMLElement>('[data-block]'));
    const chars = blocks.map((b) => Array.from(b.querySelectorAll<HTMLElement>('[data-line]')).map((l) => Array.from(l.querySelectorAll<HTMLElement>('[data-ch]'))));
    const last = new Map<HTMLElement, number>();
    const lastBlock = new Map<HTMLElement, number>();

    const paint = (p: number) => {
      model.forEach((b, bi) => {
        const be = blocks[bi];
        const o = b.out ? 1 - smooth(range(p, b.out[0], b.out[1])) : 1;
        const first = b.reveal[0][0];
        const vis = p >= first - 0.002 && o > 0.001 ? o : 0;
        const ok = Math.round(vis * 200) / 200;
        if (lastBlock.get(be) !== ok) {
          lastBlock.set(be, ok);
          be.style.opacity = String(ok);
          be.style.visibility = ok > 0 ? 'visible' : 'hidden';
          be.style.filter = ok > 0 && ok < 1 ? `blur(${((1 - ok) * 10).toFixed(1)}px)` : 'none';
          be.style.transform = `translate3d(0, ${(-(1 - ok) * 40).toFixed(1)}px, 0)`;
        }
        if (ok <= 0) return;
        b.lines.forEach((line, li) => {
          const [a, z] = b.reveal[li];
          const t = range(p, a, z);
          const n = line.length;
          chars[bi][li].forEach((ce, ci) => {
            const v = clamp01((t * (n + WIN) - ci) / WIN);
            const q = Math.round(v * 40) / 40;
            if (last.get(ce) === q && !(b.scramble && q > 0 && q < 0.8)) return;
            last.set(ce, q);
            const e = smooth(q);
            ce.style.opacity = String(e);
            ce.style.filter = q > 0 && q < 1 ? `blur(${((1 - e) * 12).toFixed(1)}px)` : 'none';
            ce.style.transform = q < 1 ? `translate3d(0, ${((1 - e) * 0.28).toFixed(3)}em, 0)` : 'none';
            const real = line[ci];
            if (b.scramble && real !== ' ') {
              ce.textContent = q > 0 && q < 0.8 && Math.random() < 0.7 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : real;
            }
          });
        });
      });
    };

    if (reduced) {
      paint(still);
      return;
    }
    const tick = () => paint(progress.current);
    gsap.ticker.add(tick);
    tick();
    return () => gsap.ticker.remove(tick);
  }, [model, progress, reduced, still]);

  return (
    <div ref={root} className="v3-story" aria-hidden="true">
      {model.map((b) => (
        <p key={b.id} data-block className={`v3-line v3-${b.id}`} style={{ top: b.top, opacity: 0, visibility: 'hidden' }}>
          {b.lines.map((line, li) => (
            <span key={li} data-line className="v3-row">
              {line.map((c, ci) => (
                <span key={ci} data-ch className="v3-ch" style={{ opacity: 0 }}>
                  {c === ' ' ? ' ' : c}
                </span>
              ))}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

// The same words for assistive tech and search, all at once.
export const STORY_TEXT = { h1: S1.join(' '), rest: [S2.join(' '), S3.join(' ')].join(' ') };
