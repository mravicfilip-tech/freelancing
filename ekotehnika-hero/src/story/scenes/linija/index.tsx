// Linija, the drawn scene. The board keyframes in src/board/beats.tsx drawn live inside one SVG that
// covers the stage. The board frame is 1440 by 900 with the scene area to the right of the panel, so
// this fits that frame to any stage the way variant 2 fits its own, by one scale and one anchor.
// It re-renders only when the beat or k changed. A beat change dissolves from the last picture of the
// old beat to the first of the new one, so the cuts the storyboard keeps (a new place, the map card)
// read as a soft change and the scenes that continue never jump.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { SceneProps } from '../../clock';
import { C } from '../../../tokens';
import { BEATS } from '../../../board/beats';
import { BoardDefs } from '../../../board/vehicles';
import { GROUND, SCALE } from '../../../board/scene';
import './linija.css';

const FRAME_W = 1440;
const FRAME_H = 900;
const FRAME_CLIP = 488; // left edge of the scene area in the board frame
const FRAME_CX = 952; // scene centre line in the board frame
const FRAME_GROUND = 744;
const SU_X = 251; // scene unit x that sits on the centre line
const DISSOLVE_MS = 420;

type Frame = { beat: number; k: number };
type Prev = Frame & { nonce: number };

// The shell's panel is 30vw clamped 380 to 470 with a 24px margin, the scene area starts 24px after it.
const panelWidth = (w: number) => Math.min(470, Math.max(380, w * 0.3));

function useBox(ref: React.RefObject<HTMLDivElement | null>) {
  const [box, setBox] = useState({ w: FRAME_W, h: FRAME_H });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setBox((b) => (b.w === r.width && b.h === r.height ? b : { w: r.width, h: r.height }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

export default function Linija({ clock }: SceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { w, h } = useBox(rootRef);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [frame, setFrame] = useState<Frame>({ beat: clock.beat.current, k: clock.k.current });
  const [prev, setPrev] = useState<Prev | null>(null);
  const nonce = useRef(0);
  const [live, setLive] = useState(0);

  // Read the clock every animation frame, set state only when the beat or k changed.
  useEffect(() => {
    let id = 0;
    let last: Frame = { beat: clock.beat.current, k: clock.k.current };
    let timer = 0;
    setFrame(last);
    const loop = () => {
      const b = clock.beat.current;
      const k = Math.round(clock.k.current * 2000) / 2000;
      if (b !== last.beat || k !== last.k) {
        if (b !== last.beat && !clock.still) {
          nonce.current += 1;
          setPrev({ beat: last.beat, k: b > last.beat ? 1 : 0, nonce: nonce.current });
          setLive(nonce.current);
          window.clearTimeout(timer);
          timer = window.setTimeout(() => setPrev(null), DISSOLVE_MS + 40);
        }
        last = { beat: b, k };
        setFrame(last);
      }
      if (!clock.still) id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(timer);
    };
  }, [clock]);

  // Fit the board frame, one scale from the stage height or the scene area width, whichever is smaller.
  const clipX = panelWidth(w) + 48;
  const s = Math.min(h / FRAME_H, (w - clipX) / (FRAME_W - FRAME_CLIP));
  const cx = clipX + (w - clipX) * ((FRAME_CX - FRAME_CLIP) / (FRAME_W - FRAME_CLIP));
  const groundY = (FRAME_GROUND / FRAME_H) * h;
  const sceneT = `translate(${cx - SU_X * SCALE * s} ${groundY - GROUND * SCALE * s}) scale(${SCALE * s})`;
  const frameT = `translate(${cx - FRAME_CX * s} ${groundY - FRAME_GROUND * s}) scale(${s})`;

  const layer = (f: Frame, cls: string, key: string) => {
    const out = BEATS[f.beat].scene(f.k);
    return (
      <g key={key} className={cls}>
        <g transform={sceneT}>{out.children}</g>
        <g transform={frameT}>{out.overlay}</g>
        {out.dim ? <rect x={-10} y={-10} width={w + 20} height={h + 20} fill={C.ink} opacity={out.dim} /> : null}
      </g>
    );
  };

  const dissolving = live > 0 && prev !== null;
  return (
    <div ref={rootRef} className="lj-root" aria-hidden="true">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} focusable="false">
        <BoardDefs />
        <clipPath id={`${uid}-clip`}>
          <rect x={clipX} y={0} width={Math.max(0, w - clipX)} height={h} />
        </clipPath>
        <rect width={w} height={h} fill={C.hoverLightGrey} />
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x={clipX} y={groundY} width={w - clipX} height={h - groundY} fill={C.shadeGrey} />
          <rect x={clipX} y={groundY - 1} width={w - clipX} height={1.4 * s} fill={C.tonedTextGrey} opacity={0.35} />
          {layer(frame, dissolving ? 'lj-in' : '', `cur${live}`)}
          {dissolving && prev ? layer(prev, 'lj-out', `prev${prev.nonce}`) : null}
        </g>
      </svg>
    </div>
  );
}
