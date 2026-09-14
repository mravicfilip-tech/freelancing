import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import chestMarkup from '../../components/FigmaHero/chest.svg?raw';
import { buildCrate, isLid, tiltMatrix, TOP, SEAM } from '../../components/FigmaHero/crate';
import '../../components/FigmaHero/ChestSlide.css';

/**
 * The hero's chest (Figma node 2767:55), the line-art crate the third slide
 * draws and opens, brought to the reel as the box you open. Same drawing and
 * the same solid built around it (crate.ts); only the choreography is the
 * reel's own: the crate draws itself in and waits, latched; `open` lifts the
 * lid and throws the coins; `open` going false brings the lid back down.
 */
const DRAW = 1.2;
const GLYPH = 22;
const DISC = GLYPH * 2;
const PAYLOAD: { src: string; mark?: boolean }[] = [
  { src: '/figma/coin-btc.svg' },
  { src: '/figma/coin-eth.svg' },
  { src: '/figma/logo.svg', mark: true },
  { src: '/figma/coin-usdt.svg' },
  { src: '/figma/coin-sol.svg' },
];

type Built = {
  svg: SVGSVGElement;
  lidG: SVGGElement;
  seam: SVGPolygonElement;
  coins: HTMLElement[];
  root: HTMLDivElement;
};

export function MysteryChest({ open }: { open: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const built = useRef<Built | null>(null);
  const play = useRef<gsap.core.Timeline | null>(null);
  const markup = useMemo(() => chestMarkup.replace('preserveAspectRatio="none"', 'preserveAspectRatio="xMidYMid meet"'), []);

  /* Build once: the export's strokes, the faces and cavity around them, and
     the lid as one slab. Then the crate draws itself in. */
  useEffect(() => {
    const root = host.current;
    const holder = art.current;
    if (!root || !holder) return;
    if (!holder.firstChild) holder.innerHTML = markup;
    const svg = holder.querySelector('svg');
    if (!svg) return;
    const lineG = svg.querySelector('#crate-lines');
    if (lineG) svg.querySelectorAll<SVGPathElement>(':scope > g > path').forEach((el) => lineG.appendChild(el));
    const drawn = Array.from(svg.querySelectorAll<SVGPathElement>('#crate-lines > path'));
    const segs = drawn.map((el) => {
      const b = el.getBBox();
      return { el, len: el.getTotalLength(), cy: b.y + b.height / 2 };
    });
    if (!segs.length) return;
    const b = buildCrate(svg, segs.filter((s) => isLid(s.el)).map((s) => s.el));
    if (!b) return;
    /* The export draws the mark on the lid as line-art; the strokes inside the
       slab's middle are it, and they take the brand's lime. */
    const A = (TOP.r[0] - TOP.l[0]) / 2, B = (TOP.f[1] - TOP.t[1]) / 2;
    segs.forEach((sg) => {
      const bb = sg.el.getBBox();
      const dx = bb.x + bb.width / 2 - SEAM.x, dy = bb.y + bb.height / 2 - SEAM.y;
      if (isLid(sg.el) && Math.abs(dx) / A + Math.abs(dy) / B <= 0.42) sg.el.classList.add('chest__lidM');
    });
    const coins = Array.from(root.querySelectorAll<HTMLElement>('.chest__coin'));
    built.current = { svg, lidG: b.lidG as SVGGElement, seam: b.seam, coins, root };
    root.dataset.motion = 'ready';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const solid = '.chest__face, .chest__lip, .chest__floor, .chest__wall, .chest__rim';
      gsap.set(coins, { x: 0, y: 0, scale: 0.2, opacity: 0 });
      if (reduced) {
        gsap.set(solid, { opacity: 1 });
        return;
      }
      const maxY = Math.max(...segs.map((s) => s.cy));
      const minY = Math.min(...segs.map((s) => s.cy));
      const span = maxY - minY || 1;
      segs.forEach((s) => {
        s.el.style.strokeDasharray = String(s.len);
        s.el.style.strokeDashoffset = String(s.len);
        s.el.style.opacity = '0';
      });
      gsap.set(solid, { opacity: 0 });
      const entry = gsap.timeline();
      segs.forEach((s) => {
        const at = ((maxY - s.cy) / span) * DRAW;
        entry.to(s.el, { opacity: 1, duration: 0.14, ease: 'none' }, at);
        entry.to(s.el, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, at);
      });
      entry.to('.chest__face, .chest__lip', { opacity: 1, duration: 0.5, ease: 'power2.out' }, DRAW * 0.7);
      entry.to('.chest__floor, .chest__wall, .chest__rim', { opacity: 1, duration: 0.45 }, DRAW * 0.78);
      // and it never sits perfectly still
      gsap.to('.chest__stage', { y: -5, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
      gsap.to('.chest__shadow', { scaleX: 0.9, opacity: 0.55, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: DRAW });
    }, root);
    return () => {
      ctx.revert();
      built.current = null;
    };
  }, [markup]);

  /* Open and close. The latch gives, the seam lights, the lid lifts and hangs
     (the hero's own direction), the mouth blooms, the crate takes the recoil,
     and the coins are thrown up out of it. Closing brings the lid down and
     the box takes it. */
  useEffect(() => {
    const b = built.current;
    if (!b) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    play.current?.kill();
    const { svg, lidG, seam, coins, root } = b;
    const tilt = { phi: 0, lift: 0 };
    const applyTilt = () => lidG.setAttribute('transform', `translate(0 ${tilt.lift}) ${tiltMatrix(tilt.phi)}`);
    const rimLen = seam.getTotalLength();
    const q = gsap.utils.selector(root);

    if (reduced) {
      if (open) {
        tilt.phi = 0.16; tilt.lift = -104; applyTilt();
        gsap.set(seam, { opacity: 0.9 });
        coins.forEach((c, i) => gsap.set(c, { x: (i - 2) * 46, y: -100, scale: 1, opacity: 1 }));
      } else {
        tilt.phi = 0; tilt.lift = 0; applyTilt();
        gsap.set(seam, { opacity: 0 });
        gsap.set(coins, { opacity: 0, scale: 0.2, x: 0, y: 0 });
      }
      return;
    }

    const tl = gsap.timeline();
    play.current = tl;
    if (open) {
      tl.to(svg, { scale: 0.986, duration: 0.22, ease: 'power2.in', transformOrigin: '50% 88%' }, 0)
        .to(svg, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.55)', transformOrigin: '50% 88%' }, 0.22);
      gsap.set(seam, { strokeDasharray: `${rimLen * 0.12} ${rimLen - rimLen * 0.12}`, strokeDashoffset: 0 });
      tl.to(seam, { opacity: 0.9, duration: 0.2 }, 0.2)
        .fromTo(seam, { strokeDashoffset: 0 }, { strokeDashoffset: -rimLen, duration: 0.9, ease: 'none' }, 0.2);
      const LEAVE = 0.38;
      tl.to(tilt, { phi: 0.16, lift: -104, duration: 0.75, ease: 'power2.out', onUpdate: applyTilt }, LEAVE);
      tl.to(seam, { opacity: 1, strokeWidth: 4.2, duration: 0.12, ease: 'power2.out' }, 0.56)
        .to(seam, { opacity: 0.9, strokeWidth: 2, duration: 0.55, ease: 'power2.inOut' }, 0.68);
      tl.fromTo(q('.chest__burst'), { opacity: 0, scale: 0.2 }, { opacity: 0.85, scale: 0.72, duration: 0.1, ease: 'power2.out' }, 0.53)
        .to(q('.chest__burst'), { opacity: 0, scale: 1.35, duration: 0.75, ease: 'power2.out' }, 0.63);
      tl.to(svg, { y: 7, duration: 0.11, ease: 'power2.out' }, 0.56)
        .to(svg, { y: 0, duration: 0.85, ease: 'elastic.out(1, 0.38)' }, 0.67);
      coins.forEach((c, i) => {
        const n = i - (coins.length - 1) / 2;
        const at = 0.58 + i * 0.035;
        tl.fromTo(c,
          { x: 0, y: 22, scaleX: 0.3, scaleY: 0.9, opacity: 0, rotation: -70 },
          { x: n * 56, y: -104 - Math.abs(n) * 8, scaleX: 1.15, scaleY: 1.15, opacity: 1, rotation: 12, duration: 0.5, ease: 'expo.out' }, at)
          .to(c, { scaleX: 1, scaleY: 1, rotation: 0, y: '-=14', duration: 0.45, ease: 'back.out(2)' }, at + 0.5);
      });
    } else {
      tl.to(coins, { opacity: 0, y: '+=18', scale: 0.7, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, 0)
        .set(coins, { x: 0, y: 0, scale: 0.2 })
        .to(seam, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0)
        .to(tilt, { phi: 0, lift: 0, duration: 0.55, ease: 'power2.in', onUpdate: applyTilt }, 0.1)
        .to(svg, { scale: 0.988, duration: 0.1, ease: 'power2.out', transformOrigin: '50% 88%' }, 0.65)
        .to(svg, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', transformOrigin: '50% 88%' }, 0.75);
    }
    return () => { tl.kill(); };
  }, [open]);

  return (
    <div ref={host} className="chest chest--reel" data-motion="pending">
      <div className="chest__stage">
        <div className="chest__shadow" aria-hidden="true" />
        <span className="chest__burst" aria-hidden="true" />
        <div ref={art} className="chest__art" />
        <div className="chest__payload" aria-hidden="true">
          {PAYLOAD.map((p) => (
            <span key={p.src} className="chest__coin" data-mark={p.mark || undefined} style={{ width: DISC, height: DISC, marginLeft: -DISC / 2, marginTop: -DISC / 2 }}>
              {p.mark ? <i className="chest__mark" /> : <img className="chest__coinArt" src={p.src} alt="" width={GLYPH} height={GLYPH} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
