import { Fragment, createElement, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { motionOn, useInView } from './motion';

// The one type move, after landonorris.com, taste.md 2026-10-14 18:57. Every line of a headline or of
// the body copy beside it is covered by a solid block in the text's own colour. The block wipes in
// from the left until it covers the line, the text is set under it, then the block wipes off to the
// right and the text shows as it leaves. Lines stagger 120ms apart. A Rise that follows another Rise
// in the same section, the headline then its body copy, waits for the last line of the one before it.
// Blocks are one element per line, measured from that line's words, again once the fonts are in and
// on resize. Words keep their own box so a line breaks where it always did, and a German word with
// soft hyphens is still split into its pieces so it can break at a hyphen.
// Motion off, nothing here is rendered or styled, the text is the settled text.
// `children` is the text, or an array of parts that keep their own span, for split headlines.
// `body` is for running text, the lede, a paragraph or a mono kicker. Its words are plain inline spans,
// so the block is one line high. With motion off a body Rise is the plain text, not split at all.
// `plain` is the same for a headline that was not on Rise before, with motion off it stays the plain text.
// Headlines keep their word boxes.
// `at` ranks a Rise inside its section when it should start before one that comes earlier in the
// markup. Use it for section headlines, h1 and h2, and for the body copy beside them.

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

const STEP = 120; // ms between lines, landonorris measures 100 to 150 on the headline lines

type Block = { x: number; y: number; w: number; h: number; i: number };
const lineCount = new WeakMap<HTMLElement, number>();
const plans = new WeakMap<HTMLElement, { t0: number; end: number }>();

const scopeOf = (el: HTMLElement) => el.closest<HTMLElement>('[data-rise-scope], section, footer');
function rankIn(el: HTMLElement, scope: HTMLElement) {
  const at = el.dataset.at;
  return at !== undefined ? Number(at) : Array.from(scope.querySelectorAll('.rise')).indexOf(el);
}

// When the lines of `el` start, as a lead in ms. It waits for every Rise ranked before it in its
// section that is still running its lines, and starts at once after any that has finished.
function plan(el: HTMLElement) {
  let p = plans.get(el);
  if (p) return p;
  const now = performance.now();
  const scope = scopeOf(el);
  let lead = 0;
  if (scope) {
    const mine = rankIn(el, scope);
    scope.querySelectorAll<HTMLElement>('.rise').forEach((o) => {
      if (o === el || o.dataset.in !== 'yes' || rankIn(o, scope) >= mine) return;
      const q = plan(o);
      lead = Math.max(lead, q.t0 + q.end - now);
    });
  }
  lead = Math.max(0, Math.round(lead));
  p = { t0: now, end: lead + (lineCount.get(el) ?? 1) * STEP };
  plans.set(el, p);
  el.style.setProperty('--lo', `${lead}ms`);
  return p;
}

export function Rise({ as = 'h2', className, id, at, body, plain, children }: { as?: Tag; className?: string; id?: string; at?: number; body?: boolean; plain?: boolean; children: string | string[] }) {
  const ref = useRef<HTMLElement>(null);
  const [on] = useState(motionOn);
  const [blocks, setBlocks] = useState<Block[]>([]);
  useInView(ref);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mark = () => {
      const words = el.querySelectorAll<HTMLElement>('.rise__w');
      const tops: number[] = [];
      words.forEach((w) => {
        const t = Math.round(w.offsetTop);
        let i = tops.findIndex((v) => Math.abs(v - t) < 4);
        if (i < 0) i = tops.push(t) - 1;
        w.style.setProperty('--li', String(i));
      });
      // the hyphen of a broken word sits on the line of the piece before it
      el.querySelectorAll<HTMLElement>('.rise__shy').forEach((s) => {
        const w = s.previousElementSibling as HTMLElement | null;
        s.style.setProperty('--li', w?.style.getPropertyValue('--li') || '0');
      });
      lineCount.set(el, Math.max(1, tops.length));
      if (!on) return;
      // one block per line, from the words on it. The word box carries 0.14em above and 0.1em below
      // its line, taken back by margins, so the block is the line box with a little side bleed.
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      const o = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize) || 16;
      const lh = parseFloat(cs.lineHeight) || fs * 1.2;
      const lines: { l: number; t: number; r: number; b: number }[] = [];
      words.forEach((w) => {
        const r = w.getBoundingClientRect();
        if (!r.width) return;
        const i = Number(w.style.getPropertyValue('--li')) || 0;
        const q = (lines[i] ??= { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity });
        q.l = Math.min(q.l, r.left);
        q.r = Math.max(q.r, r.right);
        // a word box is its line plus 0.14em above and 0.1em below, a plain word is centred on its line
        const t = body ? (r.top + r.bottom) / 2 - lh / 2 : r.top + 0.14 * fs;
        q.t = Math.min(q.t, t);
        q.b = Math.max(q.b, body ? t + lh : r.bottom - 0.1 * fs);
      });
      el.querySelectorAll<HTMLElement>('.rise__shy').forEach((s) => {
        const r = s.getBoundingClientRect();
        const q = lines[Number(s.style.getPropertyValue('--li')) || 0];
        if (q && r.width > 0.5) q.r = Math.max(q.r, r.right);
      });
      const half = (v: number) => Math.round(v * 2) / 2;
      const next: Block[] = [];
      lines.forEach((q, i) => {
        if (q && q.r > q.l) next.push({ x: half(q.l - o.left - el.clientLeft), y: half(q.t - o.top - el.clientTop), w: half(q.r - q.l), h: half(q.b - q.t), i });
      });
      setBlocks((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    mark();
    // the web font changes where lines break without always changing the headline's size
    let live = true;
    document.fonts?.ready.then(() => live && mark());
    const ro = new ResizeObserver(mark);
    ro.observe(el);
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [children, on, body]);
  // the first time the Rise is marked in, work out when its lines start
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !on) return;
    const mo = new MutationObserver(() => {
      if (el.dataset.in !== 'yes') return;
      mo.disconnect();
      plan(el);
    });
    mo.observe(el, { attributes: true, attributeFilter: ['data-in'] });
    return () => mo.disconnect();
  }, [on]);
  const parts = Array.isArray(children) ? children : [children];
  // A German word with soft hyphens is split into its pieces, each in its own box, so the word can
  // still break at a hyphen. The hyphen sits between the boxes, in a span that shows with its line.
  const words = (text: string) =>
    text.split(' ').map((w, i) => (
      <Fragment key={i}>
        {i ? ' ' : null}
        {w.split('­').map((piece, k) => (
          <Fragment key={k}>
            {k ? <span className="rise__shy">{'­'}</span> : null}
            <span className="rise__w">
              <span className="rise__i">{piece}</span>
            </span>
          </Fragment>
        ))}
      </Fragment>
    ));
  return createElement(
    as,
    { ref, id, 'data-at': at, className: `rise${body ? ' rise--body' : ''}${className ? ` ${className}` : ''}` },
    Array.isArray(children)
      ? parts.map((part, i) => (
          <Fragment key={i}>
            {i ? ' ' : null}
            <span className="rise__part">{words(part)}</span>
          </Fragment>
        ))
      : (body || plain) && !on
        ? children
        : words(children),
    on
      ? blocks.map((b) => (
          <span key={b.i} className="rise__bl" aria-hidden="true" style={{ left: b.x, top: b.y, width: b.w, height: b.h, '--li': b.i } as CSSProperties}>
            <span className="rise__bk" />
          </span>
        ))
      : null,
  );
}
