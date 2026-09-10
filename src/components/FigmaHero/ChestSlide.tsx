import { useEffect, useMemo, useRef } from 'react';
import chestMarkup from './chest.svg?raw';
import { useChest } from './chestVariant';
import './ChestSlide.css';

/**
 * The hero's third slide: the line-art chest from Figma (node 2767:55), as a mechanism rather than
 * a drawing.
 *
 * The export is 226 separately named stroke segments in one `crate-lines` group — the designer
 * split it that way, so the crate is drawn rather than shown. Every direction runs the same four
 * beats: the crate draws itself in, the latch arms, the lid opens, and the crate gives up what is
 * inside it. They differ in how the lid moves and what the payload does once it is out.
 *
 * What comes out is the four coins the presale slide already floats and the Remittix mark, so the
 * chest is carrying the hero's own vocabulary rather than invented treasure.
 *
 * The asset is inlined at build time: the segments have to be in the document to be animated
 * individually, and a 31KB file is not worth a request and a flash of nothing.
 */

/** A measured segment: where its middle sits in viewBox units, and how long its stroke is. */
type Seg = { el: SVGPathElement; len: number; cx: number; cy: number };

/** How long the crate takes to draw itself in. */
const DRAW = 1.5;

/**
 * The lid is the top face and its rim. Measured off the export: the top face is a rhombus whose
 * corners sit at (204,6) (400,82) (204,156) (2,80) in the 401.5×406 viewBox, so a cut at 0.38 of
 * the height takes the face and its brackets and leaves the body alone.
 */
const LID_CUT = 0.38;
/** The middle of that rhombus — where the lid parts from the body, and so where everything comes from. */
const SEAM = { x: 204, y: 81 };
/** The rear corner, which the lid swings about. */
const HINGE = '204 30';

/**
 * The crate's three visible faces, in viewBox units.
 *
 * The export is line work with no fills, which on its own is a wireframe: anything placed behind it
 * shows through every panel, so light meant to escape the opening lit the lid's face and both `?`
 * panels instead. Filling the faces is what makes it a box — it gives the crate volume on a light
 * page, and it gives the opening something to be an opening in.
 *
 * The box is a regular isometric solid, so the bottom face is the top translated down by its height:
 * the top rhombus corners measured at (204,6) (400,82) (204,156) (2,80) and the crate bottoming out
 * at y=405 puts that height at 249.
 */
const TOP = '204,6 400,82 204,156 2,80';
/* The mouth is not the lid: the lid covers the crate's outer rim, while the hole it covers is
   inside it. The same rhombus at nine tenths about its own middle keeps the opening within the
   box's silhouette, so the dark of the inside never reads as a slab laid over the edge. */
const MOUTH = '204,13.5 380,82 204,148 22,80';
const LEFT = '2,80 204,156 204,405 2,329';
const RIGHT = '204,156 400,82 400,331 204,405';

/** What the chest is carrying. The four coins the presale slide floats, and the mark. */
/* The mark sits in the middle of the five, not at one end: the directions that fan the payload out
   place each item by its distance from the centre, so last in this list means furthest right —
   which put the brand in the corner, colliding with the raised lid, instead of at the head of what
   the chest gives up. */
const PAYLOAD: { src: string; size: number; mark?: boolean }[] = [
  { src: '/figma/coin-btc.svg', size: 34 },
  { src: '/figma/coin-eth.svg', size: 30 },
  { src: '/figma/logo.svg', size: 40, mark: true },
  { src: '/figma/coin-usdt.svg', size: 32 },
  { src: '/figma/coin-sol.svg', size: 28 },
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function ChestSlide({ active }: { active: boolean }) {
  const variant = useChest();
  const host = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  // The markup is a build-time constant from this repo. `preserveAspectRatio` is the one thing the
  // export gets wrong for our box — it ships `none`, which would stretch the crate to the slide's
  // shape — so it is corrected here rather than by editing the asset's bytes.
  const markup = useMemo(() => chestMarkup.replace('preserveAspectRatio="none"', 'preserveAspectRatio="xMidYMid meet"'), []);

  useEffect(() => {
    const root = host.current;
    if (!active || !root) return;
    /* The art's own svg, not merely the first one in the slide: the rays and the shockwave are svgs
       too, and are rendered around the crate — a loose query would measure one of those. */
    /* The effect owns this subtree outright rather than sharing it with React. The crate is not
       only the export's markup: the faces, the interior and the lid group are built into it here,
       and anything React does to the container afterwards takes them out again — leaving the coins
       still flying out of a crate that had quietly become a static drawing. Writing the markup
       here, into a container React only ever sees as empty, means nothing else can reach it. */
    const holder = art.current;
    if (!holder) return;
    if (!holder.firstChild) holder.innerHTML = markup;
    const svg = holder.querySelector('svg');
    if (!svg) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: { revert: () => void } | undefined;
    let live = true;
    let started = false;

    // Measure once. getBBox is a layout read, so all of them happen together before anything is set.
    const segs: Seg[] = Array.from(svg.querySelectorAll<SVGPathElement>('path[id^="seg-"]')).map((el) => {
      const b = el.getBBox();
      return { el, len: el.getTotalLength(), cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
    });
    if (!segs.length) return;

    const ys = segs.map((s) => s.cy);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = maxY - minY || 1;
    const up = (s: Seg) => (maxY - s.cy) / span;
    const down = (s: Seg) => (s.cy - minY) / span;
    const isLid = (s: Seg) => down(s) < LID_CUT;

    /* The crate is built up around the line work, in paint order: the two body faces, the dark
       interior they enclose, the light rising out of it, then the export's own strokes, and last
       the lid — its own face and its own strokes — as one group that can be lifted off. */
    const NS = 'http://www.w3.org/2000/svg';
    const make = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    };
    const lines = svg.querySelector('#crate-lines');
    if (!lines) return;

    const defs = make('defs', {});
    defs.innerHTML =
      `<radialGradient id="chest-inner"><stop offset="0" class="chest__innerHot"/><stop offset="1" class="chest__innerCold"/></radialGradient>` +
      `<clipPath id="chest-mouth"><polygon points="${MOUTH}"/></clipPath>`;
    svg.insertBefore(defs, svg.firstChild);

    // the body, filled — the faces the line work only outlines
    lines.insertBefore(make('polygon', { class: 'chest__face chest__face--right', points: RIGHT }), lines.firstChild);
    lines.insertBefore(make('polygon', { class: 'chest__face chest__face--left', points: LEFT }), lines.firstChild);
    // the inside of the box, and the light in it — both clipped to the mouth, so neither can spill
    // onto a panel the lid is no longer covering
    const mouth = make('g', { 'clip-path': 'url(#chest-mouth)' });
    mouth.appendChild(make('polygon', { class: 'chest__inner', points: MOUTH }));
    mouth.appendChild(make('ellipse', { class: 'chest__innerGlow', cx: String(SEAM.x), cy: String(SEAM.y), rx: '150', ry: '64' }));
    lines.insertBefore(mouth, lines.children[2] ?? null);

    /* The lid has to move as one piece, so its own face and its segments go into a group of their
       own. Appending it last puts it above the body, which is what an opening lid wants. */
    const lidG = make('g', { class: 'chest__lid' });
    lines.appendChild(lidG);
    lidG.appendChild(make('polygon', { class: 'chest__face chest__face--top', points: TOP }));
    segs.filter(isLid).forEach((s) => lidG.appendChild(s.el));

    if (!reduced) {
      segs.forEach((s) => {
        s.el.style.strokeDasharray = String(s.len);
        s.el.style.strokeDashoffset = String(s.len);
        s.el.style.opacity = '0';
      });
    }
    root.dataset.motion = 'ready';

    /* If the import never arrives, the crate is still the design: drawn, just not drawing. */
    const failsafe = window.setTimeout(() => {
      if (started) return;
      segs.forEach((s) => {
        s.el.style.strokeDasharray = 'none';
        s.el.style.strokeDashoffset = '0';
        s.el.style.opacity = '1';
      });
    }, 2600);

    import('gsap').then(({ gsap }) => {
      if (!live) return;
      started = true;
      window.clearTimeout(failsafe);

      ctx = gsap.context(() => {
        const coins = gsap.utils.toArray<HTMLElement>('.chest__coin');

        if (reduced) {
          // Drawn and open, with the payload placed: the still frame is the whole design.
          gsap.set(segs.map((s) => s.el), { strokeDasharray: 'none', strokeDashoffset: 0, opacity: 1 });
          gsap.set(lidG, { y: -30, rotation: -5, svgOrigin: HINGE });
          gsap.set('.chest__face, .chest__inner', { opacity: 1 });
          gsap.set('.chest__innerGlow', { opacity: 1 });
          gsap.set('.chest__glow', { opacity: 0.7 });
          coins.forEach((c, i) => gsap.set(c, { x: (i - 2) * 52, y: -70 - (i % 2) * 22, scale: 1, opacity: 1 }));
          return;
        }

        // ---- 1 · the crate draws itself in, from the base up ----
        const entry = gsap.timeline();
        segs.forEach((s) => {
          const at = up(s) * DRAW;
          entry.to(s.el, { opacity: 1, duration: 0.14, ease: 'none' }, at);
          entry.to(s.el, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, at);
        });

        gsap.set(coins, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0 });
        /* The faces arrive behind the finished line work rather than with it: the crate is drawn
           first, as a drawing, and only then becomes a solid the light cannot pass through. */
        gsap.set('.chest__face, .chest__inner, .chest__innerGlow', { opacity: 0 });
        entry.to('.chest__face', { opacity: 1, duration: 0.5, ease: 'power2.out' }, DRAW * 0.72);
        entry.to('.chest__inner', { opacity: 1, duration: 0.4 }, DRAW * 0.8);

        /* ---- 2-4 · arm, open, empty — and again ----
           One repeating timeline, so the chest is a mechanism running rather than an entrance that
           happened once. The lid closes at the end of each pass and the payload resets to the seam. */
        const cycle = gsap.timeline({ repeat: -1, repeatDelay: 0.9, delay: DRAW + 0.35 });

        // the latch arming: the crate takes a breath in before it gives
        cycle.to(svg, { scale: 0.985, duration: 0.26, ease: 'power2.in', transformOrigin: '50% 88%' }, 0);
        cycle.to(svg, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.6)', transformOrigin: '50% 88%' }, 0.26);

        // the light in the box, which is clipped to the mouth, and the bloom of it that gets out
        cycle.to('.chest__innerGlow', { opacity: 0.8, duration: 0.45, ease: 'power2.out' }, 0.32);
        cycle.to('.chest__glow', { opacity: 0.5, scale: 1, duration: 0.55, ease: 'power2.out' }, 0.34);
        cycle.fromTo('.chest__ray', { scaleY: 0.25, opacity: 0 },
          { scaleY: 1, opacity: 0.3, duration: 0.6, ease: 'power3.out', stagger: 0.03 }, 0.36);

        // the lid, per direction
        const OPEN = { duration: 0.62, ease: 'back.out(1.6)', svgOrigin: HINGE } as const;
        if (variant === '1') cycle.to(lidG, { y: -78, rotation: -11, ...OPEN }, 0.3);
        if (variant === '2') cycle.to(lidG, { y: -96, ...OPEN }, 0.3);
        if (variant === '3') cycle.to(lidG, { y: -124, rotation: -20, x: 24, duration: 0.34, ease: 'power4.out', svgOrigin: HINGE }, 0.3);
        if (variant === '4') cycle.to(lidG, { y: -86, rotation: 13, ...OPEN }, 0.3);
        if (variant === '5') cycle.to(lidG, { y: -30, x: -118, ...OPEN }, 0.3);

        // ---- what comes out ----
        const EMIT = 0.55;
        coins.forEach((c, i) => {
          const at = EMIT + i * 0.07;
          const n = i - (PAYLOAD.length - 1) / 2;
          gsap.set(c, { x: 0, y: 0 });

          if (variant === '1') {
            // an arc out of the seam into a fan that hangs above the crate
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: -30 },
              { x: n * 66, y: -92 + Math.abs(n) * 13, scale: 1, opacity: 1, rotation: 0, duration: 0.95, ease: 'back.out(1.2)' }, at);
            cycle.to(c, { y: `-=${rand(7, 13)}`, duration: rand(1.1, 1.6), yoyo: true, repeat: 2, ease: 'sine.inOut' }, at + 0.95);
            cycle.to(c, { y: '+=26', opacity: 0, scale: 0.8, duration: 0.5, ease: 'power2.in' }, at + 4.2);
          }

          if (variant === '2') {
            // a column rising through the opening, then peeling off and drifting down past the crate
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.2, opacity: 0 },
              { x: n * 8, y: -132, scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' }, at);
            cycle.to(c, { x: n * 96, y: -46, duration: 0.9, ease: 'power1.inOut' }, at + 0.8);
            cycle.to(c, { y: 96, opacity: 0, duration: 1.5, ease: 'power1.in' }, at + 1.7);
          }

          if (variant === '3') {
            // thrown clear, with the shockwave — the whole thing re-arms and does it again
            const a = -Math.PI / 2 + n * 0.42;
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.3, opacity: 0, rotation: 0 },
              { x: Math.cos(a) * 190, y: Math.sin(a) * 165, scale: 1, opacity: 1, rotation: n * 60,
                duration: 1.05, ease: 'power3.out' }, at);
            cycle.to(c, { opacity: 0, scale: 0.7, duration: 0.5, ease: 'power2.in' }, at + 1.05);
          }

          if (variant === '4') {
            // drawn up and around, the way the orbit in How It Works turns
            const turn = { value: 0 };
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, at);
            cycle.to(turn, {
              value: 1, duration: 2.6, ease: 'power1.out',
              onUpdate: () => {
                const t = turn.value;
                const a = -Math.PI / 2 + t * Math.PI * 1.5 + i * 0.9;
                const r = 20 + t * 104;
                gsap.set(c, { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.62 - t * 62 });
              },
            }, at);
            cycle.to(c, { opacity: 0, scale: 0.75, duration: 0.6, ease: 'power2.in' }, at + 2.3);
          }

          if (variant === '5') {
            // handed out one at a time and queued in a row, the way a payout run lists
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.2, opacity: 0 },
              { x: -8, y: -96, scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }, at);
            cycle.to(c, { x: (i - 2) * 58, y: -118, duration: 0.55, ease: 'power2.inOut' }, at + 0.5);
            cycle.to(c, { y: '-=6', duration: 0.9, yoyo: true, repeat: 3, ease: 'sine.inOut' }, at + 1.05);
            cycle.to(c, { opacity: 0, x: '+=34', duration: 0.5, ease: 'power2.in' }, at + 4.4);
          }
        });

        // the shockwave, on the direction that snaps
        if (variant === '3') {
          cycle.fromTo('.chest__waveRing', { attr: { r: 12 }, opacity: 0.75, strokeWidth: 3 },
            { attr: { r: 190 }, opacity: 0, strokeWidth: 0.6, duration: 1.1, ease: 'power2.out' }, 0.5);
        }

        // ---- the lid comes back down, and the mechanism re-arms ----
        const CLOSE = variant === '3' ? 5.0 : 5.6;
        cycle.to('.chest__ray', { opacity: 0, scaleY: 0.2, duration: 0.5, ease: 'power2.in' }, CLOSE - 0.4);
        cycle.to('.chest__glow, .chest__innerGlow', { opacity: 0, duration: 0.6, ease: 'power2.in' }, CLOSE - 0.3);
        cycle.to(lidG, { y: 0, x: 0, rotation: 0, duration: 0.7, ease: 'power3.inOut', svgOrigin: HINGE }, CLOSE);
        cycle.to(svg, { scale: 1, duration: 0.3 }, CLOSE);
        cycle.set(coins, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0 }, CLOSE + 0.7);

        // and the crate itself never sits perfectly still
        gsap.to('.chest__stage', { y: -6, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
        gsap.to('.chest__shadow', { scaleX: 0.9, opacity: 0.55, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
      }, root);
    });

    return () => {
      live = false;
      window.clearTimeout(failsafe);
      ctx?.revert();
    };
  }, [active, variant, markup]);

  return (
    <div ref={host} className="chest" data-variant={variant} data-motion="pending">
      <div className="chest__stage">
        <div className="chest__shadow" aria-hidden="true" />
        {/* the light that comes up out of the seam once the lid parts */}
        <div className="chest__glow" aria-hidden="true" />
        <svg className="chest__rays" viewBox="0 0 401.5 406" aria-hidden="true">
          {[-34, -18, 0, 18, 34].map((deg) => (
            <rect key={deg} className="chest__ray" x={SEAM.x - 5} y={SEAM.y - 210} width="10" height="210" rx="5"
              transform={`rotate(${deg} ${SEAM.x} ${SEAM.y})`} />
          ))}
        </svg>
        <div ref={art} className="chest__art" />
        <svg className="chest__wave" viewBox="0 0 401.5 406" aria-hidden="true">
          <circle className="chest__waveRing" cx={SEAM.x} cy={SEAM.y} r="12" />
        </svg>
        <div className="chest__payload" aria-hidden="true">
          {PAYLOAD.map((p) => (
            <img key={p.src} className="chest__coin" data-mark={p.mark || undefined} src={p.src} alt=""
              style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
