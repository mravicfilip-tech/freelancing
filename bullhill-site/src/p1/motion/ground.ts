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

// Bare text. Text, hairlines and bare buttons in Work, Services, Projects and Crew sit straight on the
// page ground, so while the ground changes they have to change with it. A colour that fades from light
// to dark crosses the ground at 1 to 1, so instead the text takes four steps by the live ground value g
// (0 black, 218 paper), d below 30 its dark colour, w below 117 white, k below 214 black, l its light
// colour. 117 is where white and black on the ground measure 4.6 to 1 each, so a frame on either side
// of the swap holds 4.5 to 1. The step is written as data-tx on .p1 and foundry.css does the rest. Buttons
// that sit on no panel of their own are marked data-bare, and take data-ground from the same step.

type Ground = 'dark' | 'light';
type Tx = 'd' | 'w' | 'k' | 'l';
const txFor = (g: number): Tx => (g < 30 ? 'd' : g < 117.2 ? 'w' : g < 214 ? 'k' : 'l');
const PAPER_G = 218;

// Whether a button has a panel of its own, the first opaque background above it before the page.
function onPanel(el: HTMLElement, root: HTMLElement): boolean {
  for (let n = el.parentElement; n && n !== root; n = n.parentElement) {
    const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
    if (m && m.length >= 3 && (m.length < 4 || Number(m[3]) >= 0.5)) return true;
  }
  return false;
}

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
  // a Rise splits its text into a span per word, so its words are measured as the one Rise box
  const seen = new Set<HTMLElement>();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue || !n.nodeValue.trim()) continue;
    const t = n.parentElement;
    const p = (t?.closest<HTMLElement>('.rise') ?? t) as HTMLElement | null;
    if (!p || seen.has(p)) continue;
    seen.add(p);
    if (p.closest('svg, [aria-hidden="true"], .sr-only, script, style')) continue;
    if (!p.getClientRects().length) continue;
    const top = pageTop(p) - base;
    first = Math.min(first, top);
    last = Math.max(last, top + p.offsetHeight);
  }
  return first === Infinity ? null : { first, last };
}

// `ready` is false while the sections after the hero are still mounting.
export function useGround(root: HTMLElement | null, ready = true) {
  useLayoutEffect(() => {
    if (!root || !ready || !motionOn()) return;
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

    // buttons straight on the page ground, read once while every section is transparent
    const bare = Array.from(root.querySelectorAll<HTMLElement>('.bk[data-btn]')).filter((b) => !onPanel(b, root));
    bare.forEach((b) => b.setAttribute('data-bare', ''));

    let tx: Tx | null = null;
    let target = 0;
    let track = 0;
    const setTx = (t: Tx) => {
      if (t === tx) return;
      tx = t;
      root.dataset.tx = t;
      const gr = t === 'd' || t === 'w' ? 'dark' : 'light';
      bare.forEach((b) => (b.dataset.ground = gr));
    };
    // follows the live ground through the transition, one read a frame, and stops once it lands
    const follow = () => {
      track = 0;
      const m = getComputedStyle(root).backgroundColor.match(/[\d.]+/g);
      const g = m ? Number(m[0]) : target;
      setTx(txFor(g));
      if (Math.abs(g - target) > 0.5) track = requestAnimationFrame(follow);
      else {
        setTx(txFor(target));
        delete root.dataset.gmid;
      }
    };

    let dir = 1;
    let anchor = window.scrollY;
    let shown: Ground | null = null;
    const apply = (g: Ground) => {
      if (g === shown) return;
      const first = shown === null;
      shown = g;
      target = g === 'light' ? PAPER_G : 0;
      cancelAnimationFrame(track);
      if (first) setTx(txFor(target));
      else {
        root.dataset.gmid = '';
        track = requestAnimationFrame(follow);
      }
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
      const g = secs[idx].ground;
      return () => apply(g);
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
      cancelAnimationFrame(track);
      bare.forEach((b) => b.removeAttribute('data-bare'));
      delete root.dataset.tx;
      delete root.dataset.gmid;
      ro.disconnect();
      window.removeEventListener('load', onLoad);
      root.style.removeProperty('--page');
      delete root.dataset.page;
      delete root.dataset.gt;
    };
  }, [root, ready]);
}
