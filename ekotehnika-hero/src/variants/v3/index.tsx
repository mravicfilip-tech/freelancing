// Variant 3, Crveni sat. A 1:1 study of the Terminal Industries hero in Linde colours. A pinned
// film of about 7000px. A Linde truck in side profile against a red sky, the camera pulling back
// to a yard at the same hour, the truck turning to light, the yard going dark into dust, and a lit
// grid where light trails land. A floating frosted nav sits over all of it.
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { band, range, smooth, useScrollStory } from '../../scroll/useScrollStory';
import { C } from '../../tokens';
import { Film } from './Scene';
import { Nav } from './Nav';
import { STORY_TEXT, Story } from './Story';
import { makeUniforms } from './fx';
import './v3.css';

const LENGTH = 7000;
// The still frame for reduced motion, the opening with the full first statement.
const STILL = 0.17;

export default function Variant3({ reduced }: { reduced: boolean }) {
  const { stageRef, raw, goTo } = useScrollStory({ length: LENGTH, reduced });
  const u = useMemo(makeUniforms, []);
  const navRef = useRef<HTMLElement>(null);
  // The film's own clock. It eases toward the scroll by time, not by frame, so camera moves keep
  // the same feel on a slow machine.
  const progress = useRef(reduced ? STILL : 0);

  useEffect(() => {
    if (reduced) {
      goTo(STILL);
      progress.current = STILL;
      return;
    }
    const tick = (_t: number, dt: number) => {
      const k = 1 - Math.exp((-Math.min(dt, 250) / 1000) * 4.2);
      progress.current += (raw.current - progress.current) * k;
      if (Math.abs(raw.current - progress.current) < 0.00002) progress.current = raw.current;
    };
    gsap.ticker.add(tick);
    // A dev only handle for the frame shooting script.
    if (import.meta.env.DEV) (window as unknown as { __v3?: unknown }).__v3 = { progress, raw };
    return () => gsap.ticker.remove(tick);
    // goTo and raw are stable for the life of the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // The nav turns light once the page below the film slides under it. The tilt shift blur comes
  // in over the aerial chapters.
  const dofRef = useRef<HTMLDivElement>(null);
  const gradeRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let lastDof = -1;
    let lastGrade = '';
    const tick = () => {
      const p = progress.current;
      // the colour grade, warm over the lit chapters, gone in the dark
      const lit = 1 - smooth(range(p, 0.52, 0.62));
      const air = band(p, 0.12, 0.32, 0.5, 0.6);
      const g = `${(lit * (0.22 + air * 0.22)).toFixed(3)}|${(lit * air * 0.85).toFixed(3)}`;
      if (g !== lastGrade && gradeRef.current && hazeRef.current) {
        lastGrade = g;
        const [a, b] = g.split('|');
        gradeRef.current.style.opacity = a;
        hazeRef.current.style.opacity = b;
      }
      const d = Math.round(band(p, 0.16, 0.32, 0.62, 0.72) * 100) / 100;
      if (dofRef.current && d !== lastDof) {
        lastDof = d;
        dofRef.current.style.opacity = String(d);
        dofRef.current.style.visibility = d > 0 ? 'visible' : 'hidden';
      }
      const st = stageRef.current;
      const nav = navRef.current;
      if (!st || !nav) return;
      const holder = st.parentElement?.classList.contains('pin-spacer') ? st.parentElement : st;
      const light = holder.getBoundingClientRect().bottom < 110;
      if (nav.dataset.light !== String(light)) nav.dataset.light = String(light);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [stageRef]);

  return (
    <section className="v3" aria-label="Ekotehnika, Linde viljuškari">
      <Nav ref={navRef} />
      <div ref={stageRef} className="v3-stage">
        <div className="v3-canvas">
          <Canvas
            shadows="soft"
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ fov: 24, near: 0.1, far: 900, position: [-29.3, 0.35, 13.5] }}
            style={{ background: C.ink }}
          >
            <Suspense fallback={null}>
              <Film progress={progress} reduced={reduced} u={u} />
            </Suspense>
          </Canvas>
        </div>
        <div ref={gradeRef} className="v3-grade" aria-hidden="true" />
        <div ref={hazeRef} className="v3-haze" aria-hidden="true" />
        <div ref={dofRef} className="v3-dof" aria-hidden="true">
          <div className="v3-dof-top" />
          <div className="v3-dof-bottom" />
        </div>
        <div className="v3-vignette" aria-hidden="true" />
        <div className="v3-grain" aria-hidden="true" />
        <h1 className="sr-only">{STORY_TEXT.h1}</h1>
        <p className="sr-only">{STORY_TEXT.rest}</p>
        <Story progress={progress} reduced={reduced} still={STILL} />
      </div>
    </section>
  );
}
