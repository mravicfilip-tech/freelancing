import { useLayoutEffect } from 'react';
import { motionOn, onScroll } from './motion';

// The page ground, briefs/website/round5-notes.md note 18, after landonorris.com.
// The page has one ground colour at a time. Each full width section declares its ground here, by its
// class or id, dark for --ground and light for --paper. As a section arrives the ground moves to its
// colour. The section backgrounds themselves go transparent under [data-motion='on'] in foundry.css,
// so this is the only thing that paints between sections.
//
// The controller writes --page on .p1 and data-page="dark|light". CSS carries the transition, 600ms
// on background-color, and the header reads the same two values. With motion off nothing runs and
// every section keeps its own background.
//
// The switch point. Scrolling down the ground changes as the incoming section's first text reaches
// the bottom of the viewport, so the 600ms runs while that text rises in and it never rests on the
// old ground. Scrolling up it changes as the section coming back from above has its last text reach
// the top. The outgoing text has the same 600ms to leave. Direction counts once the page has moved
// 12px against the last one, so a small back step does not flip the ground.

type Ground = 'dark' | 'light';

// In page order. Keep in step with the transparent list in foundry.css.
const SECTIONS: [string, Ground][] = [
  ['.hero', 'dark'],
  ['#work', 'dark'],
  ['#services', 'light'],
  ['#process', 'light'],
  ['#projects', 'light'],
  ['#crew', 'dark'],
  ['.auds', 'dark'],
  ['.faq', 'dark'],
  ['.conw', 'dark'],
  ['.end', 'dark'],
];

type Sec = { el: HTMLElement; ground: Ground; first: number; last: number };

// Top of an element from the document top by the offset chain, so transforms and the mask offsets
// of the text reveals do not move the measure.
function pageTop(el: HTMLElement): number {
  let y = 0;
  let e: HTMLElement | null = el;
  while (e) {
    y += e.offsetTop;
    e = e.offsetParent as HTMLElement | null;
  }
  return y;
}

// The first and last text of a section as offsets from its top, or null for a section with no text.
function textEdges(sec: HTMLElement): { first: number; last: number } | null {
  const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
  const base = pageTop(sec);
  let first = Infinity;
  let last = -Infinity;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue || !n.nodeValue.trim()) continue;
    const p = n.parentElement;
    if (!p || p.closest('svg, [aria-hidden="true"], .sr-only, script, style')) continue;
    if (!p.getClientRects().length) continue;
    const top = pageTop(p) - base;
    first = Math.min(first, top);
    last = Math.max(last, top + p.offsetHeight);
  }
  return first === Infinity ? null : { first, last };
}

export function useGround(root: HTMLElement | null) {
  useLayoutEffect(() => {
    if (!root || !motionOn()) return;
    const secs: Sec[] = [];
    for (const [sel, ground] of SECTIONS) {
      const el = root.querySelector<HTMLElement>(sel);
      if (el) secs.push({ el, ground, first: 0, last: 0 });
    }
    if (secs.length < 2) return;

    let dirty = true;
    const measure = () => {
      dirty = false;
      for (const s of secs) {
        const e = textEdges(s.el);
        s.first = e ? e.first : 0;
        s.last = e ? e.last : s.el.offsetHeight;
      }
    };

    let dir = 1;
    let anchor = window.scrollY;
    let shown: Ground | null = null;
    const apply = (g: Ground) => {
      if (g === shown) return;
      shown = g;
      root.style.setProperty('--page', g === 'light' ? 'var(--paper)' : 'var(--ground)');
      root.dataset.page = g;
      // the first ground is set with no transition, so a reload part way down does not fade from black
      if (!root.dataset.gt) requestAnimationFrame(() => (root.dataset.gt = 'on'));
    };

    const stop = onScroll((vh) => {
      if (dirty) measure();
      const y = window.scrollY;
      if (dir === 1) {
        if (y > anchor) anchor = y;
        else if (y < anchor - 12) {
          dir = -1;
          anchor = y;
        }
      } else if (y < anchor) anchor = y;
      else if (y > anchor + 12) {
        dir = 1;
        anchor = y;
      }

      // scrolling down the incoming section's first text is the edge, scrolling up the outgoing
      // section's last text is, both in viewport pixels
      let idx = 0;
      for (let k = 0; k < secs.length - 1; k++) {
        const a = secs[k];
        const b = secs[k + 1];
        const hit = dir === 1 ? b.el.getBoundingClientRect().top + b.first < vh : a.el.getBoundingClientRect().top + a.last <= 0;
        if (hit) idx = k + 1;
        else break;
      }
      apply(secs[idx].ground);
    });

    // layout moves as images and fonts land, so measure again then, and on a resize
    const ro = new ResizeObserver(() => {
      dirty = true;
    });
    ro.observe(root);
    void document.fonts?.ready.then(() => {
      dirty = true;
    });
    const onLoad = () => {
      dirty = true;
    };
    window.addEventListener('load', onLoad);

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener('load', onLoad);
      root.style.removeProperty('--page');
      delete root.dataset.page;
      delete root.dataset.gt;
    };
  }, [root]);
}
