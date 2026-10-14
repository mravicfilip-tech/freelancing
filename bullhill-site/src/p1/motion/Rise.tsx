import { Fragment, createElement, useLayoutEffect, useRef } from 'react';
import { useInView } from './motion';

// The one type move. Every headline rises out of a mask line by line, 600ms, 80ms between lines,
// the same move as hero beat 1. Each word sits in its own mask, and words on the same line share
// a delay, so it reads as lines. The line of each word is measured, again once the fonts are in,
// and again on resize.
// `children` is the text, or an array of parts that keep their own span, for split headlines.
// Use it for section headlines, h1 and h2. Card titles move with their card.

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

export function Rise({ as = 'h2', className, id, children }: { as?: Tag; className?: string; id?: string; children: string | string[] }) {
  const ref = useRef<HTMLElement>(null);
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
  }, [children]);
  const parts = Array.isArray(children) ? children : [children];
  // A German word with soft hyphens is split into its pieces, each in its own mask, so the word can
  // still break at a hyphen. The hyphen sits between the masks, in a span that fades in late.
  const words = (text: string) =>
    text.split(' ').map((w, i) => (
      <Fragment key={i}>
        {i ? ' ' : null}
        {w.split('\u00ad').map((piece, k) => (
          <Fragment key={k}>
            {k ? <span className="rise__shy">{'\u00ad'}</span> : null}
            <span className="rise__w">
              <span className="rise__i">{piece}</span>
            </span>
          </Fragment>
        ))}
      </Fragment>
    ));
  return createElement(
    as,
    { ref, id, className: `rise${className ? ` ${className}` : ''}` },
    Array.isArray(children)
      ? parts.map((part, i) => (
          <Fragment key={i}>
            {i ? ' ' : null}
            <span className="rise__part">{words(part)}</span>
          </Fragment>
        ))
      : words(children),
  );
}
