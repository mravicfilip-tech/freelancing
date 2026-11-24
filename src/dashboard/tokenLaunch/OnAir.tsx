import { useEffect, useRef } from 'react';
import { electric, fromPolyline, type Electric } from './electric';
import { LAUNCH } from './content';
import { charge, rest, sway, type ArtProps, type Direction } from './motion';
import { useTheme, wireLook } from './wireLook';
import './OnAir.css';

/**
 * Direction 3, On Air: the session as the product it will be. On the left, a picture rather than
 * words: an audio player in the electric wire, the recording drawn as a waveform with each founder's
 * voice in their own flat colour, a playhead running along it and the bars behind it moving with the
 * voice, and the playhead itself a live wire, the cards' electricity crackling down it. On the right, the only words: a live Q&A
 * feed, the question being answered on top, the queue moving up as a new one arrives.
 *
 * It arrives the way the ticket does: the player charges in the dark while the wire traces it,
 * flips round lit, the recording rises bar by bar and the feed fills in beside it. Laid out on its own
 * 1000 × 560 units (`--a`): the player 0–560, the feed 590–1000.
 */

const SLOT = 140; // one card's pitch in the feed
const SLOT0 = 56; // the first card's top, under the feed's heading
/** the three founders, each a flat colour along the recording */
const VOICES = ['#aeb0ff', '#d9f24e', '#7fd6ff'];
const BARS = 40;
/** who has the floor, bar by bar: [from, to, voice] */
const TURNS: [number, number, number][] = [
  [0, 9, 0],
  [10, 17, 1],
  [18, 25, 0],
  [26, 32, 2],
  [33, 39, 1],
];
/** each bar: its height (a speech-like envelope over a fixed seed) and whose voice it is */
const WAVEFORM = (() => {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: BARS }, (_, i) => {
    const [from, to, who] = TURNS.find(([f, t]) => i >= f && i <= t)!;
    const edge = i === from || i === to ? 0.55 : 1; // a breath between speakers
    const phrase = 0.5 + 0.5 * Math.abs(Math.sin(i * 0.37) * Math.sin(i * 0.13 + 0.6));
    return { h: Math.max(0.12, Math.min(1, phrase * edge * (0.4 + 0.6 * rnd()))).toFixed(2), who };
  });
})();

/** a rounded rectangle as points, clockwise from the top left, in the host's pixels */
export function rounded(w: number, h: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
    for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
  };
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    const n = Math.max(6, Math.round((Math.abs(a1 - a0) * r) / 4));
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  line(r, 0, w - r, 0);
  arc(w - r, r, -Math.PI / 2, 0);
  line(w, r, w, h - r);
  arc(w - r, h - r, 0, Math.PI / 2);
  line(w - r, h, r, h);
  arc(r, h - r, Math.PI / 2, Math.PI);
  line(0, h - r, 0, r);
  arc(r, r, Math.PI, (3 * Math.PI) / 2);
  return pts;
}

/** the session's running time, ticking (cosmetic) */
function Clock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let t = 42 * 60 + 18;
    const show = () => {
      if (ref.current) ref.current.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    };
    show();
    const id = window.setInterval(() => {
      t += 1;
      show();
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span ref={ref} className="lo__clock" />;
}

/** each recording's own wire, for the idle surges */
const zaps = new WeakMap<Element, Electric>();

export function OnAirArt({ ctl, running, drawn = true }: ArtProps) {
  const host = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const own = useRef<Electric | null>(null);
  const recRef = useRef<HTMLDivElement>(null);
  const boltRef = useRef<HTMLSpanElement>(null);
  const zapRef = useRef<HTMLCanvasElement>(null);
  const zap = useRef<Electric | null>(null);
  const theme = useTheme();

  // the playhead is the live wire: the cards' electricity run down a hairline the height of the
  // recording, crackling and throwing arcs, carried along with the playhead
  useEffect(() => {
    const rec = recRef.current;
    const bolt = boltRef.current;
    if (!rec || !bolt || !zapRef.current) return;
    const e = electric(zapRef.current, bolt, {
      ...wireLook(bolt, theme, 0.6),
      pad: 0.5,
      shape: (w, h) => {
        const x = w / 2;
        return fromPolyline([
          [x - 1, 0],
          [x + 1, 0],
          [x + 1, h],
          [x - 1, h],
        ]);
      },
      unit: () => (rec.offsetWidth || 330) / 330,
      amp: 0.7,
      surgeAmp: 0.8,
      halo: 0.45,
      sparks: false,
      draw: 1,
    });
    e.setRunning(running);
    zap.current = e;
    zaps.set(rec, e);
    return () => {
      e.stop();
      zap.current = null;
      zaps.delete(rec);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    if (!host.current || !fx.current) return;
    const e = electric(fx.current, host.current, {
      ...wireLook(host.current, theme),
      pad: 0.1,
      shape: (w, h) => fromPolyline(rounded(w, h, (w * 30) / 560)),
      unit: (w) => w / 420,
      amp: 0.3,
      surgeAmp: 0.25,
      halo: 0.55,
      sparks: false,
      draw: drawn ? 1 : 0,
      tip: 'comet',
    });
    e.setRunning(running);
    own.current = e;
    ctl.current = e;
    return () => {
      e.stop();
      own.current = null;
      ctl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctl, theme]);

  useEffect(() => {
    own.current?.setRunning(running);
    zap.current?.setRunning(running);
  }, [running]);

  return (
    <div className="lo">
      <span className="lo__wave" aria-hidden="true" />

      {/* the stream: who is speaking, what they are saying, and where the session has got to */}
      <div className="lo__pose">
        <div ref={host} className="lo__player">
          <div className="lo__art">
            <div className="lo__bar">
              <span className="lo__live">{LAUNCH.badge}</span>
              <span className="lo__voices" aria-hidden="true">
                {VOICES.map((c) => (
                  <i key={c} style={{ '--c': c } as React.CSSProperties} />
                ))}
              </span>
              <Clock />
            </div>
            {/* the recording: each founder's voice in their colour, played up to the playhead */}
            <div ref={recRef} className="lo__rec" aria-hidden="true">
              {['', ' lo__played', ' lo__shine'].map((k) => (
                <span key={k} className={`lo__bars${k}`}>
                  {WAVEFORM.map((b, n) => (
                    <i key={n} style={{ '--h': b.h, '--c': VOICES[b.who] } as React.CSSProperties} />
                  ))}
                </span>
              ))}
              {/* launch words that rise out of the recording at the playhead */}
              <span className="lo__words">
                {LAUNCH.words.map((w) => (
                  <i key={w} className="lo__word">
                    {w}
                  </i>
                ))}
              </span>
              <span ref={boltRef} className="lo__bolt">
                <canvas ref={zapRef} className="lo__zap" />
              </span>
              <span className="lo__head" />
            </div>
            <div className="lo__controls" aria-hidden="true">
              <svg className="lo__skip" viewBox="0 0 24 24">
                <path d="M11.5 6.5 5 12l6.5 5.5ZM19 6.5 12.5 12l6.5 5.5Z" />
              </svg>
              <span className="lo__play">
                <i />
                <i />
              </span>
              <svg className="lo__skip" viewBox="0 0 24 24">
                <path d="M12.5 6.5 19 12l-6.5 5.5ZM5 6.5 11.5 12 5 17.5Z" />
              </svg>
            </div>
          </div>
          <canvas ref={fx} className="lo__fx" aria-hidden="true" />
        </div>
      </div>

      {/* the community's questions, the top one being answered */}
      <div className="lo__feed" aria-hidden="true">
        <div className="lo__feedHead">
          <span>Live questions</span>
        </div>
        {LAUNCH.questions.map((q, i) => (
          <div key={q.who} className="lo__card" data-slot={i} data-now={i === 0 || undefined} style={{ '--slot': i } as React.CSSProperties}>
            <svg className="lo__trace" viewBox="0 0 410 128" preserveAspectRatio="none" aria-hidden="true">
              <rect x="0.8" y="0.8" width="408.4" height="126.4" rx="20" pathLength="100" />
            </svg>
            {/* while connecting: the card's skeleton, shimmering, until the question arrives */}
            <div className="lo__skel" aria-hidden="true">
              <i />
              <b />
              <b />
            </div>
            <div className="lo__cardIn">
              <div className="lo__cardTop">
                <img className="lo__who" src={q.photo} alt="" width={52} height={52} decoding="async" />
                <span className="lo__handle">{q.who}</span>
                <span className="lo__nowTag">Answering now</span>
                <span className="lo__votes" data-dir={q.votes < 0 ? 'down' : 'up'}>
                  <svg viewBox="0 0 12 12">
                    <path d={q.votes < 0 ? 'M6 9.5 10 4H2Z' : 'M6 2.5 10 8H2Z'} />
                  </svg>
                  {Math.abs(q.votes)}
                </span>
              </div>
              {/* the question fills the space under the top row, centred when it is one line */}
              <div className="lo__qBox">
                <p className="lo__q">{q.q}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const airDirection: Direction = {
  id: 'air',
  head: true,
  Art: OnAirArt,
  enter(gsap, scope, ctl, o) {
    const q = (s: string) => Array.from(scope.querySelectorAll<HTMLElement>(s));
    // the player's chrome is what goes dark and lights; its plate stays a deep navy so the recording
    // can be seen buffering on it
    const { tl, lit } = charge(gsap, scope, ctl, o, { pose: '.lo__pose', art: '.lo__bar, .lo__controls', wave: '.lo__wave' });
    const rec = scope.querySelector<HTMLElement>('.lo__rec');
    const art = scope.querySelector<HTMLElement>('.lo__art');
    const base = q('.lo__bars:not(.lo__played):not(.lo__shine) i');
    const all = q('.lo__bars i');
    const live = q('.lo__card:not([data-slot="3"])');
    const traces = live.map((c) => c.querySelector('.lo__trace')!);
    const skels = live.map((c) => c.querySelector('.lo__skel')!);
    const T = o.trace;

    // ---- start states, now
    gsap.set(art, { '--lit': 0 });
    gsap.set(rec, { '--p': 0, '--buffer': 1 });
    gsap.set(all, { scaleY: 0.05 });
    gsap.set(q('.lo__head, .lo__shine, .lo__bolt'), { opacity: 0 });
    gsap.set(q('.lo__cardIn, .lo__feedHead'), { opacity: 0 });
    gsap.set(traces, { opacity: 0.75 });
    gsap.set(q('.lo__trace rect'), { strokeDasharray: 100, strokeDashoffset: 100 });
    gsap.set(skels, { opacity: 0 });

    // ---- connecting: the plate warms, the recording buffers in bar by bar with the bar below, and
    // the feed's cards are traced and fill with skeletons, shimmering
    tl.to(art, { '--lit': 0.45, duration: T, ease: 'power1.in' }, 0);
    tl.to(base, { scaleY: 1, duration: 0.4, ease: 'back.out(2.2)', stagger: (T * 0.9) / BARS }, 0.05);
    tl.to(q('.lo__trace rect'), { strokeDashoffset: 0, duration: T * 0.55, ease: 'power2.inOut', stagger: T * 0.12 }, 0);
    tl.to(skels, { opacity: 1, duration: 0.3, ease: 'power1.out', stagger: T * 0.12 }, T * 0.45);

    // ---- lit: the plate floods, the voices pour into the recording up to the playhead, the
    // questions replace their skeletons
    tl.to(art, { '--lit': 1, duration: 0.5, ease: 'power2.out' }, lit);
    tl.set(rec, { '--buffer': 0 }, lit);
    tl.set(q('.lo__played i, .lo__shine i'), { scaleY: 1 }, lit);
    tl.to(q('.lo__bolt'), { opacity: 1, duration: 0.15, ease: 'none' }, lit + 0.08);
    tl.to(rec, { '--p': 0.34, duration: 0.9, ease: 'power3.out' }, lit + 0.1);
    tl.add(() => (rec ? zaps.get(rec)?.surge(3) : undefined), lit + 0.15);
    tl.fromTo(q('.lo__head'), { opacity: 0, scaleY: 0.3 }, { opacity: 1, scaleY: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, lit + 0.55);
    tl.to(q('.lo__shine'), { opacity: 0.6, duration: 0.4, ease: 'none' }, lit + 0.9);
    tl.to(q('.lo__feedHead'), { opacity: 1, duration: 0.4, ease: 'power2.out' }, lit + 0.15);
    tl.to(skels, { opacity: 0, duration: 0.3, ease: 'power1.in', stagger: 0.1 }, lit + 0.2);
    tl.fromTo(q('.lo__cardIn'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.1, immediateRender: false }, lit + 0.3);
    tl.to(traces, { opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 }, lit + 0.45);
    return tl;
  },
  settle(gsap, scope, ctl, delay = 0) {
    const rec = scope.querySelector<HTMLElement>('.lo__rec');
    const layers = Array.from(scope.querySelectorAll<HTMLElement>('.lo__bars')).map((l) => Array.from(l.children) as HTMLElement[]);
    const pos = { p: 0.34 };
    let live: number[] = [];
    sway(gsap, scope, '.lo__pose', delay, 0.4);
    // the playhead runs along the recording; the bars just behind it move with the voice, and the
    // founder whose turn it is is marked at the top
    gsap.to(pos, { p: 0.97, duration: 30, ease: 'none', repeat: -1, delay });
    gsap.to({}, {
      duration: 1,
      repeat: -1,
      delay,
      onUpdate: () => {
        const t = performance.now() / 1000;
        rec?.style.setProperty('--p', pos.p.toFixed(4));
        const head = Math.min(BARS - 1, Math.floor(pos.p * BARS));
        const near = [head - 2, head - 1, head].filter((n) => n >= 0);
        live.filter((n) => !near.includes(n)).forEach((n) => layers.forEach((l) => l[n].style.removeProperty('--k')));
        near.forEach((n, j) => {
          const k = (0.55 + 0.65 * Math.abs(Math.sin(t * (6.1 + j * 2.3) + n))).toFixed(3);
          layers.forEach((l) => l[n].style.setProperty('--k', k));
        });
        live = near;
      },
    });

    // the words: every so often one rises out of the recording just behind the playhead, outlined in
    // the colour of whoever is speaking, floats up and fades; above and below the line in turn
    const words = Array.from(scope.querySelectorAll<HTMLElement>('.lo__word'));
    let nextWord = 0;
    let side = 0;
    gsap.timeline({ repeat: -1, repeatDelay: 2.1, delay: delay + 1.2 }).call(() => {
      const el = words[nextWord];
      nextWord = (nextWord + 1) % words.length;
      if (!el) return;
      const head = Math.min(BARS - 1, Math.floor(pos.p * BARS));
      el.style.setProperty('--c', VOICES[WAVEFORM[head].who]);
      el.style.left = `${(pos.p * 100 - 2).toFixed(2)}%`;
      el.style.top = side % 2 ? '72%' : '22%';
      side += 1;
      gsap.killTweensOf(el);
      gsap.timeline()
        .fromTo(el, { opacity: 0, y: 12, x: 0, scale: 0.8 }, { opacity: 1, y: -6, x: -10, scale: 1, duration: 0.45, ease: 'back.out(2.2)' })
        .to(el, { opacity: 0, y: -34, x: -26, duration: 0.9, ease: 'power1.in' }, 1.1);
    });

    // the feed: the top question is answered and leaves, the queue moves up, a new one arrives
    // Stacked on a phone (--stack, set by the CSS) the feed is the full width and shows only the
    // question being answered.
    const lo = scope.querySelector('.lo');
    const stacked = !!lo && getComputedStyle(lo).getPropertyValue('--stack').trim() === '1';
    const shown = stacked ? 1 : 3;
    const cards = Array.from(scope.querySelectorAll<HTMLElement>('.lo__card'));
    const px = () => (scope.offsetWidth || 1000) / (stacked ? 410 : 1000);
    const Y = (slot: number) => (SLOT0 + slot * SLOT) * px();
    let order = cards.map((_, i) => i);
    cards.forEach((c, i) => gsap.set(c, { y: Y(i), opacity: i < shown ? 1 : 0 }));
    const feed = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: delay + 2.6 });
    feed.call(() => {
      const [top, ...queue] = order;
      const leaving = cards[top];
      delete leaving.dataset.now;
      gsap.to(leaving, { y: Y(0) - 26 * px(), opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: () => void gsap.set(leaving, { y: Y(3) + 20 * px() }) });
      queue.forEach((ci, slot) => {
        gsap.to(cards[ci], { y: Y(slot), opacity: slot < shown ? 1 : 0, duration: 0.65, ease: 'power3.inOut', delay: 0.18 });
      });
      gsap.delayedCall(0.5, () => {
        cards[queue[0]].dataset.now = '';
      });
      order = [...queue, top];
    });
    const zap = rec ? zaps.get(rec) : undefined;
    gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: delay + 0.8 }).add(() => {
      ctl.current?.surge(1.6);
      zap?.surge(2.4);
    }, 0);
  },
  still(gsap, scope, duration = 0.35) {
    rest(gsap, Array.from(scope.querySelectorAll('.lo__pose')), duration);
    gsap.set(scope.querySelectorAll('.lo__bars i'), { scaleY: 1 });
    gsap.set(scope.querySelectorAll('.lo__skel'), { opacity: 0 });
    const words = scope.querySelectorAll('.lo__word');
    gsap.killTweensOf(words);
    gsap.set(words, { opacity: 0 });
  },
};
