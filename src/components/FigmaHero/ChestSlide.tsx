import { useEffect, useMemo, useRef } from 'react';
import chestMarkup from './chest.svg?raw';
import { useChest } from './chestVariant';
import { buildCrate, make, isLid, HINGE, SPLIT, AXIS, SEAM, TOP } from './crate';
import './ChestSlide.css';

/**
 * The hero's third slide: the line-art chest from Figma (node 2767:55), as a mechanism.
 *
 * The export is 226 separately named stroke segments in one `crate-lines` group — the designer split
 * it that way, so the crate is drawn rather than shown. `crate.ts` builds that drawing up into a
 * solid: filled faces, a cavity with its own far walls and floor, and a lid with real thickness.
 *
 * Every direction runs the same beats — the crate draws itself in, the latch arms, the lid comes
 * off, and the chest gives up what is inside it, then closes and re-arms. They differ in how the lid
 * leaves and what the payload does once it is out.
 *
 * What comes out is the four coins the presale slide already floats and the Remittix mark, so the
 * chest carries the hero's own vocabulary rather than invented treasure.
 */

/** A measured segment: where its middle sits in viewBox units, and how long its stroke is. */
type Seg = { el: SVGPathElement; len: number; cx: number; cy: number };

/** How long the crate takes to draw itself in. */
const DRAW = 1.5;
/** When the lid starts coming back, and so how long one pass of the mechanism runs. */
const CLOSE = 5.6;

const PAYLOAD: { src: string; size: number; mark?: boolean }[] = [
  { src: '/figma/coin-btc.svg', size: 34 },
  { src: '/figma/coin-eth.svg', size: 30 },
  { src: '/figma/logo.svg', size: 40, mark: true },
  { src: '/figma/coin-usdt.svg', size: 32 },
  { src: '/figma/coin-sol.svg', size: 28 },
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* The feeds, in the slide's own 605×520 box: three a side, running in from the edge with one elbow
   and stopping clear of the crate. Mirrored, so the pair reads as one arrangement. */
const RAILS = [
  'M0 118 H74 L116 162 H140',
  'M0 250 H140',
  'M0 382 H74 L116 338 H140',
  'M605 118 H531 L489 162 H465',
  'M605 250 H465',
  'M605 382 H531 L489 338 H465',
];
/** Where each rail stops — the node the crate takes it at. */
const NODES: [number, number][] = [
  [140, 162], [140, 250], [140, 338],
  [465, 162], [465, 250], [465, 338],
];

export function ChestSlide({ active }: { active: boolean }) {
  const variant = useChest();
  const host = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  // `preserveAspectRatio` is the one thing the export gets wrong for our box — it ships `none`,
  // which would stretch the crate to the slide's shape.
  const markup = useMemo(() => chestMarkup.replace('preserveAspectRatio="none"', 'preserveAspectRatio="xMidYMid meet"'), []);

  useEffect(() => {
    const root = host.current;
    if (!active || !root) return;
    /* The effect owns this subtree outright rather than sharing it with React. The crate is not only
       the export's markup — the faces, the cavity and the lid are built into it here, and anything
       React does to the container afterwards takes them out again, leaving the payload flying out of
       a crate that had quietly become a static drawing. */
    const holder = art.current;
    if (!holder) return;
    if (!holder.firstChild) holder.innerHTML = markup;
    const svg = holder.querySelector('svg');
    if (!svg) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: { revert: () => void } | undefined;
    let live = true;
    let started = false;

    /* Every drawn path in the group, not only the ones named `seg-`: the two `?` glyphs on the side
       panels carry the ids `?` and `?_2`, so a prefix selector never saw them and they alone never
       received the draw-in the other 224 get. */
    const drawn = Array.from(svg.querySelectorAll<SVGPathElement>('#crate-lines > path'));
    const segs: Seg[] = drawn.map((el) => {
      const b = el.getBBox();
      return { el, len: el.getTotalLength(), cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
    });
    if (!segs.length) return;

    const ys = segs.map((s) => s.cy);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = maxY - minY || 1;
    const up = (s: Seg) => (maxY - s.cy) / span;

    /* The lid is what clears the seam, measured off each path rather than guessed from its height.
       A cut by centre-y took 35 of the body's paths with it — both side corner-brace plates, the rim
       fascia and the corner verticals — which is why the box lost its top edge and the opening sat
       proud of a crate that no longer had one, while six of the lid's own front-corner paths stayed
       behind. */
    const lidSegs = segs.filter((s) => isLid(s.el));

    const built = buildCrate(svg, lidSegs.map((s) => s.el));
    if (!built) return;
    const { lidG, lidFace, seam, pings } = built;

    /* The hatch parts the lid's panel rather than lifting the lid, so it needs a tighter cut than
       the others. The lid as a whole includes the crate's corner brackets and top rails, which read
       as part of the body where they meet it — carried off in different directions they tore the box
       apart. Only what sits on the flat panel inside the rim moves; the rim stays put. */
    const halfGs: SVGGElement[] = [];
    if (variant === '2') {
      lidFace.remove();
      SPLIT.forEach((points) => {
        const g = make('g', { class: 'chest__half' }) as SVGGElement;
        g.appendChild(make('polygon', { class: 'chest__face chest__face--top', points }));
        lidG.appendChild(g);
        halfGs.push(g);
      });
      // inside the mouth: |dx|/a + |dy|/b <= 1 on the measured slab, not on a bounding box
      const A = (TOP.r[0] - TOP.l[0]) / 2;
      const B = (TOP.f[1] - TOP.t[1]) / 2;
      lidSegs.forEach((s) => {
        const dx = s.cx - SEAM.x;
        const dy = s.cy - SEAM.y;
        if (Math.abs(dx) / A + Math.abs(dy) / B > 0.86) return;
        halfGs[dx < 0 ? 0 : 1].appendChild(s.el);
      });
    }

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
        const solid = '.chest__face, .chest__lip, .chest__floor, .chest__wall, .chest__rim';

        if (reduced) {
          gsap.set(segs.map((s) => s.el), { strokeDasharray: 'none', strokeDashoffset: 0, opacity: 1 });
          gsap.set(solid, { opacity: 1 });
          gsap.set(lidG, { y: -40, rotation: -7, svgOrigin: HINGE });
          gsap.set(seam, { opacity: 0.9 });
          gsap.set('.chest__badge', { opacity: 1 });
          coins.forEach((c, i) => gsap.set(c, { x: (i - 2) * 54, y: -86, scale: 1, opacity: 1 }));
          return;
        }

        // ---- the crate draws itself in, then becomes a solid ----
        const entry = gsap.timeline();
        segs.forEach((s) => {
          const at = up(s) * DRAW;
          entry.to(s.el, { opacity: 1, duration: 0.14, ease: 'none' }, at);
          entry.to(s.el, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, at);
        });
        gsap.set(solid, { opacity: 0 });
        gsap.set(coins, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0 });
        entry.to('.chest__face, .chest__lip', { opacity: 1, duration: 0.5, ease: 'power2.out' }, DRAW * 0.7);
        entry.to('.chest__floor, .chest__wall, .chest__rim', { opacity: 1, duration: 0.45 }, DRAW * 0.78);

        /* The feeds draw themselves in from the edges as the crate finishes, then each carries a
           light inward on a loop — a short dash on a long gap at a constant rate, which is the mark
           the orbit and the payment line are made of. */
        gsap.utils.toArray<SVGPathElement>('.chest__rail').forEach((rail, i) => {
          const len = rail.getTotalLength();
          entry.fromTo(rail, { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, DRAW * 0.5 + i * 0.05);
        });
        entry.fromTo('.chest__node', { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.8)', stagger: 0.04,
            transformOrigin: '50% 50%' }, DRAW * 0.9);
        gsap.utils.toArray<SVGPathElement>('.chest__spark').forEach((sp, i) => {
          const len = sp.getTotalLength();
          gsap.set(sp, { strokeDasharray: `${len * 0.09} ${len}`, strokeDashoffset: len * 0.09 });
          gsap.to(sp, { strokeDashoffset: -len, duration: 3.4, ease: 'none', repeat: -1,
            delay: DRAW + i * 0.55 });
        });

        // ---- arm, open, empty — and again ----
        const cycle = gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: DRAW + 0.4 });

        // the latch: the crate settles a hair before it gives
        cycle.to(svg, { scale: 0.986, duration: 0.24, ease: 'power2.in', transformOrigin: '50% 88%' }, 0);
        cycle.to(svg, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.55)', transformOrigin: '50% 88%' }, 0.24);

        /* The seam lights rather than the hole: a short dash on a long gap driven round the rim at a
           constant rate. One quick lap as the latch gives, then a slower one while it stands open —
           the same mark the orbit, the bolt and the payment line each announce themselves with. */
        const rimLen = seam.getTotalLength();
        gsap.set(seam, { strokeDasharray: `${rimLen * 0.12} ${rimLen - rimLen * 0.12}`, strokeDashoffset: 0 });
        cycle.to(seam, { opacity: 0.9, duration: 0.25 }, 0.24);
        cycle.fromTo(seam, { strokeDashoffset: 0 }, { strokeDashoffset: -rimLen, duration: 1.1, ease: 'none' }, 0.24);
        cycle.fromTo(seam, { strokeDashoffset: 0 }, { strokeDashoffset: -rimLen, duration: 2.6, ease: 'none' }, 1.34);
        // and the halo the site fires whenever something is reached
        pings.forEach((el, i) => {
          cycle.fromTo(el, { scale: 1, opacity: 0.55 },
            { scale: 2.1, opacity: 0, duration: 1.1, ease: 'power2.out', svgOrigin: SEAM.x + ' ' + SEAM.y }, 0.3 + i * 0.22);
        });
        // the sheen crossing the lid's face as it turns into the light
        cycle.fromTo('.chest__sheen', { x: 0, opacity: 0 }, { x: 620, opacity: 0.5, duration: 0.9, ease: 'power2.inOut' }, 0.3);
        cycle.to('.chest__sheen', { opacity: 0, duration: 0.3 }, 1.0);

        const OPEN = { duration: 0.75, ease: 'expo.out', svgOrigin: HINGE } as const;

        // ---- how the lid leaves ----
        if (variant === '1') {
          cycle.to(lidG, { y: -150, duration: 0.7, ease: 'expo.out', svgOrigin: HINGE }, 0.3);
          cycle.to(lidG, { rotation: -62, y: -166, duration: 0.8, ease: 'power3.inOut', svgOrigin: HINGE }, 0.9);
        }
        if (variant === '2') {
          // each half slides back along the box's own axis, so it stays true to the projection
          const D = 132;
          cycle.to(halfGs[0], { x: AXIS.left[0] * D, y: AXIS.left[1] * D, duration: 0.9, ease: 'expo.out' }, 0.3);
          cycle.to(halfGs[1], { x: AXIS.right[0] * D, y: AXIS.right[1] * D, duration: 0.9, ease: 'expo.out' }, 0.36);
        }
        if (variant === '3') cycle.to(lidG, { y: -104, rotation: -9, ...OPEN }, 0.3);
        if (variant === '4') {
          cycle.to(lidG, { y: -46, duration: 0.4, ease: 'power2.out', svgOrigin: HINGE }, 0.3);
          cycle.to(lidG, { rotation: 34, x: 40, y: 130, duration: 1.1, ease: 'power2.in', svgOrigin: `${TOP.f[0]} ${TOP.f[1]}` }, 0.7);
        }
        if (variant === '5') {
          cycle.to('.chest__face--top, .chest__lip, .chest__sheenClip', { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.3);
          lidSegs.forEach((s) => {
            cycle.to(s.el, {
              y: rand(-150, -80), x: rand(-70, 70), rotation: rand(-40, 40), opacity: 0,
              duration: rand(0.9, 1.5), ease: 'power2.out', svgOrigin: s.cx + ' ' + s.cy,
            }, 0.32 + Math.random() * 0.3);
          });
        }

        /* What comes out leaves the seam as the site's value-in-transit mark and resolves into the
           coin at the top of its rise, rather than the coin simply appearing out of the box. */
        const packets = gsap.utils.toArray<HTMLElement>('.chest__packet');
        gsap.set(packets, { x: 0, y: 0, opacity: 0, scale: 1 });
        packets.forEach((pk, i) => {
          const at = (variant === '1' ? 0.85 : 0.6) + i * 0.07;
          cycle.fromTo(pk, { x: 0, y: 0, opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' }, at - 0.22);
          cycle.to(pk, { y: -46, duration: 0.4, ease: 'power2.out' }, at - 0.22);
          cycle.to(pk, { opacity: 0, scale: 0.6, duration: 0.2, ease: 'power2.in' }, at + 0.08);
        });

        /* The payoff is a status, not a glare — the badge the orbit lands, in its own measurements. */
        cycle.fromTo('.chest__badge', { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)', transformOrigin: '0% 50%' }, 1.5);

        // ---- what comes out ----
        const EMIT = variant === '1' ? 0.85 : 0.6;
        coins.forEach((c, i) => {
          const at = EMIT + i * 0.07;
          const n = i - (PAYLOAD.length - 1) / 2;

          if (variant === '1') {
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.15, opacity: 0 },
              { x: n * 8, y: -120 - i * 6, scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, at);
            cycle.to(c, { x: n * 62, y: -152, duration: 0.7, ease: 'power3.inOut' }, at + 0.9);
            cycle.to(c, { y: '-=' + rand(6, 11), duration: rand(1.2, 1.7), yoyo: true, repeat: 1, ease: 'sine.inOut' }, at + 1.6);
            cycle.to(c, { opacity: 0, y: '+=22', duration: 0.5, ease: 'power2.in' }, CLOSE - 1.1);
          }

          if (variant === '2') {
            const a = -Math.PI / 2 + n * 0.5;
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.15, opacity: 0 },
              { x: Math.cos(a) * 122, y: Math.sin(a) * 96 - 36, scale: 1, opacity: 1, duration: 1, ease: 'expo.out' }, at);
            cycle.to(c, { y: '-=9', duration: rand(1.3, 1.8), yoyo: true, repeat: 1, ease: 'sine.inOut' }, at + 1);
            cycle.to(c, { opacity: 0, scale: 0.8, duration: 0.5, ease: 'power2.in' }, CLOSE - 1.1);
          }

          if (variant === '3') {
            // circling the crate: the far half passes behind it, the near half in front
            const turn = { v: 0 };
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out' }, at);
            cycle.to(turn, {
              v: 1, duration: CLOSE - at - 0.9, ease: 'none',
              onUpdate: () => {
                const a = -Math.PI / 2 + turn.v * Math.PI * 2 + i * 1.25;
                gsap.set(c, {
                  x: Math.cos(a) * 128,
                  y: Math.sin(a) * 42 - 76,
                  scale: 0.82 + (Math.sin(a) + 1) * 0.16,
                  zIndex: Math.sin(a) < 0 ? 1 : 6,
                });
              },
            }, at + 0.55);
            cycle.to(c, { opacity: 0, duration: 0.5, ease: 'power2.in' }, CLOSE - 0.9);
          }

          if (variant === '4') {
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.15, opacity: 0 },
              { x: n * 12, y: -34, scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }, at);
            cycle.to(c, { x: n * 26 + 16, y: 46, rotation: n * 40, duration: 0.6, ease: 'power1.in' }, at + 0.5);
            cycle.to(c, { x: n * 44 + 46, y: 205, rotation: n * 90, opacity: 0, duration: 1.1, ease: 'power2.in' }, at + 1.1);
          }

          if (variant === '5') {
            cycle.fromTo(c, { x: 0, y: 0, scale: 0.15, opacity: 0 },
              { x: n * 58, y: -104, scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out' }, at);
            cycle.to(c, { y: '-=' + rand(7, 12), duration: rand(1.2, 1.7), yoyo: true, repeat: 1, ease: 'sine.inOut' }, at + 1.1);
            cycle.to(c, { opacity: 0, scale: 0.85, duration: 0.5, ease: 'power2.in' }, CLOSE - 1.1);
          }
        });

        // ---- and it closes, and re-arms ----
        cycle.to(seam, { opacity: 0, duration: 0.5, ease: 'power2.in' }, CLOSE - 0.5);
        cycle.to('.chest__badge', { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.in' }, CLOSE - 0.5);
        cycle.to('.chest__packet', { opacity: 0, duration: 0.3 }, CLOSE - 0.5);
        if (variant === '2') {
          halfGs.forEach((g, i) => cycle.to(g, { x: 0, y: 0, duration: 0.85, ease: 'power3.inOut' }, CLOSE + i * 0.05));
        } else if (variant === '5') {
          cycle.to('.chest__face--top, .chest__lip, .chest__sheenClip', { opacity: 1, duration: 0.5 }, CLOSE + 0.2);
          cycle.to(lidSegs.map((s) => s.el), { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, CLOSE);
        } else {
          cycle.to(lidG, { y: 0, x: 0, rotation: 0, duration: 0.85, ease: 'power3.inOut', svgOrigin: HINGE }, CLOSE);
        }
        cycle.set(coins, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0, clearProps: 'zIndex' }, CLOSE + 0.85);

        // and the crate never sits perfectly still
        gsap.to('.chest__stage', { y: -6, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
        gsap.to('.chest__shadow', { scaleX: 0.9, opacity: 0.55, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
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
      <div className="chest__field" aria-hidden="true" />
      {/* The flanks. Tokenomics fills its width with hairline wires running in to the hub, each
          carrying a travelling light and ending in a node; the crate does the same, so the slide
          reads as something being fed rather than an object alone in the middle of a band. */}
      <svg className="chest__feed" viewBox="0 0 605 520" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        {RAILS.map((d, i) => (
          <g key={d} className="chest__railG">
            <path className="chest__rail" d={d} />
            <path className="chest__spark" d={d} data-i={i} />
          </g>
        ))}
        {NODES.map(([x, y]) => (
          <circle key={`${x}-${y}`} className="chest__node" cx={x} cy={y} r="3" />
        ))}
      </svg>
      <div className="chest__stage">
        <div className="chest__shadow" aria-hidden="true" />
        <div ref={art} className="chest__art" />
        <div className="chest__payload" aria-hidden="true">
          {PAYLOAD.map((p) => (
            <span key={p.src + '-pk'} className="chest__packet" />
          ))}
          {PAYLOAD.map((p) => (
            <span key={p.src} className="chest__coin" data-mark={p.mark || undefined}
              style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}>
              {/* The chain marks arrive as coins — a coloured disc with its glyph already on it. The
                  Remittix mark does not: it is flat wordmark art, so on its own it came out of the
                  crate as a bare M with nothing under it, dark on a light page and invisible on a
                  dark one. It gets the disc here, and takes its ink from the page rather than from
                  the asset, which is why it is masked rather than drawn. */}
              {p.mark ? <i className="chest__mark" /> : <img className="chest__coinArt" src={p.src} alt="" />}
            </span>
          ))}
        </div>
        <span className="chest__badge" aria-hidden="true">Presale live</span>
      </div>
    </div>
  );
}
